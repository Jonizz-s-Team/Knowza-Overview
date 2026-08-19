from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import AIMemoryNode, AIProfile, SkillGap
from api.ai_engine.memory_engine import AIMemoryEngine

User = get_user_model()

class TestMemoryEngine(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='teststudent', password='password')
        # Some users might not automatically get an AIProfile, so we'll ensure one exists
        AIProfile.objects.create(user=self.user)

    def test_record_test_performance_misconception_decay(self):
        # 1. Simulate answering incorrectly
        wrong_answers = [{'topic': 'Algebra', 'question': '2+2', 'explanation': 'basic addition'}]
        AIMemoryEngine.record_test_performance(
            user=self.user,
            subject='Math',
            topic='Math test',
            wrong_answers=wrong_answers,
            strong_topics=[],
            score_percent=50
        )

        # Assert misconception node created
        node = AIMemoryNode.objects.get(user=self.user, memory_type='misconception', key='algebra')
        self.assertEqual(node.severity_score, 2)
        self.assertFalse(node.is_resolved)

        # 2. Simulate answering correctly (Strong Topic) -> should decay misconception severity
        AIMemoryEngine.record_test_performance(
            user=self.user,
            subject='Math',
            topic='Math test',
            wrong_answers=[],
            strong_topics=['Algebra'],
            score_percent=80
        )

        node.refresh_from_db()
        # Initial was 2, should decay by 1 -> 1
        self.assertEqual(node.severity_score, 1)
        self.assertFalse(node.is_resolved)

        # 3. Simulate another correct answer -> severity drops to 0 -> resolved!
        AIMemoryEngine.record_test_performance(
            user=self.user,
            subject='Math',
            topic='Math test',
            wrong_answers=[],
            strong_topics=['Algebra'],
            score_percent=100
        )

        node.refresh_from_db()
        self.assertEqual(node.severity_score, 0)
        self.assertTrue(node.is_resolved)

    def test_compile_cognitive_knowledge_graph(self):
        # Create fact
        AIMemoryNode.objects.create(
            user=self.user, memory_type='fact', key='target_score', value='IELTS 7.5'
        )
        # Create active misconception
        AIMemoryNode.objects.create(
            user=self.user, memory_type='misconception', key='grammar',
            topic='Grammar', value='Fails at present perfect',
            severity_score=3, failure_count=2, is_resolved=False, mastery_percent=20
        )
        # Create resolved misconception (should NOT appear)
        AIMemoryNode.objects.create(
            user=self.user, memory_type='misconception', key='speaking',
            topic='Speaking', value='Used to stutter',
            severity_score=0, failure_count=5, is_resolved=True, mastery_percent=90
        )
        # Create mastery
        AIMemoryNode.objects.create(
            user=self.user, memory_type='mastery', key='listening',
            topic='Listening', mastery_percent=95
        )

        graph = AIMemoryEngine.compile_cognitive_knowledge_graph(self.user)
        self.assertIn("target_score", graph)
        self.assertIn("ACTIVE MISCONCEPTIONS", graph)
        self.assertIn("Fails at present perfect", graph)
        self.assertNotIn("Used to stutter", graph)  # Resolved should not show
        self.assertIn("Listening", graph)
        self.assertIn("95% Mastered", graph)

    def test_get_exam_readiness_analytics(self):
        # Initial empty state
        res = AIMemoryEngine.get_exam_readiness_analytics(self.user)
        self.assertEqual(res['exam_readiness_index'], 37)

        # Add nodes
        AIMemoryNode.objects.create(
            user=self.user, memory_type='mastery', key='math', mastery_percent=80
        )
        AIMemoryNode.objects.create(
            user=self.user, memory_type='misconception', key='physics', is_resolved=False
        )
        AIMemoryNode.objects.create(
            user=self.user, memory_type='misconception', key='chemistry', is_resolved=True
        )

        res = AIMemoryEngine.get_exam_readiness_analytics(self.user)
        # Should be > 0 and calculated successfully
        self.assertGreater(res['exam_readiness_index'], 0)
        self.assertEqual(res['resolved_misconceptions_count'], 1)
        self.assertEqual(res['active_misconceptions_count'], 1)
