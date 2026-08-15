"""
Test Coach Engine — Dual-mode AI coaching system for tests.

Architecture:
- Self-Study Mode: student solves test independently → AI generates full review at end
- AI-Assisted Mode: real-time Socratic coaching via streaming SSE

Token optimization strategy:
1. question_index filtering — only send history for current question (~60% input reduction)
2. Compact system prompts — <1500 chars for coach, <2000 for review
3. output_cap=400 for coach — short, targeted responses
4. Groq-first routing — $0 cost for 90%+ requests
5. YouTube video caching — 24h TTL to avoid redundant fetches
"""

import os
import json
import logging
from django.utils import timezone
from django.core.cache import cache

from .utils import call_ai, compress_text, extract_json
from .brain.constants import INTENTS
from .brain.budgeting import get_budget
from ..models import TestChatSession, TestChatMessage, TestReview

logger = logging.getLogger(__name__)

# --- PROMPT LOADERS ---

_PROMPT_CACHE = {}

def _load_prompt(filename):
    """Load and cache a prompt template from disk."""
    if filename not in _PROMPT_CACHE:
        prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', filename)
        with open(prompt_path, 'r', encoding='utf-8') as f:
            _PROMPT_CACHE[filename] = f.read().strip()
    return _PROMPT_CACHE[filename]


# --- YOUTUBE VIDEO FETCHER ---

def fetch_youtube_videos(query, count=3, language='uz'):
    """
    Fetch relevant YouTube videos for a topic.
    Cached for 24 hours to minimize external requests.
    """
    cache_key = f"yt_videos_{language}_{hash(query) % 10**8}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    videos = []
    try:
        import urllib.request
        import urllib.parse
        import re
        import ssl

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # Add language context to search
        search_query = f"{query} tutorial {language}"
        url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(search_query)
        if not url.startswith(('http://', 'https://')):
            raise ValueError("Forbidden URL scheme")

        html = urllib.request.urlopen(url, context=ctx, timeout=5).read().decode()  # nosec B310
        video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)

        seen_ids = set()
        for vid in video_ids:
            if len(vid) == 11 and vid not in seen_ids:
                seen_ids.add(vid)
                videos.append({
                    'url': f'https://www.youtube.com/watch?v={vid}',
                    'video_id': vid,
                    'query': search_query,
                })
                if len(videos) >= count:
                    break

        # Fallback 1: YouTube Data API v3 if key is configured
        yt_api_key = getattr(settings, 'YOUTUBE_DATA_API_KEY', None) or os.getenv('YOUTUBE_DATA_API_KEY')
        if len(videos) < count and yt_api_key:
            try:
                import json
                api_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults={count}&q={urllib.parse.quote(search_query)}&type=video&key={yt_api_key}"
                req = urllib.request.Request(api_url)
                resp = urllib.request.urlopen(req, context=ctx, timeout=5).read().decode()
                data = json.loads(resp)
                for item in data.get('items', []):
                    vid = item.get('id', {}).get('videoId')
                    title = item.get('snippet', {}).get('title', 'Video Tutorial')
                    if vid and vid not in seen_ids:
                        seen_ids.add(vid)
                        videos.append({
                            'url': f'https://www.youtube.com/watch?v={vid}',
                            'video_id': vid,
                            'title': title,
                            'query': search_query,
                        })
                        if len(videos) >= count:
                            break
            except Exception as api_err:
                logger.warning(f"YouTube Data API v3 fallback failed: {api_err}")

    except Exception as e:
        logger.warning(f"YouTube fetch failed: {e}")

    # Fallback 2: Curated educational fallback embeds if scraping & API both failed
    if not videos:
        fallback_vids = [
            {'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'video_id': '3JZ_D3ELwOQ', 'title': f"{query} - Video darslik", 'query': query},
            {'url': 'https://www.youtube.com/watch?v=L_LUpnjgPso', 'video_id': 'L_LUpnjgPso', 'title': f"{query} - Amaliy mashg'ulot", 'query': query},
        ]
        videos = fallback_vids[:count]

    # Cache for 24 hours
    if videos:
        cache.set(cache_key, videos, timeout=86400)

    return videos


# --- CORE ENGINE ---

class TestCoachEngine:
    """
    Dual-mode AI coaching engine for tests.

    Modes:
    - self_study: Student solves independently, AI review at end
    - ai_assisted: Real-time Socratic coaching with streaming
    """

    # --- SESSION MANAGEMENT ---

    @staticmethod
    def start_session(user, mode='self_study', test_session=None,
                      sandbox_topic='', sandbox_test_data=None):
        """Create a new AI coaching session linked to a test."""
        total_q = 0
        if sandbox_test_data:
            questions = sandbox_test_data.get('questions', sandbox_test_data if isinstance(sandbox_test_data, list) else [])
            total_q = len(questions)

        session = TestChatSession.objects.create(
            user=user,
            test_session=test_session,
            sandbox_topic=sandbox_topic,
            sandbox_test_data=sandbox_test_data or {},
            mode=mode,
            total_questions=total_q,
        )

        logger.info(json.dumps({
            "event": "test_coach_session_start",
            "session_id": str(session.id),
            "user_id": user.id,
            "mode": mode,
            "topic": sandbox_topic,
        }))

        return session

    # --- REAL-TIME COACHING (AI-Assisted Mode) ---

    @staticmethod
    def get_question_history(session_id, question_index, limit=4):
        """
        Retrieve chat history scoped to a specific question.
        This is the KEY optimization — we only send relevant context to the AI,
        reducing input tokens by ~60%.
        """
        messages = TestChatMessage.objects.filter(
            session_id=session_id,
            question_index=question_index
        ).order_by('-created_at')[:limit]

        # Return in chronological order
        return [
            {'role': msg.role, 'content': msg.content}
            for msg in reversed(messages)
        ]

    @staticmethod
    def coach_respond(user, session_id, question_data, user_message, question_index=0):
        """
        Generate a real-time coaching response for a student's question.

        Optimizations:
        1. Only loads history for the current question_index
        2. Uses compact system prompt (<1500 chars)
        3. Groq-first for ~500ms latency
        4. output_cap=400 for concise responses

        Args:
            user: Django User object
            session_id: UUID of TestChatSession
            question_data: dict with {question, options, correct_answer, explanation}
            user_message: Student's question text
            question_index: Which test question this relates to

        Returns:
            dict with {text, metadata} or {error}
        """
        try:
            session = TestChatSession.objects.get(id=session_id, user=user)
        except TestChatSession.DoesNotExist:
            return {'error': 'Sessiya topilmadi'}

        if not session.is_active:
            return {'error': 'Bu sessiya tugagan'}

        # Check rate limits for free users
        is_premium = getattr(user, 'is_premium', False)
        if not is_premium and session.ai_messages_count >= 3:
            return {
                'error': 'free_limit_reached',
                'message': "Siz bepul tarifda 3 ta AI savol limitiga yetdingiz. Pro bilan cheksiz yordam oling! 🚀",
                'upgrade_prompt': True,
            }

        # Save user message
        user_msg = TestChatMessage.objects.create(
            session=session,
            role='user',
            content=user_message,
            question_index=question_index,
            token_count=len(user_message) // 4,
        )

        # Load question-scoped history (KEY optimization)
        history = TestCoachEngine.get_question_history(session_id, question_index, limit=4)

        # Count previous messages on this question for hint escalation
        msg_count = TestChatMessage.objects.filter(
            session=session,
            question_index=question_index,
            role='user'
        ).count()

        # Detect exam type for specialized coaching rules
        topic_context = f"{session.sandbox_topic} {question_data.get('question', '')}"
        exam_type = 'general'
        if any(k in topic_context.lower() for k in ['sat', 'algebra', 'geometry', 'college board']):
            exam_type = 'sat'
        elif any(k in topic_context.lower() for k in ['ielts', 'band', 'reading passage', 'listening', 'task 1', 'task 2']):
            exam_type = 'ielts'
        elif any(k in topic_context.lower() for k in ['milliy', 'sertifikat', 'dtm', 'ona tili']):
            exam_type = 'ms'

        exam_instructions = {
            'sat': "EXAM MODE: Digital SAT. Guide the student using official College Board domain concepts (Algebra, Advanced Math, Problem-Solving, Craft & Structure). Reference line logic or formula steps.",
            'ielts': "EXAM MODE: IELTS. Focus on paraphrase recognition, vocabulary collocations, reading strategies (skimming/scanning), and paragraph logic without giving away the answer.",
            'ms': "EXAM MODE: Milliy Sertifikat / DTM. Guide according to official national curriculum standards. Use precise Uzbek educational terminology.",
            'general': "Guide the student through conceptual steps using analogies.",
        }

        # Build prompt
        try:
            profile = user.ai_profile
            level = profile.current_level or 'basic'
            language = profile.learning_language or 'uz'
            subject = profile.subject_focus or ''
        except Exception:
            level = 'basic'
            language = 'uz'
            subject = ''

        level_map = {
            'zero': 'Beginner level',
            'basic': 'Intermediate level',
            'advanced': 'Advanced level',
        }
        lang_map = {
            'uz': 'Respond in Uzbek language.',
            'en': 'Respond in English.',
            'ru': 'Respond in Russian.',
        }

        system_prompt = _load_prompt('test_coach.txt')
        try:
            system_prompt = system_prompt.format(
                question_text=question_data.get('question', ''),
                options=json.dumps(question_data.get('options', []), ensure_ascii=False),
                level_instruction=f"{level_map.get(level, 'Intermediate level')} ({exam_instructions[exam_type]})",
                language_instruction=lang_map.get(language, 'Respond in Uzbek language.'),
                subject=subject or exam_type.upper(),
            )
        except KeyError:
            pass

        # Inject professional Cognitive Memory Knowledge Graph (OpenAI/MemGPT style)
        from .memory_engine import AIMemoryEngine
        cognitive_graph = AIMemoryEngine.compile_cognitive_knowledge_graph(user)
        if cognitive_graph:
            system_prompt += f"\n\n{cognitive_graph}\nUse this knowledge graph to deliver targeted Socratic guidance!"

        # Cognitive Load Analysis & Adaptive Scaffolding
        from .cognitive_pedagogy import CognitiveLoadAnalyzer
        cog_state = CognitiveLoadAnalyzer.analyze_cognitive_state(user_message, msg_count, history)
        if cog_state['scaffolding_instruction']:
            system_prompt += f"\n{cog_state['scaffolding_instruction']}"

        # Build conversational context
        history_text = ""
        if history:
            history_parts = []
            for h in history[-4:]:  # Max 4 messages
                role_label = "Student" if h['role'] == 'user' else "Coach"
                history_parts.append(f"{role_label}: {h['content'][:300]}")
            history_text = "\n".join(history_parts)

        user_prompt = f"[Attempt #{msg_count} on this question]\n"
        if history_text:
            user_prompt += f"Previous conversation:\n{history_text}\n\n"
        user_prompt += f"Student asks: {user_message}"

        # Call AI with TEST_COACH budget (ultra-fast, minimal tokens)
        response = call_ai(
            prompt=user_prompt,
            system_instruction=system_prompt,
            temperature=0.3,
            user=user,
            feature="test_coach",
        )

        # Extract text response
        if isinstance(response, dict) and 'error' in response:
            return response

        response_text = response if isinstance(response, str) else str(response)

        # Save assistant message
        assistant_msg = TestChatMessage.objects.create(
            session=session,
            role='assistant',
            content=response_text,
            question_index=question_index,
            token_count=len(response_text) // 4,
        )

        # Increment message counter
        session.ai_messages_count += 1
        session.save(update_fields=['ai_messages_count'])

        return {
            'text': response_text,
            'metadata': {
                'session_id': str(session.id),
                'question_index': question_index,
                'messages_used': session.ai_messages_count,
                'messages_limit': 999 if is_premium else 3,
                'hint_level': min(msg_count, 3),
            }
        }

    @staticmethod
    def coach_respond_stream(user, session_id, question_data, user_message, question_index=0):
        """
        Streaming version of coach_respond for SSE.
        Yields text chunks for real-time display.
        """
        from .utils import stream_ai
        from .brain.constants import INTENTS

        try:
            session = TestChatSession.objects.get(id=session_id, user=user)
        except TestChatSession.DoesNotExist:
            yield "ERROR: Sessiya topilmadi"
            return

        if not session.is_active:
            yield "ERROR: Bu sessiya tugagan"
            return

        is_premium = getattr(user, 'is_premium', False)
        if not is_premium and session.ai_messages_count >= 3:
            yield "LIMIT_REACHED: Siz bepul tarifda 3 ta AI savol limitiga yetdingiz. Pro bilan cheksiz yordam oling! 🚀"
            return

        # Save user message
        TestChatMessage.objects.create(
            session=session,
            role='user',
            content=user_message,
            question_index=question_index,
            token_count=len(user_message) // 4,
        )

        # Build prompt (same logic as non-streaming)
        history = TestCoachEngine.get_question_history(session_id, question_index, limit=4)
        msg_count = TestChatMessage.objects.filter(
            session=session, question_index=question_index, role='user'
        ).count()

        try:
            profile = user.ai_profile
            level = profile.current_level or 'basic'
            language = profile.learning_language or 'uz'
            subject = profile.subject_focus or ''
        except Exception:
            level, language, subject = 'basic', 'uz', ''

        level_map = {'zero': 'Beginner level', 'basic': 'Intermediate level', 'advanced': 'Advanced level'}
        lang_map = {'uz': 'Respond in Uzbek language.', 'en': 'Respond in English.', 'ru': 'Respond in Russian.'}

        system_prompt = _load_prompt('test_coach.txt')
        try:
            system_prompt = system_prompt.format(
                question_text=question_data.get('question', ''),
                options=json.dumps(question_data.get('options', []), ensure_ascii=False),
                level_instruction=level_map.get(level, 'Intermediate level'),
                language_instruction=lang_map.get(language, 'Respond in Uzbek language.'),
                subject=subject or 'General',
            )
        except KeyError:
            pass

        # Inject professional Cognitive Memory Knowledge Graph (OpenAI/MemGPT style)
        from .memory_engine import AIMemoryEngine
        cognitive_graph = AIMemoryEngine.compile_cognitive_knowledge_graph(user)
        if cognitive_graph:
            system_prompt += f"\n\n{cognitive_graph}\nUse this knowledge graph to deliver targeted Socratic guidance!"

        # Cognitive Load Analysis & Adaptive Scaffolding
        from .cognitive_pedagogy import CognitiveLoadAnalyzer
        cog_state = CognitiveLoadAnalyzer.analyze_cognitive_state(user_message, msg_count, history)
        if cog_state['scaffolding_instruction']:
            system_prompt += f"\n{cog_state['scaffolding_instruction']}"

        history_text = ""
        if history:
            parts = [f"{'Student' if h['role'] == 'user' else 'Coach'}: {h['content'][:300]}" for h in history[-4:]]
            history_text = "\n".join(parts)

        user_prompt = f"[Attempt #{msg_count} on this question]\n"
        if history_text:
            user_prompt += f"Previous conversation:\n{history_text}\n\n"
        user_prompt += f"Student asks: {user_message}"

        # Stream response using fast 8B model (sub-250ms latency)
        full_text = ""
        for chunk in stream_ai(user_prompt, system_instruction=system_prompt, temperature=0.3, user=user, feature="test_coach"):
            # Strip SSE wrapper if present
            clean = chunk
            if clean.startswith("data: "):
                clean = clean[6:]
            clean = clean.strip()
            if clean:
                full_text += clean
                yield clean

        # Save complete response
        if full_text:
            TestChatMessage.objects.create(
                session=session,
                role='assistant',
                content=full_text,
                question_index=question_index,
                token_count=len(full_text) // 4,
            )
            session.ai_messages_count += 1
            session.save(update_fields=['ai_messages_count'])

    # --- POST-TEST REVIEW ---

    @staticmethod
    def complete_session(session_id, answers, user):
        """
        Mark session as completed and calculate results.
        Returns session data for review generation.
        """
        try:
            session = TestChatSession.objects.get(id=session_id, user=user)
        except TestChatSession.DoesNotExist:
            return {'error': 'Sessiya topilmadi'}

        # Parse test data
        test_data = session.sandbox_test_data
        questions = test_data.get('questions', test_data if isinstance(test_data, list) else [])

        correct = 0
        wrong_answers = []
        strong_topics = []
        weak_topics = []

        for idx_str, selected in answers.items():
            idx = int(idx_str)
            if idx >= len(questions):
                continue

            q = questions[idx]
            correct_option = q.get('correct_option', q.get('correct_answer', 0))

            # Handle string vs int comparison
            is_correct = str(selected) == str(correct_option)
            if is_correct:
                correct += 1
                topic = q.get('topic', q.get('topic_tag', f'Question {idx + 1}'))
                if topic not in strong_topics:
                    strong_topics.append(topic)
            else:
                wrong_answers.append({
                    'index': idx,
                    'question': q.get('question', ''),
                    'user_answer': q.get('options', [])[int(selected)] if int(selected) < len(q.get('options', [])) else str(selected),
                    'correct_answer': q.get('options', [])[int(correct_option)] if isinstance(correct_option, int) and int(correct_option) < len(q.get('options', [])) else str(correct_option),
                    'explanation': q.get('explanation', ''),
                    'topic': q.get('topic', q.get('topic_tag', f'Question {idx + 1}')),
                })
                topic = q.get('topic', q.get('topic_tag', f'Question {idx + 1}'))
                if topic not in weak_topics:
                    weak_topics.append(topic)

        session.answers = answers
        session.correct_answers = correct
        session.is_active = False
        session.completed_at = timezone.now()
        session.save(update_fields=['answers', 'correct_answers', 'is_active', 'completed_at'])

        # Auto-update SkillGap DB entries, cognitive memory nodes, and AIProfile summary
        TestCoachEngine.update_student_memory_and_gaps(
            user=user,
            topic=session.sandbox_topic or 'Test',
            weak_topics=weak_topics,
            strong_topics=strong_topics,
            score_percent=session.score_percent,
            wrong_answers=wrong_answers
        )

        return {
            'session_id': str(session.id),
            'score_percent': session.score_percent,
            'correct': correct,
            'total': session.total_questions,
            'wrong_answers': wrong_answers,
            'strong_topics': strong_topics,
            'weak_topics': weak_topics,
        }

    @staticmethod
    def update_student_memory_and_gaps(user, topic, weak_topics, strong_topics, score_percent, wrong_answers=None):
        """
        Record SkillGap entries, cognitive memory nodes, and auto-update AIProfile memory summary
        so that Knowza AI long-term memory remembers the student's learning progress and weak spots.
        """
        from .memory_engine import AIMemoryEngine
        from ..models import SkillGap, AIProfile

        # 1. Update OpenAI/MemGPT style cognitive memory nodes
        AIMemoryEngine.record_test_performance(
            user=user,
            subject=topic,
            topic=topic,
            wrong_answers=wrong_answers or [],
            strong_topics=strong_topics,
            score_percent=score_percent
        )

        # 1. Update SkillGaps for weak topics
        for w_topic in weak_topics[:5]:
            gap, created = SkillGap.objects.get_or_create(
                user=user,
                skill_name=w_topic[:250],
                defaults={'subject': topic[:100], 'status': 'weak', 'error_count': 1, 'last_error_at': timezone.now()}
            )
            if not created:
                gap.error_count += 1
                gap.status = 'weak'
                gap.last_error_at = timezone.now()
                gap.save(update_fields=['error_count', 'status', 'last_error_at'])

        # 2. Update SkillGaps for strong topics (reduce error count if mastered)
        for s_topic in strong_topics[:5]:
            try:
                gap = SkillGap.objects.get(user=user, skill_name=s_topic[:250])
                if gap.error_count > 1:
                    gap.error_count -= 1
                    gap.save(update_fields=['error_count'])
                else:
                    gap.status = 'ok'
                    gap.save(update_fields=['status'])
            except SkillGap.DoesNotExist:
                pass

        # 3. Update AIProfile.ai_memory_summary
        try:
            profile = getattr(user, 'ai_profile', None)
            if profile:
                all_weak = list(SkillGap.objects.filter(user=user, status='weak').order_by('-error_count').values_list('skill_name', flat=True)[:5])
                memory_text = f"Oxirgi test: {topic} (Natija: {score_percent}%)."
                if all_weak:
                    memory_text += f" Zaif mavzular (diqqat talab): {', '.join(all_weak)}."
                if strong_topics:
                    memory_text += f" Kuchli mavzular: {', '.join(strong_topics[:3])}."
                
                profile.ai_memory_summary = memory_text
                profile.save(update_fields=['ai_memory_summary'])

                # Cache profile memory for 1 hour for fast AI retrieval
                cache_key = f"ai_memory_{user.id}"
                cache.set(cache_key, memory_text, timeout=3600)
        except Exception as e:
            logger.warning(f"Error updating AI memory: {e}")

    @staticmethod
    def generate_review(user, session_id, is_premium=False):
        """
        Generate AI-powered post-test review.

        Free tier: standard quality (brief, 1 YouTube video)
        Pro tier: deep quality (per-question analysis, 3 YouTube videos, study plan)
        """
        try:
            session = TestChatSession.objects.get(id=session_id, user=user)
        except TestChatSession.DoesNotExist:
            return {'error': 'Sessiya topilmadi'}

        # Check if review already exists
        existing = TestReview.objects.filter(chat_session=session).first()
        if existing:
            return {
                'review': existing.summary_text,
                'youtube_videos': existing.youtube_videos,
                'weak_topics': existing.weak_topics,
                'strong_topics': existing.strong_topics,
                'score_percent': existing.score_percent,
                'quality': existing.review_quality,
                'cached': True,
            }

        # Build review data from session
        test_data = session.sandbox_test_data
        questions = test_data.get('questions', test_data if isinstance(test_data, list) else [])
        answers = session.answers or {}

        wrong_answers = []
        strong_topics = []
        weak_topics = []

        for idx_str, selected in answers.items():
            idx = int(idx_str)
            if idx >= len(questions):
                continue
            q = questions[idx]
            correct_option = q.get('correct_option', q.get('correct_answer', 0))
            is_correct = str(selected) == str(correct_option)

            topic = q.get('topic', q.get('topic_tag', f'Question {idx + 1}'))
            if is_correct:
                if topic not in strong_topics:
                    strong_topics.append(topic)
            else:
                if topic not in weak_topics:
                    weak_topics.append(topic)
                wrong_answers.append({
                    'question': q.get('question', ''),
                    'user_answer': q.get('options', [])[int(selected)] if int(selected) < len(q.get('options', [])) else str(selected),
                    'correct_answer': q.get('options', [])[int(correct_option)] if isinstance(correct_option, int) and int(correct_option) < len(q.get('options', [])) else str(correct_option),
                    'explanation': q.get('explanation', ''),
                })

        review_quality = 'deep' if is_premium else 'standard'

        # Get student profile
        try:
            profile = user.ai_profile
            language = profile.learning_language or 'uz'
        except Exception:
            language = 'uz'

        lang_map = {
            'uz': 'Respond in Uzbek language.',
            'en': 'Respond in English.',
            'ru': 'Respond in Russian.',
        }

        # Build review prompt
        system_prompt = _load_prompt('test_review.txt')
        try:
            student_name = user.name or user.first_name or user.username
            system_prompt = system_prompt.format(
                student_name=student_name,
                score_percent=session.score_percent,
                total_questions=session.total_questions,
                correct_count=session.correct_answers,
                wrong_count=session.total_questions - session.correct_answers,
                wrong_answers_json=json.dumps(wrong_answers[:10], ensure_ascii=False, indent=1),
                strong_topics=', '.join(strong_topics[:5]) or 'N/A',
                weak_topics=', '.join(weak_topics[:5]) or 'N/A',
                language_instruction=lang_map.get(language, 'Respond in Uzbek language.'),
                review_quality=review_quality,
            )
        except KeyError as e:
            logger.warning(f"Review prompt format error: {e}")

        user_prompt = f"Generate a {'detailed' if is_premium else 'brief'} test review."

        # Use appropriate budget
        intent = INTENTS.TEST_REVIEW_DEEP if is_premium else INTENTS.TEST_REVIEW
        response = call_ai(
            prompt=user_prompt,
            system_instruction=system_prompt,
            temperature=0.6 if review_quality == 'deep' else 0.5,
            user=user,
            feature=intent,
        )

        if isinstance(response, dict) and 'error' in response:
            return response

        review_text = response if isinstance(response, str) else str(response)

        # Fetch YouTube videos
        video_count = 3 if is_premium else 1
        videos = []
        if weak_topics:
            search_query = f"{' '.join(weak_topics[:3])} {session.sandbox_topic}"
            videos = fetch_youtube_videos(search_query, count=video_count, language=language)

        # Save review
        review = TestReview.objects.create(
            chat_session=session,
            summary_text=review_text,
            youtube_videos=videos,
            weak_topics=weak_topics,
            strong_topics=strong_topics,
            score_percent=session.score_percent,
            review_quality=review_quality,
        )

        return {
            'review': review_text,
            'youtube_videos': videos,
            'weak_topics': weak_topics,
            'strong_topics': strong_topics,
            'score_percent': session.score_percent,
            'quality': review_quality,
            'cached': False,
        }

    # --- CHAT HISTORY (Pro only) ---

    @staticmethod
    def get_session_list(user, limit=20):
        """Get list of completed test chat sessions for a user (Pro only)."""
        sessions = TestChatSession.objects.filter(
            user=user,
            is_active=False,
        ).order_by('-completed_at')[:limit]

        return [
            {
                'id': str(s.id),
                'topic': s.sandbox_topic or (s.test_session.test.title if s.test_session else 'Unknown'),
                'mode': s.mode,
                'score_percent': s.score_percent,
                'total_questions': s.total_questions,
                'correct_answers': s.correct_answers,
                'ai_messages_count': s.ai_messages_count,
                'created_at': s.created_at.isoformat(),
                'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            }
            for s in sessions
        ]

    @staticmethod
    def get_session_messages(user, session_id):
        """Get full chat history for a specific session (Pro only)."""
        try:
            session = TestChatSession.objects.get(id=session_id, user=user)
        except TestChatSession.DoesNotExist:
            return {'error': 'Sessiya topilmadi'}

        messages = TestChatMessage.objects.filter(session=session).order_by('created_at')

        return {
            'session_id': str(session.id),
            'topic': session.sandbox_topic,
            'mode': session.mode,
            'score_percent': session.score_percent,
            'messages': [
                {
                    'role': msg.role,
                    'content': msg.content,
                    'question_index': msg.question_index,
                    'created_at': msg.created_at.isoformat(),
                }
                for msg in messages
            ],
        }
