import unittest

from api.ai_engine.study_plan.tier_differentiator import TierDifferentiator


class TestTierConfig(unittest.TestCase):
    def test_free_config(self):
        config = TierDifferentiator.get_config(False)
        self.assertEqual(config["max_phases"], 2)
        self.assertFalse(config["weekly_mock_tests"])
        self.assertFalse(config["gap_based_allocation"])
        self.assertFalse(config["ai_lesson_descriptions"])
        self.assertEqual(config["daily_missions_count"], 2)
        self.assertEqual(config["nodes_per_day"], 2)

    def test_pro_config(self):
        config = TierDifferentiator.get_config(True)
        self.assertEqual(config["max_phases"], 4)
        self.assertTrue(config["weekly_mock_tests"])
        self.assertTrue(config["gap_based_allocation"])
        self.assertTrue(config["ai_lesson_descriptions"])
        self.assertEqual(config["daily_missions_count"], 3)
        self.assertEqual(config["nodes_per_day"], 3)


class TestShouldUseAI(unittest.TestCase):
    def test_free_no_ai(self):
        self.assertFalse(TierDifferentiator.should_use_ai(False))

    def test_pro_uses_ai(self):
        self.assertTrue(TierDifferentiator.should_use_ai(True))


class TestCapWeeks(unittest.TestCase):
    def test_free_caps_at_8(self):
        self.assertEqual(TierDifferentiator.cap_weeks(20, False), 8)
        self.assertEqual(TierDifferentiator.cap_weeks(8, False), 8)
        self.assertEqual(TierDifferentiator.cap_weeks(4, False), 4)

    def test_pro_caps_at_52(self):
        self.assertEqual(TierDifferentiator.cap_weeks(60, True), 52)
        self.assertEqual(TierDifferentiator.cap_weeks(20, True), 20)


class TestDescriptionTemplate(unittest.TestCase):
    def test_free_generates_description(self):
        node_data = {
            "section": "Reading",
            "skill": "Main Idea",
            "topics": ["Central theme", "Author purpose"],
            "estimated_minutes": 30,
        }
        desc = TierDifferentiator.get_description_template(False, node_data)
        self.assertIn("Reading", desc)
        self.assertIn("Main Idea", desc)
        self.assertIn("30", desc)
        self.assertGreater(len(desc), 50)

    def test_pro_returns_empty_for_ai_generation(self):
        node_data = {"section": "Reading", "skill": "Main Idea", "topics": [], "estimated_minutes": 30}
        desc = TierDifferentiator.get_description_template(True, node_data)
        self.assertEqual(desc, "")


class TestMockTestTemplate(unittest.TestCase):
    def test_free_generates_mock_description(self):
        desc = TierDifferentiator.get_mock_test_template(False, 3, "IELTS")
        self.assertIn("3-hafta", desc)
        self.assertIn("IELTS", desc)

    def test_pro_returns_empty(self):
        desc = TierDifferentiator.get_mock_test_template(True, 3, "IELTS")
        self.assertEqual(desc, "")


class TestPromptConstraints(unittest.TestCase):
    def test_free_returns_empty(self):
        result = TierDifferentiator.build_prompt_constraints(False, {})
        self.assertEqual(result, "")

    def test_pro_returns_constraints(self):
        plan_data = {
            "daily_minutes": 120,
            "exam_type": "IELTS",
            "current_score": 5.0,
            "target_score": 7.0,
        }
        result = TierDifferentiator.build_prompt_constraints(True, plan_data)
        self.assertIn("IELTS", result)
        self.assertIn("120", result)
        self.assertIn("5.0", result)
        self.assertIn("7.0", result)
