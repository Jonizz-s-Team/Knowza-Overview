import unittest

from api.ai_engine.study_plan.plan_assembler import assemble_study_plan


class TestAssembleIELTSFree(unittest.TestCase):
    def setUp(self):
        self.plan = assemble_study_plan(
            goal_name="IELTS 7.0",
            current_score=5.0,
            target_score=7.0,
            daily_hours=2.0,
            is_premium=False,
        )

    def test_exam_type_detected(self):
        self.assertEqual(self.plan["exam_type"], "IELTS")

    def test_scores_preserved(self):
        self.assertEqual(self.plan["current_score"], 5.0)
        self.assertEqual(self.plan["target_score"], 7.0)

    def test_tier_is_free(self):
        self.assertEqual(self.plan["tier"], "free")

    def test_daily_minutes_correct(self):
        self.assertEqual(self.plan["daily_minutes"], 120)

    def test_timeline_present(self):
        self.assertIn("timeline", self.plan)
        self.assertGreater(self.plan["timeline"]["days_needed"], 0)

    def test_milestones_present(self):
        self.assertIn("milestones", self.plan)
        self.assertGreater(len(self.plan["milestones"]), 0)

    def test_daily_allocation_present(self):
        self.assertIn("daily_allocation", self.plan)
        total = sum(a["minutes"] for a in self.plan["daily_allocation"])
        self.assertEqual(total, 120)

    def test_weeks_present(self):
        self.assertIn("weeks", self.plan)
        self.assertGreater(len(self.plan["weeks"]), 0)

    def test_free_capped_at_8_weeks(self):
        self.assertLessEqual(len(self.plan["weeks"]), 8)

    def test_todays_mission_count(self):
        self.assertEqual(len(self.plan["todays_mission"]), 2)

    def test_no_ai_generation_needed(self):
        self.assertFalse(self.plan["needs_ai_generation"])

    def test_free_nodes_have_descriptions(self):
        for week in self.plan["weeks"]:
            for node in week["nodes"]:
                if node["node_type"] == "lesson":
                    self.assertGreater(len(node["description"]), 0)

    def test_bands_detected(self):
        self.assertIsNotNone(self.plan["current_band"])
        self.assertIsNotNone(self.plan["target_band"])


class TestAssembleSATPro(unittest.TestCase):
    def setUp(self):
        self.plan = assemble_study_plan(
            goal_name="SAT 1500",
            current_score=1100,
            target_score=1500,
            daily_hours=3.0,
            is_premium=True,
            sub_skill_scores={"Reading and Writing": 40, "Math": 70},
        )

    def test_exam_type_detected(self):
        self.assertEqual(self.plan["exam_type"], "SAT")

    def test_tier_is_pro(self):
        self.assertEqual(self.plan["tier"], "pro")

    def test_ai_generation_needed(self):
        self.assertTrue(self.plan["needs_ai_generation"])

    def test_prompt_constraints_present(self):
        self.assertGreater(len(self.plan["prompt_constraints"]), 0)
        self.assertIn("SAT", self.plan["prompt_constraints"])

    def test_todays_mission_count(self):
        self.assertEqual(len(self.plan["todays_mission"]), 3)

    def test_pro_nodes_descriptions_empty_for_ai(self):
        for week in self.plan["weeks"]:
            for node in week["nodes"]:
                if node["node_type"] == "lesson" and node.get("needs_ai"):
                    self.assertEqual(node["description"], "")

    def test_phases_present(self):
        self.assertIn("phases", self.plan)
        self.assertEqual(len(self.plan["phases"]), 4)


class TestAssembleMSFree(unittest.TestCase):
    def setUp(self):
        self.plan = assemble_study_plan(
            goal_name="Milliy Sertifikat",
            current_score=45,
            target_score=70,
            daily_hours=2.0,
            is_premium=False,
            ms_subject="Matematika",
        )

    def test_exam_type_detected(self):
        self.assertEqual(self.plan["exam_type"], "MS")

    def test_ms_subject_preserved(self):
        self.assertEqual(self.plan["ms_subject"], "Matematika")

    def test_weeks_present(self):
        self.assertGreater(len(self.plan["weeks"]), 0)


class TestAssembleEdgeCases(unittest.TestCase):
    def test_minimal_gap(self):
        plan = assemble_study_plan(
            goal_name="IELTS",
            current_score=6.0,
            target_score=6.5,
            daily_hours=1.0,
            is_premium=False,
        )
        self.assertGreater(len(plan["weeks"]), 0)

    def test_maximum_target(self):
        plan = assemble_study_plan(
            goal_name="SAT",
            current_score=400,
            target_score=1600,
            daily_hours=4.0,
            is_premium=True,
        )
        self.assertEqual(plan["target_score"], 1600)
        self.assertGreater(plan["timeline"]["days_needed"], 30)

    def test_invalid_scores_raises(self):
        with self.assertRaises(ValueError):
            assemble_study_plan(
                goal_name="IELTS",
                current_score=8.0,
                target_score=5.0,
                daily_hours=2.0,
            )

    def test_custom_study_days(self):
        plan = assemble_study_plan(
            goal_name="SAT",
            current_score=1000,
            target_score=1300,
            daily_hours=2.0,
            is_premium=False,
            study_days_per_week=5,
        )
        for week in plan["weeks"]:
            self.assertLessEqual(len(week["nodes"]), 15)

    def test_dates_are_valid(self):
        plan = assemble_study_plan(
            goal_name="IELTS",
            current_score=5.0,
            target_score=7.0,
            daily_hours=2.0,
        )
        self.assertIn("start_date", plan)
        self.assertIn("end_date", plan)
        self.assertGreater(plan["end_date"], plan["start_date"])


class TestWeekNodeIntegrity(unittest.TestCase):
    def test_all_nodes_have_required_fields(self):
        plan = assemble_study_plan(
            goal_name="IELTS 7.0",
            current_score=5.0,
            target_score=7.0,
            daily_hours=2.0,
            is_premium=True,
        )
        required_fields = {"day_label", "title", "description", "estimated_minutes", "node_type"}
        for week in plan["weeks"]:
            for node in week["nodes"]:
                for field in required_fields:
                    self.assertIn(field, node, f"Missing {field} in node {node.get('title', 'unknown')}")

    def test_node_types_are_valid(self):
        plan = assemble_study_plan(
            goal_name="SAT 1400",
            current_score=1000,
            target_score=1400,
            daily_hours=2.0,
            is_premium=True,
        )
        valid_types = {"lesson", "mock_test"}
        for week in plan["weeks"]:
            for node in week["nodes"]:
                self.assertIn(node["node_type"], valid_types)

    def test_week_numbers_are_sequential(self):
        plan = assemble_study_plan(
            goal_name="IELTS",
            current_score=5.0,
            target_score=7.0,
            daily_hours=2.0,
            is_premium=True,
        )
        week_nums = [w["week_number"] for w in plan["weeks"]]
        for i in range(1, len(week_nums)):
            self.assertEqual(week_nums[i], week_nums[i - 1] + 1)
