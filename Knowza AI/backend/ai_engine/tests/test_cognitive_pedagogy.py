from django.test import TestCase
from api.ai_engine.cognitive_pedagogy import (
    SpacedRepetitionScheduler,
    CognitiveLoadAnalyzer,
    BloomsTaxonomyTracker,
)

class TestSpacedRepetitionScheduler(TestCase):
    def test_calculate_next_review(self):
        # Initial review
        interval, ef = SpacedRepetitionScheduler.calculate_next_review(failure_count=0, success_count=1)
        self.assertEqual(interval, 1)
        self.assertGreaterEqual(ef, 2.5)

        # Second review
        interval, ef = SpacedRepetitionScheduler.calculate_next_review(failure_count=0, success_count=2, last_ease_factor=ef)
        self.assertEqual(interval, 6)

        # Third review (ef increases)
        interval, ef = SpacedRepetitionScheduler.calculate_next_review(failure_count=0, success_count=3, last_ease_factor=ef)
        self.assertGreaterEqual(interval, 15)

    def test_calculate_next_review_with_failure(self):
        interval, ef = SpacedRepetitionScheduler.calculate_next_review(failure_count=3, success_count=1, last_ease_factor=2.5)
        self.assertEqual(interval, 1)
        self.assertLess(ef, 2.5)
        self.assertGreaterEqual(ef, 1.3)

    def test_forgetting_probability(self):
        prob_day0 = SpacedRepetitionScheduler.get_forgetting_probability(0)
        self.assertEqual(prob_day0, 0.0)
        
        prob_day1 = SpacedRepetitionScheduler.get_forgetting_probability(1, 1.5)
        self.assertGreater(prob_day1, 0.4)
        self.assertLess(prob_day1, 0.6)

class TestCognitiveLoadAnalyzer(TestCase):
    def test_overload_detection_frustration(self):
        res = CognitiveLoadAnalyzer.analyze_cognitive_state("tushunmadim", 1, [])
        self.assertTrue(res['overload_detected'])
        self.assertEqual(res['sentiment'], 'frustrated')
        self.assertIn("ADAPTIVE SCAFFOLDING", res['scaffolding_instruction'])

    def test_overload_detection_high_attempts(self):
        res = CognitiveLoadAnalyzer.analyze_cognitive_state("qanday", 3, [])
        self.assertTrue(res['overload_detected'])
        self.assertEqual(res['sentiment'], 'frustrated')

    def test_confident_sentiment(self):
        res = CognitiveLoadAnalyzer.analyze_cognitive_state("ha tushundim", 1, [])
        self.assertFalse(res['overload_detected'])
        self.assertEqual(res['sentiment'], 'confident')
        self.assertEqual(res['scaffolding_instruction'], "")

    def test_neutral_sentiment(self):
        res = CognitiveLoadAnalyzer.analyze_cognitive_state("ushbu tenglama nima uchun bunday yechiladi?", 1, [])
        self.assertFalse(res['overload_detected'])
        self.assertEqual(res['sentiment'], 'neutral')

class TestBloomsTaxonomyTracker(TestCase):
    def test_blooms_levels(self):
        self.assertIn("LEVEL 1", BloomsTaxonomyTracker.get_blooms_instruction(20))
        self.assertIn("LEVEL 2", BloomsTaxonomyTracker.get_blooms_instruction(40))
        self.assertIn("LEVEL 3", BloomsTaxonomyTracker.get_blooms_instruction(60))
        self.assertIn("LEVEL 4", BloomsTaxonomyTracker.get_blooms_instruction(80))
        self.assertIn("LEVEL 5", BloomsTaxonomyTracker.get_blooms_instruction(90))
        self.assertIn("LEVEL 6", BloomsTaxonomyTracker.get_blooms_instruction(98))
