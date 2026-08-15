from django.db import transaction
import json
import logging
from .brain import (
    profile_request,
    get_budget,
    cache_key,
    get_cache_config,
    normalize_semantic_text,
    select_history,
    build_prompt,
    fit_to_budget,
    call_llm,
    stream_llm,
    INTENTS,
)
from .knowledge import query_knowledge
from ..models import AIProfile, LessonSession

from .brain.tools import search_web
from .brain.reflection import verify_and_refine

logger = logging.getLogger(__name__)

def fetch_youtube_video(query):
    try:
        import urllib.request, urllib.parse, re, ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(query)
        if not url.startswith(('http://', 'https://')):
            raise ValueError("Forbidden URL scheme")
        html = urllib.request.urlopen(url, context=ctx, timeout=5).read().decode()  # nosec B310
        video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
        if video_ids:
            seen_ids = set()
            unique_vids = []
            for vid in video_ids:
                if len(vid) == 11 and vid not in seen_ids:
                    seen_ids.add(vid)
                    unique_vids.append(vid)
                    if len(unique_vids) >= 3:
                        break
            
            if unique_vids:
                result_str = "\n\n### 🎥 Mavzuga oid foydali videolar:\n"
                for vid in unique_vids:
                    result_str += f"\nhttps://www.youtube.com/watch?v={vid}\n"
                return result_str
    except Exception:
        pass
    return ""

class KnowzaAIEngine:
    @staticmethod
    def _get_or_create_profile(user) -> dict:
        if not user or not user.is_authenticated:
            return {}
        profile, _ = AIProfile.objects.get_or_create(user=user)
        
        goal_text = profile.custom_goal if profile.global_goal == 'custom' else profile.global_goal
        
        bio = getattr(user, 'bio', '') or ''
        interests = getattr(user, 'interests', []) or []

        return {
            'global_goal': goal_text,
            'current_level': profile.current_level,
            'learning_language': profile.learning_language,
            'subject_focus': profile.subject_focus,
            
            # New specialized fields
            'target_score': getattr(profile, 'target_score', ''),
            'time_commitment': getattr(profile, 'time_commitment', ''),
            'target_deadline': getattr(profile, 'target_deadline', ''),
            
            # User personalized data (Token budget controlled)
            'ai_persona': getattr(user, 'ai_persona', ''),
            'bio': bio[:300], # Max 300 chars for context limits
            'interests': interests[:5] if isinstance(interests, list) else str(interests)[:300],
            'favorite_social_media': getattr(user, 'favorite_social_media', []),
            'study_hours_per_day': getattr(user, 'study_hours_per_day', None),
            'age': getattr(user, 'age', None),
            'city': getattr(user, 'city', ''),
            'ai_memory_summary': getattr(user, 'ai_memory_summary', ''),
            'target_goals': getattr(user, 'target_goals', []),
            'goals': getattr(user, 'goals', []),
            'is_premium': getattr(user, 'is_premium', False),
        }

    @staticmethod
    def _get_session_history(session_id: str, user_id: int) -> list:
        if not session_id or not user_id:
            return []
        try:
            from ..models import AIChatHistory
            history = AIChatHistory.objects.filter(session_id=session_id, user_id=user_id).order_by('created_at')
            return [{'role': h.role, 'content': h.content} for h in history]
        except Exception as e:
            logger.error(f"Error fetching history: {e}")
            return []

    @classmethod
    def process_message(
        cls,
        user,
        message: str,
        session_id: int = None,
        explicit_intent: str = None,
        stream: bool = False
    ):
        profile = profile_request(message, explicit_intent=explicit_intent)
        intent = profile.intent

        cache_config = get_cache_config(intent)
        key = None
        if not stream and cache_config.get('enabled'):
            from .brain.cache import get_cached_response, set_cached_response
            key = cache_key(user.id if user else 0, message, intent, session_id)
            cached = get_cached_response(key)
            if cached:
                return {
                    'text': cached,
                    'metadata': {
                        'intent': intent,
                        'cached': True,
                        'estimated_tokens': profile.estimated_tokens,
                        'language': profile.detected_language,
                    }
                }
                
        # Global Semantic Memory Check for Article Generation
        if intent == INTENTS.ARTICLE_GEN:
            from .vdb import get_semantic_cache
            semantic_cached_article = get_semantic_cache(message, language=profile.detected_language)
            if semantic_cached_article:
                if stream:
                    def stream_cached():
                        yield semantic_cached_article
                    return stream_cached()
                else:
                    return {
                        'text': semantic_cached_article,
                        'metadata': {
                            'intent': intent,
                            'cached': True,
                            'semantic_cache_hit': True,
                            'language': profile.detected_language,
                        }
                    }

        budget = get_budget(intent)
        user_profile = cls._get_or_create_profile(user)
        
        knowledge_context = ""
        # Handle internal Postgres RAG
        if budget.knowledge_limit > 0:
            results = query_knowledge(message, top_k=budget.knowledge_limit)
            if results:
                snippets = [res for res in results]
                knowledge_context += "INTERNAL KNOWLEDGE:\n" + "\n---\n".join(snippets)

        # Handle Agentic Web Search for Articles
        video_append = ""
        if intent == INTENTS.ARTICLE_GEN:
            web_results = search_web(message, max_results=3)
            if web_results:
                knowledge_context += "\n\nWEB SEARCH RESULTS:\n"
                for res in web_results:
                    knowledge_context += f"Source: {res.get('title')} ({res.get('href')})\nContent: {res.get('body')}\n---\n"

        raw_history = cls._get_session_history(session_id, user.id if user else 0) if session_id else []
        selected_history = select_history(
            raw_history,
            message,
            history_limit=budget.history_limit,
            history_char_limit=budget.history_char_limit,
            is_simple=profile.is_simple
        )

        prompt_message = message
        if intent == INTENTS.ARTICLE_GEN:
            prompt_message = (
                f"Siz professional ilmiy izlanish va chuqur maqola yozuvchi AI mutaxassissiz. "
                f"Quyidagi mavzu bo'yicha JUDAHAM CHUQUR, TO'LIQ, AKADEMIK VA BATAFSIL (kamida 2000-3000 so'zli) ILMIY MAQOLA VA IZLANISH HISOBOTI YOZING: '{message}'.\n\n"
                f"TALABLAR:\n"
                f"1. Maqolani kirish (hook), asosiy ilmiy va amaliy bo'limlar, statistik va matematik dalillar, formulalar, tarixiy va zamonaviy misollar bilan boyiting.\n"
                f"2. Markdown jadvallari, ro'yxatlar, muhim atamalar (**qalin**) va ko'rgazmali tushuntirishlarni kiriting.\n"
                f"3. Maqola oxirida 'Foydalanilgan Manbalar' bo'limi va eng so'ngida bosiladigan 'Mundarija' (Table of Contents) joylashtiring."
            )

        messages = build_prompt(
            intent=intent,
            user_message=prompt_message,
            profile=user_profile,
            history=selected_history,
            system_prompt_limit=budget.system_prompt_limit,
            knowledge_context=knowledge_context,
        )
        
        messages = fit_to_budget(messages, budget.input_cap)

        if stream:
            if session_id and user and user.is_authenticated:
                from ..models import AIChatHistory
                AIChatHistory.objects.create(user=user, session_id=session_id, role='user', content=message)
                
            generator = stream_llm(
                messages=messages,
                max_tokens=budget.output_cap,
                temperature=budget.temperature,
                user=user,
            )
            
            def stream_with_save():
                full_text = ""
                has_error = False
                for chunk in generator:
                    if isinstance(chunk, str) and "ERROR:" in chunk:
                        clean_part = chunk.split("ERROR:")[0]
                        full_text += clean_part
                        if clean_part:
                            yield clean_part
                        yield chunk
                        has_error = True
                        break
                    full_text += chunk
                    yield chunk
                
                if not has_error:
                    if intent == INTENTS.ARTICLE_GEN and video_append:
                        full_text += video_append
                        yield video_append
                        
                    if session_id and user and user.is_authenticated and full_text:
                        from ..models import AIChatHistory
                        AIChatHistory.objects.create(user=user, session_id=session_id, role='assistant', content=full_text)
                        if AIChatHistory.objects.filter(user=user).count() % 10 == 0:
                            from .brain.memory import async_update_user_summary
                            async_update_user_summary(user.id)
                    
                    # Save to Global Semantic Cache
                    if intent == INTENTS.ARTICLE_GEN and full_text:
                        from .vdb import save_semantic_cache
                        save_semantic_cache(message, full_text, language=profile.detected_language)
            
            return stream_with_save()
        else:
            if session_id and user and user.is_authenticated:
                from ..models import AIChatHistory
                AIChatHistory.objects.create(user=user, session_id=session_id, role='user', content=message)

            response_text, error, metadata = call_llm(
                messages=messages,
                max_tokens=budget.output_cap,
                temperature=budget.temperature,
                timeout=budget.timeout,
                user=user,
            )
            if error:
                return {'error': error, 'metadata': metadata}
                
            # Agentic Reflection / Verification Loop
            if intent == INTENTS.ARTICLE_GEN and response_text:
                response_text = verify_and_refine(
                    draft_text=response_text,
                    user_query=message,
                    context_sources=knowledge_context,
                    budget=budget,
                    user=user
                )

            if key and cache_config.get('enabled') and response_text:
                from .brain.cache import set_cached_response
                set_cached_response(key, response_text, cache_config.get('ttl', 3600))
                
            if intent == INTENTS.ARTICLE_GEN and response_text:
                from .vdb import save_semantic_cache
                save_semantic_cache(message, response_text, language=profile.detected_language)
                
            if session_id and user and user.is_authenticated and response_text:
                from ..models import AIChatHistory
                AIChatHistory.objects.create(user=user, session_id=session_id, role='assistant', content=response_text)
                if AIChatHistory.objects.filter(user=user).count() % 10 == 0:
                    from .brain.memory import async_update_user_summary
                    async_update_user_summary(user.id)

            metadata.update({
                'intent': intent,
                'cached': False,
                'is_simple': profile.is_simple,
                'language': profile.detected_language,
            })

            return {
                'text': response_text,
                'metadata': metadata
            }

    @classmethod
    def generate_test(cls, user, topic: str, difficulty: str = None):
        import random
        user_profile = cls._get_or_create_profile(user)
        if difficulty:
            user_profile['current_level'] = difficulty
            
        seed_id = random.randint(10000, 999999)
        response = cls.process_message(
            user=user,
            message=f"Generate a unique, randomized practice test for topic: '{topic}' (Difficulty: {difficulty or 'adaptive'}, Variation ID: {seed_id}). Ensure fresh questions, randomized option order, and deep skill assessment.",
            explicit_intent=INTENTS.TEST_GEN,
            stream=False
        )
        
        if 'error' in response:
            return response
            
        from ..ai_engine.utils import extract_json
        raw_text = response.get('text', '')
        parsed_json = extract_json(raw_text)
        
        response['test_data'] = parsed_json
        return response
