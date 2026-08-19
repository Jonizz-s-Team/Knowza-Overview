import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from api.models import (
    IELTSWritingTask, IELTSWritingSubmission, IELTSWritingEvaluation,
    IELTSReadingPassage, IELTSReadingAttempt
)
from api.serializers import (
    IELTSWritingTaskSerializer, IELTSWritingSubmissionSerializer, IELTSWritingEvaluationSerializer,
    IELTSReadingPassageSerializer, IELTSReadingAttemptSerializer
)
from api.ai_engine.ielts_writing_engine import generate_writing_task, evaluate_essay
from api.ai_engine.ielts_reading_engine import generate_reading_passage, evaluate_reading_attempt

logger = logging.getLogger(__name__)

class IELTSAdaptiveViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # ==========================
    # WRITING ENDPOINTS
    # ==========================

    @action(detail=False, methods=['post'])
    def generate_writing(self, request):
        target_band = request.data.get('target_band', 6.0)
        task_type = request.data.get('task_type', 'task_2')
        
        try:
            task = generate_writing_task(user=request.user, target_band=float(target_band), task_type=task_type)
            serializer = IELTSWritingTaskSerializer(task)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error generating writing task: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def submit_writing(self, request):
        task_id = request.data.get('task_id')
        essay_text = request.data.get('essay_text')
        time_spent = request.data.get('time_spent_seconds', 0)
        
        if not task_id or not essay_text:
            return Response({"error": "task_id and essay_text are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            task = IELTSWritingTask.objects.get(id=task_id, user=request.user)
            
            if hasattr(task, 'submission'):
                return Response({"error": "Task already submitted"}, status=status.HTTP_400_BAD_REQUEST)
                
            word_count = len(essay_text.split())
            
            submission = IELTSWritingSubmission.objects.create(
                task=task,
                essay_text=essay_text,
                time_spent_seconds=time_spent,
                word_count=word_count
            )
            
            # Auto-evaluate
            evaluation = evaluate_essay(submission)
            
            return Response({
                "submission": IELTSWritingSubmissionSerializer(submission).data,
                "evaluation": IELTSWritingEvaluationSerializer(evaluation).data
            })
        except IELTSWritingTask.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error submitting writing: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    @action(detail=False, methods=['get'])
    def writing_history(self, request):
        tasks = IELTSWritingTask.objects.filter(user=request.user).order_by('-created_at')
        return Response(IELTSWritingTaskSerializer(tasks, many=True).data)

    # ==========================
    # READING ENDPOINTS
    # ==========================

    @action(detail=False, methods=['post'])
    def generate_reading(self, request):
        topic = request.data.get('topic', 'General Science')
        difficulty_level = request.data.get('difficulty_level', 'intermediate')
        
        try:
            passage = generate_reading_passage(user=request.user, topic=topic, difficulty_level=difficulty_level)
            serializer = IELTSReadingPassageSerializer(passage)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error generating reading passage: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def submit_reading(self, request):
        passage_id = request.data.get('passage_id')
        answers = request.data.get('answers', {})
        time_spent = request.data.get('time_spent_seconds', 0)
        
        if not passage_id:
            return Response({"error": "passage_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            passage = IELTSReadingPassage.objects.get(id=passage_id, user=request.user)
            
            if hasattr(passage, 'attempt'):
                return Response({"error": "Passage already attempted"}, status=status.HTTP_400_BAD_REQUEST)
                
            attempt = evaluate_reading_attempt(passage=passage, answers=answers, time_spent_seconds=time_spent)
            return Response(IELTSReadingAttemptSerializer(attempt).data)
        except IELTSReadingPassage.DoesNotExist:
            return Response({"error": "Passage not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error submitting reading: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def reading_history(self, request):
        passages = IELTSReadingPassage.objects.filter(user=request.user).order_by('-created_at')
        return Response(IELTSReadingPassageSerializer(passages, many=True).data)
