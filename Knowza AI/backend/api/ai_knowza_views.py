from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..ai_engine.knowza_bridge import KnowzaAIEngine
from django.http import StreamingHttpResponse
from ..models import SavedResearch
from ..serializers import SavedResearchSerializer

class KnowzaAIViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def onboarding_status(self, request):
        try:
            profile = request.user.ai_profile
            return Response({"is_completed": True, "data": {
                "age_or_grade": profile.age_or_grade,
                "learning_language": profile.learning_language,
                "global_goal": profile.global_goal,
                "custom_goal": profile.custom_goal,
                "current_level": profile.current_level,
                "subject_focus": profile.subject_focus
            }})
        except Exception:
            # Not completed. Return pre-filled data
            prefill = {
                "full_name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                "age_or_grade": getattr(request.user, 'class_group', ''),
                "subject_focus": ", ".join(request.user.direction.values()) if isinstance(request.user.direction, dict) else ""
            }
            return Response({"is_completed": False, "prefill_data": prefill})

    @action(detail=False, methods=['post'])
    def save_onboarding(self, request):
        from ..serializers import AIProfileSerializer
        # Agar oldin yaratilgan bo'lsa uni yangilash
        try:
            instance = request.user.ai_profile
            serializer = AIProfileSerializer(instance, data=request.data, partial=True)
        except Exception:
            serializer = AIProfileSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"success": True, "data": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def chat(self, request):
        message = request.data.get('message')
        session_id = request.data.get('session_id')
        intent = request.data.get('intent')
        stream = request.data.get('stream', False)

        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        from ..utils.ai_limits import validate_ai_access
        can_use, error = validate_ai_access(request.user, feature_name='chat')
        if not can_use:
            return Response({'error': error, 'quota_exceeded': True}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if str(stream).lower() == 'true':
            generator = KnowzaAIEngine.process_message(
                user=request.user,
                message=message,
                session_id=session_id,
                explicit_intent=intent,
                stream=True
            )
            def stream_response():
                import json
                for chunk in generator:
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            response = StreamingHttpResponse(stream_response(), content_type='text/event-stream')
            response['Cache-Control'] = 'no-cache'
            return response
        else:
            result = KnowzaAIEngine.process_message(
                user=request.user,
                message=message,
                session_id=session_id,
                explicit_intent=intent,
                stream=False
            )
            if 'error' in result:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(result)

    @action(detail=False, methods=['post'])
    def generate_test(self, request):
        topic = request.data.get('topic')
        difficulty = request.data.get('difficulty')

        if not topic:
            return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

        from ..utils.ai_limits import validate_ai_access
        can_use, error = validate_ai_access(request.user, feature_name='test_gen')
        if not can_use:
            return Response({'error': error, 'quota_exceeded': True}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        result = KnowzaAIEngine.generate_test(
            user=request.user,
            topic=topic,
            difficulty=difficulty
        )

        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(result)

    @action(detail=False, methods=['post'])
    def generate_article(self, request):
        topic = request.data.get('topic')
        
        if not topic:
            return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

        from ..utils.ai_limits import validate_ai_access
        can_use, error = validate_ai_access(request.user, feature_name='chat')
        if not can_use:
            return Response({'error': error, 'quota_exceeded': True}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Check weekly limits for non-premium users (Max 3 articles per week)
        if not getattr(request.user, 'is_premium', False):
            import datetime
            from django.utils import timezone
            one_week_ago = timezone.now() - datetime.timedelta(days=7)
            recent_count = SavedResearch.objects.filter(user=request.user, created_at__gte=one_week_ago).count()
            if recent_count >= 3:
                return Response({
                    "success": False,
                    "message": "Siz bepul tarifdasiz va haftalik limitga (3 ta izlanish) yetib keldingiz. Cheklovsiz foydalanish va PDF eksport qilish uchun Pro tarifga o'ting."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Force the intent to ARTICLE_GEN to trigger Web Search + Verification
        from ..ai_engine.brain.constants import INTENTS
        result = KnowzaAIEngine.process_message(
            user=request.user,
            message=f"Write a deep, evidence-backed article about: {topic}",
            explicit_intent=INTENTS.ARTICLE_GEN,
            stream=False
        )

        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(result)

    @action(detail=False, methods=['post'])
    def export_pdf(self, request):
        from django.http import FileResponse
        import os
        from django.conf import settings
        from ..ai_engine.brain.tools import generate_pdf

        from ..utils.ai_limits import validate_ai_access
        can_use, error = validate_ai_access(request.user, feature_name='export_pdf')
        if not can_use:
            return Response({
                "success": False,
                "message": error
            }, status=status.HTTP_403_FORBIDDEN)

        text_content = request.data.get('text_content')
        if not text_content:
            return Response({'error': 'text_content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_path = generate_pdf(text_content)
        
        if not pdf_path or not os.path.exists(pdf_path):
            return Response({'error': 'Failed to generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')

    @action(detail=False, methods=['get'])
    def queue(self, request):
        from ..ai_engine.queue_engine import get_daily_missions
        from ..serializers import AIQueueItemSerializer
        try:
            profile = request.user.ai_profile
            missions = get_daily_missions(profile.id)
            serializer = AIQueueItemSerializer(missions, many=True)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def complete_queue(self, request):
        from ..ai_engine.queue_engine import complete_mission
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            item = complete_mission(item_id)
            return Response({"success": True, "completed": item.id})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def roadmap(self, request):
        from ..serializers import LearningPathSerializer
        try:
            profile = request.user.ai_profile
            paths = profile.learning_paths.all()
            if paths.exists():
                serializer = LearningPathSerializer(paths, many=True)
                return Response({"success": True, "data": serializer.data})
            return Response({"success": False, "message": "No roadmap found."})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def predict_score(self, request):
        from ..ai_engine.ai_study_planner import AIStudyPlanner
        try:
            goal_name = request.data.get('goal_name')
            current_score = float(request.data.get('current_score', 0))
            target_score = float(request.data.get('target_score', 0))
            daily_hours = float(request.data.get('daily_hours', 2.0))
            
            if not goal_name:
                return Response({'error': 'goal_name is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            prediction = AIStudyPlanner.predict_timeline(
                goal_name=goal_name,
                current_score=current_score,
                target_score=target_score,
                daily_hours=daily_hours
            )
            return Response({"success": True, "data": prediction})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def generate_roadmap(self, request):
        from ..ai_engine.roadmap_engine import generate_roadmap
        from ..serializers import LearningPathSerializer
        try:
            profile = request.user.ai_profile
            user = request.user
            
            # Save preferences provided by user in wizard
            daily_hours = request.data.get('daily_hours') or request.data.get('time_commitment')
            study_days = request.data.get('study_days')
            plan_tariff = request.data.get('plan_tariff') or request.data.get('tariff')
            
            if daily_hours:
                try:
                    num_str = str(daily_hours).split('-')[0].split()[0].strip()
                    user.study_hours_per_day = float(num_str)
                except Exception:
                    pass
            if study_days and isinstance(study_days, list):
                user.study_days = study_days
            if plan_tariff == 'pro':
                user.is_premium = True
            user.save(update_fields=['study_hours_per_day', 'study_days', 'is_premium'])

            paths = generate_roadmap(profile.id)
            
            # Increment refreshes count
            profile.roadmap_refreshes += 1
            profile.save(update_fields=['roadmap_refreshes'])
            
            serializer = LearningPathSerializer(paths, many=True)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        from ..ai_engine.streak_engine import update_streak
        from ..serializers import StreakCounterSerializer, SkillGapSerializer
        try:
            profile = request.user.ai_profile
            streak = update_streak(profile)
            streak_data = StreakCounterSerializer(streak).data
            
            gaps = profile.user.skill_gaps.all()
            gaps_data = SkillGapSerializer(gaps, many=True).data
            
            return Response({
                "success": True,
                "streak": streak_data,
                "skill_gaps": gaps_data,
                "profile": {
                    "subject": profile.subject_focus,
                    "target_score": profile.target_score
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def submit_sandbox_test(self, request):
        from ..ai_engine.test_engine import update_skill_gaps
        results = request.data.get('results', [])
        subject = request.data.get('subject', getattr(request.user.ai_profile, 'subject_focus', 'General'))
        
        try:
            update_skill_gaps(request.user, results, subject)
            return Response({"success": True})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def socratic_coach(self, request):
        from ..ai_engine.test_engine import socratic_coach_response
        question = request.data.get('question')
        user_answer = request.data.get('user_answer')
        correct_answer = request.data.get('correct_answer')
        explanation = request.data.get('explanation')
        
        from ..utils.ai_limits import validate_ai_access
        can_use, error = validate_ai_access(request.user, feature_name='socratic')
        if not can_use:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = request.user.ai_profile
            response = socratic_coach_response(question, user_answer, correct_answer, explanation, profile)
            return Response({"success": True, "data": response})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ============== DIAGNOSTIC TEST ENDPOINTS ==============
    
    @action(detail=False, methods=['post'])
    def start_diagnostic(self, request):
        """Start a new adaptive diagnostic test (Enforces Single Attempt Rule)."""
        from ..ai_engine.diagnostic_engine import start_diagnostic
        try:
            exam_type = request.data.get('exam_type', 'foundation')
            subject = request.data.get('subject', 'English Foundation')
            res = start_diagnostic(request.user, exam_type, subject)
            if isinstance(res, dict) and res.get("already_completed"):
                return Response({
                    "success": True,
                    "already_completed": True,
                    "diagnostic_id": res["diagnostic_id"],
                    "result": res["result"],
                    "message": "Diagnostik test faqat 1 marta topshiriladi. Natijalaringiz va shaxsiy rejangiz tayyor!"
                })
            return Response({
                "success": True,
                "diagnostic_id": res.id,
                "exam_type": res.exam_type,
                "total_questions": res.total_questions_target,
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    
    @action(detail=False, methods=['post'])
    def diagnostic_all_questions(self, request):
        """Get all pre-populated questions for a diagnostic test session."""
        from ..ai_engine.diagnostic_engine import get_all_diagnostic_questions
        from ..models import DiagnosticTest
        try:
            diagnostic_id = request.data.get('diagnostic_id')
            if not diagnostic_id:
                return Response({'error': 'diagnostic_id majburiy'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Security check: if test belongs to another user, return error so client clears stale localStorage
            diagnostic = DiagnosticTest.objects.filter(id=diagnostic_id).first()
            if diagnostic and diagnostic.user and request.user and request.user.is_authenticated:
                if diagnostic.user != request.user:
                    return Response({'error': 'Stale test session belonging to another user'}, status=status.HTTP_403_FORBIDDEN)

            data = get_all_diagnostic_questions(diagnostic_id)
            return Response({"success": True, **data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def diagnostic_next_question(self, request):
        """Get the next adaptive question for an ongoing diagnostic test."""
        from ..ai_engine.diagnostic_engine import get_next_question
        try:
            diagnostic_id = request.data.get('diagnostic_id')
            if not diagnostic_id:
                return Response({'error': 'diagnostic_id majburiy'}, status=status.HTTP_400_BAD_REQUEST)
            
            question = get_next_question(diagnostic_id)
            if question is None:
                return Response({
                    "success": True,
                    "is_finished": True,
                    "message": "Barcha savollar yakunlandi"
                })
            
            from ..models import DiagnosticTest
            diagnostic = DiagnosticTest.objects.get(id=diagnostic_id)
            safe_question = {
                "index": question.get("index"),
                "question": question.get("question"),
                "passage": question.get("passage", ""),
                "options": question.get("options"),
                "section": question.get("section"),
                "difficulty": question.get("difficulty"),
                "topic": question.get("topic"),
            }
            return Response({
                "success": True,
                "question": safe_question,
                "total_questions": diagnostic.total_questions_target,
                "question_index": len(diagnostic.answers) + 1,
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def submit_diagnostic_answer(self, request):
        """Submit an answer for a diagnostic question and get feedback."""
        from ..ai_engine.diagnostic_engine import submit_answer
        try:
            diagnostic_id = request.data.get('diagnostic_id')
            question_idx = request.data.get('question_idx', 0)
            selected_answer = request.data.get('selected_answer', '')
            time_spent = request.data.get('time_spent', 0)
            
            result = submit_answer(diagnostic_id, question_idx, selected_answer, time_spent)
            return Response({"success": True, **result})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def complete_diagnostic(self, request):
        """Finalize diagnostic test and get score estimation."""
        from ..ai_engine.diagnostic_engine import complete_diagnostic
        try:
            diagnostic_id = request.data.get('diagnostic_id')
            result = complete_diagnostic(diagnostic_id)
            return Response({"success": True, "result": result})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def diagnostic_result(self, request):
        """Get the latest diagnostic test result or active unfinished session for the user."""
        from ..models import DiagnosticTest
        from ..serializers import DiagnosticTestSerializer
        try:
            exam_type = request.query_params.get('exam_type', 'ielts')
            # 1. Check if user completed diagnostic
            completed = DiagnosticTest.objects.filter(
                user=request.user, exam_type__iexact=exam_type, status='completed'
            ).order_by('-completed_at').first()
            if completed:
                serializer = DiagnosticTestSerializer(completed)
                return Response({"success": True, "completed": True, "data": serializer.data})
            
            # 2. Check if user has an active unfinished (in_progress) diagnostic session in DB
            active = DiagnosticTest.objects.filter(
                user=request.user, exam_type__iexact=exam_type, status='in_progress'
            ).order_by('-started_at').first()
            if active:
                from ..ai_engine.diagnostic_engine import populate_all_questions_for_diagnostic
                populate_all_questions_for_diagnostic(active)
                serializer = DiagnosticTestSerializer(active)
                return Response({"success": True, "in_progress": True, "data": serializer.data})

            return Response({"success": False, "message": "Diagnostik test topilmadi"})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # ============== FLASHCARD ENDPOINTS ==============
    
    @action(detail=False, methods=['get'])
    def flashcard_decks(self, request):
        """Get user's flashcard decks."""
        from ..models import FlashCardDeck
        from ..serializers import FlashCardDeckSerializer
        try:
            decks = FlashCardDeck.objects.filter(user=request.user)
            exam_type = request.query_params.get('exam_type')
            if exam_type:
                decks = decks.filter(exam_type=exam_type)
            serializer = FlashCardDeckSerializer(decks, many=True)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def flashcard_deck_cards(self, request):
        """Get all cards for a specific flashcard deck."""
        from ..models import FlashCardDeck
        from ..serializers import FlashCardSerializer
        try:
            deck_id = request.query_params.get('deck_id')
            if not deck_id:
                return Response({'error': 'deck_id majburiy'}, status=status.HTTP_400_BAD_REQUEST)
                
            deck = FlashCardDeck.objects.get(id=deck_id, user=request.user)
            cards = deck.cards.all()
            serializer = FlashCardSerializer(cards, many=True)
            return Response({"success": True, "data": serializer.data})
        except FlashCardDeck.DoesNotExist:
            return Response({'error': 'Toplam topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def flashcard_all_user_cards(self, request):
        """Get all flashcards for the current user across all decks."""
        from ..models import FlashCard
        from ..serializers import FlashCardSerializer
        try:
            cards = FlashCard.objects.filter(deck__user=request.user).order_by('-created_at')
            serializer = FlashCardSerializer(cards, many=True)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def flashcard_auto_generate_daily(self, request):
        """Auto-generate flashcards for the day based on user study hours."""
        from ..ai_engine.srs_engine import generate_cards_for_topic, create_deck_with_cards
        from ..models import FlashCardDeck, UserProfile
        from django.utils import timezone
        
        try:
            # Check if auto deck was already created today
            today = timezone.now().date()
            if FlashCardDeck.objects.filter(user=request.user, title__contains="Daily Vocab", created_at__date=today).exists():
                return Response({"success": False, "message": "Bugun uchun kartochkalar allaqachon yaratilgan"})

            exam_type = request.data.get('exam_type', 'ielts')
            topic = "Kundalik " + exam_type.upper() + " Lug'at (" + str(today) + ")"
            
            # Determine count based on profile or request
            count = 20 # Default
            profile = getattr(request.user, 'profile', None)
            if profile and profile.study_hours_per_day:
                # E.g. 10 cards per study hour
                hours = 2
                try:
                    hours = int(profile.study_hours_per_day)
                except:
                    pass
                count = min(hours * 10, 50)
            
            count = int(request.data.get('count', count))
            
            cards_data = generate_cards_for_topic(
                user=request.user,
                exam_type=exam_type,
                topic=topic,
                deck_type="vocabulary",
                count=count,
            )
            
            deck = create_deck_with_cards(
                user=request.user,
                exam_type=exam_type,
                title=f"Daily Vocab - {today.strftime('%d.%m.%Y')}",
                topic=topic,
                deck_type="vocabulary",
                cards_data=cards_data,
            )
            
            from ..serializers import FlashCardDeckSerializer
            serializer = FlashCardDeckSerializer(deck)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def generate_flashcards(self, request):
        """AI-generate flashcards for a topic."""
        from ..ai_engine.srs_engine import generate_cards_for_topic, create_deck_with_cards
        try:
            exam_type = request.data.get('exam_type', 'ielts')
            topic = request.data.get('topic', '')
            deck_type = request.data.get('deck_type', 'vocabulary')
            title = request.data.get('title', f"{topic} - {exam_type.upper()}")
            count = min(int(request.data.get('count', 10)), 100)
            
            cards_data = generate_cards_for_topic(
                user=request.user,
                exam_type=exam_type,
                topic=topic,
                deck_type=deck_type,
                count=count,
            )
            
            deck = create_deck_with_cards(
                user=request.user,
                exam_type=exam_type,
                title=title,
                topic=topic,
                deck_type=deck_type,
                cards_data=cards_data,
            )
            
            from ..serializers import FlashCardDeckSerializer
            serializer = FlashCardDeckSerializer(deck)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def flashcard_review(self, request):
        """Get cards due for review today."""
        from ..ai_engine.srs_engine import get_due_cards
        from ..serializers import FlashCardSerializer
        try:
            deck_id = request.query_params.get('deck_id')
            limit = min(int(request.query_params.get('limit', 20)), 50)
            cards = get_due_cards(request.user, deck_id=deck_id, limit=limit)
            serializer = FlashCardSerializer(cards, many=True)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def flashcard_answer(self, request):
        """Submit a flashcard review quality rating (SM-2) and update user vocabulary knowledge."""
        from ..ai_engine.srs_engine import review_card
        try:
            card_id = request.data.get('card_id')
            quality = int(request.data.get('quality', 3))  # 0-5 scale
            quality = max(0, min(5, quality))

            if not card_id:
                return Response({'error': 'card_id majburiy'}, status=status.HTTP_400_BAD_REQUEST)

            card = review_card(card_id, quality)

            # Update user vocabulary knowledge level on their profile
            try:
                from ..models import UserProfile
                profile = request.user.profile if hasattr(request.user, 'profile') else None
                if profile is None:
                    profile = UserProfile.objects.filter(user=request.user).first()
                if profile:
                    # Track vocabulary mastery: quality >= 4 means user knows this word well
                    vocab_known = getattr(profile, 'vocab_known_count', 0) or 0
                    if quality >= 4:
                        profile.vocab_known_count = vocab_known + 1
                    # Save weak topic data if quality <= 2
                    if quality <= 2 and card.topic:
                        weak_topics = getattr(profile, 'weak_vocab_topics', []) or []
                        if isinstance(weak_topics, list) and card.topic not in weak_topics:
                            weak_topics.append(card.topic)
                            profile.weak_vocab_topics = weak_topics[:20]  # keep last 20
                    profile.save(update_fields=[f for f in ['vocab_known_count', 'weak_vocab_topics'] if hasattr(profile, f)])
            except Exception:
                pass  # Profile update is non-critical

            return Response({
                "success": True,
                "card_id": card.id,
                "next_review_date": str(card.next_review_date),
                "interval_days": card.interval_days,
                "easiness_factor": card.easiness_factor,
                "is_mastered": card.is_mastered,
                "quality": quality,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def flashcard_deck_stats(self, request):
        """Get stats for a specific deck."""
        from ..ai_engine.srs_engine import get_deck_stats
        try:
            deck_id = request.query_params.get('deck_id')
            if not deck_id:
                return Response({'error': 'deck_id majburiy'}, status=status.HTTP_400_BAD_REQUEST)
            stats = get_deck_stats(deck_id)
            return Response({"success": True, "data": stats})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ============== MOCK EXAM ENDPOINTS ==============

    @action(detail=False, methods=['post'])
    def start_mock_exam(self, request):
        """Start a new full-length mock exam simulation."""
        from ..ai_engine.mock_engine import start_mock_exam
        try:
            exam_type = request.data.get('exam_type', 'ielts')
            exam_format = request.data.get('exam_format', 'full_mock')
            subject = request.data.get('subject', '')
            mock_exam = start_mock_exam(request.user, exam_type, exam_format, subject)
            from ..serializers import MockExamSerializer
            serializer = MockExamSerializer(mock_exam)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def get_mock_section(self, request):
        """Get questions for a section in a mock exam."""
        from ..ai_engine.mock_engine import generate_mock_section_questions
        try:
            mock_id = request.data.get('mock_id')
            section_index = int(request.data.get('section_index', 0))
            if not mock_id:
                return Response({'error': 'mock_id majburiy'}, status=status.HTTP_400_BAD_REQUEST)

            questions = generate_mock_section_questions(mock_id, section_index)
            if questions is None:
                return Response({'error': 'Noto\'g\'ri bo\'lim'}, status=status.HTTP_400_BAD_REQUEST)

            # Strip correct_answer for frontend display
            safe_questions = []
            for q in questions:
                safe_questions.append({
                    "id": q.get("id"),
                    "question": q.get("question"),
                    "options": q.get("options"),
                    "topic": q.get("topic"),
                })
            return Response({"success": True, "questions": safe_questions})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def submit_mock_section(self, request):
        """Submit section answers in a mock exam."""
        from ..ai_engine.mock_engine import submit_mock_section
        try:
            mock_id = request.data.get('mock_id')
            section_index = int(request.data.get('section_index', 0))
            answers = request.data.get('answers', {})
            time_spent = int(request.data.get('time_spent', 0))

            result = submit_mock_section(mock_id, section_index, answers, time_spent)
            return Response({"success": True, **result})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def complete_mock_exam(self, request):
        """Finalize a mock exam and generate post-test AI review."""
        from ..ai_engine.mock_engine import complete_mock_exam
        try:
            mock_id = request.data.get('mock_id')
            result = complete_mock_exam(mock_id)
            return Response({"success": True, "result": result})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def mock_exam_results(self, request):
        """Get past mock exam attempts for the user."""
        from ..models import MockExam
        from ..serializers import MockExamSerializer
        try:
            exam_type = request.query_params.get('exam_type')
            mocks = MockExam.objects.filter(user=request.user, status='completed')
            if exam_type:
                mocks = mocks.filter(exam_type=exam_type.lower())
            serializer = MockExamSerializer(mocks, many=True)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def socratic_eval(self, request):
        """
        Sokratik Baholash Endpointi (Socratic Evaluation View)
        Receives: test_id, question_id, answer, attempt (1, 2, or 3)
        Evaluates student answer with 3-stage Socratic guidance.
        """
        import os
        import json
        from django.conf import settings

        test_id = request.data.get('test_id')
        question_id = request.data.get('question_id')
        student_answer = str(request.data.get('answer', '')).strip()
        attempt_number = int(request.data.get('attempt', 1))

        if not test_id or not question_id or not student_answer:
            return Response({'error': 'test_id, question_id, and answer are required'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Load dataset from media/knowza_ielts_dataset.json
        dataset_path = os.path.join(settings.BASE_DIR, 'media', 'knowza_ielts_dataset.json')
        if not os.path.exists(dataset_path):
            return Response({'error': 'IELTS Dataset file not found'}, status=status.HTTP_404_NOT_FOUND)

        with open(dataset_path, 'r', encoding='utf-8') as f:
            dataset = json.load(f)

        test = next((t for t in dataset if t.get('id') == test_id), None)
        if not test:
            return Response({'error': f'Test with id {test_id} not found'}, status=status.HTTP_404_NOT_FOUND)

        question = next((q for q in test.get('questions', []) if q.get('question_id') == question_id), None)
        if not question:
            return Response({'error': f'Question with id {question_id} not found'}, status=status.HTTP_404_NOT_FOUND)

        correct_answer = str(question.get('correct_answer', '')).strip()
        hints = question.get('socratic_hints', {})

        # Check correctness (fuzzy / exact case-insensitive match)
        is_correct = student_answer.lower() == correct_answer.lower()

        if is_correct:
            return Response({
                "status": "correct",
                "attempt": attempt_number,
                "feedback": f"🎉 Barakalla! Javobingiz to'g'ri. {hints.get('explanation', '')}",
                "correct_answer": correct_answer,
                "explanation": hints.get('explanation', ''),
                "weakness_tags": question.get('weakness_tags', []),
                "progress_update": "+5% to Goal"
            })

        # Incorrect answer handling based on attempt number (Socratic steps)
        if attempt_number == 1:
            feedback_msg = hints.get('hint_1_keyword', "Matndagi kalit so'zlarga qayta diqqat bilan qara.")
            socratic_hint = "1-maslahat: Kalit so'z va iborani ko'rib chiq."
        elif attempt_number == 2:
            feedback_msg = hints.get('hint_2_paraphrase', "Savoldagi tushuncha matnda sinonim bilan berilganini izla.")
            socratic_hint = "2-maslahat: Sinonim va qayta ifodalashga (paraphrase) e'tibor ber."
        else:
            feedback_msg = f"3-urinish yakunlandi. To'g'ri javob: '{correct_answer}'. Tahlil: {hints.get('explanation', '')}"
            socratic_hint = "To'liq tahlil taqdim etildi."

        return Response({
            "status": "incorrect" if attempt_number < 3 else "failed",
            "attempt": attempt_number,
            "feedback": feedback_msg,
            "socratic_hint": socratic_hint,
            "correct_answer": correct_answer if attempt_number >= 3 else None,
            "explanation": hints.get('explanation', '') if attempt_number >= 3 else None,
            "weakness_tags": question.get('weakness_tags', []),
            "progress_update": "+1% for effort"
        })



class LearningNodeViewSet(viewsets.ModelViewSet):
    from ..models import LearningNode
    from ..serializers import LearningNodeSerializer
    serializer_class = LearningNodeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from ..models import LearningNode
        return LearningNode.objects.filter(path__profile__user=self.request.user).order_by('order')

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        from ..ai_engine.roadmap_engine import regenerate_node
        node = self.get_object()
        
        from ..utils.ai_limits import validate_ai_access
        can_use, error = validate_ai_access(request.user, feature_name='regenerate')
        if not can_use:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)

        try:
            new_node = regenerate_node(node.id)
            serializer = self.get_serializer(new_node)
            return Response({"success": True, "data": serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SavedResearchViewSet(viewsets.ModelViewSet):
    serializer_class = SavedResearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedResearch.objects.filter(user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field or 'pk'
        val = self.kwargs.get(lookup_url_kwarg)
        
        obj = queryset.filter(research_id=val).first()
        if not obj and str(val).isdigit():
            obj = queryset.filter(id=int(val)).first()
            
        if not obj:
            from django.http import Http404
            raise Http404("Saved research not found")
            
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
