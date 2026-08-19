import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from api.ai_engine.test_coach import TestCoachEngine, fetch_youtube_videos
from api.models import TestChatSession, TestChatMessage

User = get_user_model()

class TestCoachUtils(TestCase):
    @patch('urllib.request.urlopen')
    def test_fetch_youtube_videos_fallback(self, mock_urlopen):
        # Simulate an exception to trigger the fallback
        mock_urlopen.side_effect = Exception("Network Error")
        
        videos = fetch_youtube_videos("algebra equations", count=2)
        
        # Fallback should return 2 videos
        self.assertEqual(len(videos), 2)
        self.assertEqual(videos[0]['video_id'], '3JZ_D3ELwOQ')
        self.assertIn("algebra equations", videos[0]['title'])

    def test_get_question_history(self):
        user = User.objects.create_user(username='historytest', password='pw')
        session = TestChatSession.objects.create(
            user=user, mode='ai_assisted', total_questions=5
        )

        # Create some messages for question 0
        TestChatMessage.objects.create(session=session, role='user', content='Q0 msg1', question_index=0)
        TestChatMessage.objects.create(session=session, role='assistant', content='Q0 ans1', question_index=0)
        TestChatMessage.objects.create(session=session, role='user', content='Q0 msg2', question_index=0)

        # Create messages for question 1
        TestChatMessage.objects.create(session=session, role='user', content='Q1 msg1', question_index=1)
        TestChatMessage.objects.create(session=session, role='assistant', content='Q1 ans1', question_index=1)

        # Fetch history for Q1
        q1_history = TestCoachEngine.get_question_history(session.id, question_index=1, limit=4)
        
        # Should only get Q1 messages, ordered chronologically
        self.assertEqual(len(q1_history), 2)
        self.assertEqual(q1_history[0]['content'], 'Q1 msg1')
        self.assertEqual(q1_history[1]['content'], 'Q1 ans1')

        # Fetch history for Q0 with limit 2
        q0_history = TestCoachEngine.get_question_history(session.id, question_index=0, limit=2)
        self.assertEqual(len(q0_history), 2)
        # Should be the most recent 2 messages for Q0: 'Q0 ans1', 'Q0 msg2'
        self.assertEqual(q0_history[0]['content'], 'Q0 ans1')
        self.assertEqual(q0_history[1]['content'], 'Q0 msg2')
