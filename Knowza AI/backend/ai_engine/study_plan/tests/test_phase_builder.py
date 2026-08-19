import unittest

from api.ai_engine.study_plan.phase_builder import PhaseBuilder


class TestPhaseBuilderFree(unittest.TestCase):
    def test_free_plan_has_two_phases(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=8, is_pro=False, daily_minutes=120)
        self.assertEqual(len(phases), 2)

    def test_free_phases_cover_all_weeks(self):
        phases = PhaseBuilder.build("SAT", total_weeks=6, is_pro=False, daily_minutes=120)
        week_nums = set()
        for phase in phases:
            for w in phase["weeks"]:
                week_nums.add(w["week_number"])
        self.assertEqual(len(week_nums), 6)

    def test_free_phase_names(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=8, is_pro=False, daily_minutes=120)
        names = [p["name"] for p in phases]
        self.assertIn("Foundation & Practice", names)
        self.assertIn("Exam Preparation", names)


class TestPhaseBuilderPro(unittest.TestCase):
    def test_pro_plan_has_four_phases(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=16, is_pro=True, daily_minutes=120)
        self.assertEqual(len(phases), 4)

    def test_pro_phase_names(self):
        phases = PhaseBuilder.build("SAT", total_weeks=12, is_pro=True, daily_minutes=120)
        names = [p["name"] for p in phases]
        self.assertIn("Diagnostic & Foundation", names)
        self.assertIn("Skills Development", names)
        self.assertIn("Exam Simulation", names)
        self.assertIn("Final Review", names)

    def test_pro_phases_have_uz_names(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=12, is_pro=True, daily_minutes=120)
        for phase in phases:
            self.assertIn("name_uz", phase)
            self.assertTrue(len(phase["name_uz"]) > 0)


class TestWeekDays(unittest.TestCase):
    def test_each_week_has_correct_number_of_days(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=4, is_pro=True, daily_minutes=120, study_days_per_week=5)
        for phase in phases:
            for week in phase["weeks"]:
                self.assertEqual(len(week["days"]), 5)

    def test_last_day_of_mock_week_is_mock_test(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=8, is_pro=True, daily_minutes=120, study_days_per_week=7)
        mock_phases = [p for p in phases if any(
            d["node_type"] == "mock_test"
            for w in p["weeks"]
            for d in w["days"]
        )]
        self.assertGreater(len(mock_phases), 0)

    def test_daily_minutes_match_config(self):
        phases = PhaseBuilder.build("SAT", total_weeks=4, is_pro=True, daily_minutes=90, study_days_per_week=7)
        for phase in phases:
            for week in phase["weeks"]:
                for day in week["days"]:
                    self.assertEqual(day["estimated_minutes"], 90)

    def test_lesson_nodes_have_section_info(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=4, is_pro=True, daily_minutes=120, study_days_per_week=7)
        found_lesson = False
        for phase in phases:
            for week in phase["weeks"]:
                for day in week["days"]:
                    if day["node_type"] == "lesson_group":
                        found_lesson = True
                        for node in day.get("nodes", []):
                            self.assertIn("section", node)
                            self.assertIn("skill", node)
        self.assertTrue(found_lesson)

    def test_pro_nodes_per_day_is_three(self):
        phases = PhaseBuilder.build("SAT", total_weeks=4, is_pro=True, daily_minutes=120, study_days_per_week=7)
        for phase in phases:
            for week in phase["weeks"]:
                for day in week["days"]:
                    if day["node_type"] == "lesson_group":
                        self.assertEqual(len(day["nodes"]), 3)

    def test_free_nodes_per_day_is_two(self):
        phases = PhaseBuilder.build("SAT", total_weeks=4, is_pro=False, daily_minutes=120, study_days_per_week=7)
        for phase in phases:
            for week in phase["weeks"]:
                for day in week["days"]:
                    if day["node_type"] == "lesson_group":
                        self.assertEqual(len(day["nodes"]), 2)

    def test_node_minutes_sum_to_daily_total(self):
        phases = PhaseBuilder.build("IELTS", total_weeks=4, is_pro=True, daily_minutes=120, study_days_per_week=7)
        for phase in phases:
            for week in phase["weeks"]:
                for day in week["days"]:
                    if day["node_type"] == "lesson_group":
                        total = sum(n["estimated_minutes"] for n in day["nodes"])
                        self.assertEqual(total, 120, f"Day {day['day_label']} total is {total}, expected 120")

    def test_minimum_one_week_per_phase(self):
        phases = PhaseBuilder.build("SAT", total_weeks=12, is_pro=True, daily_minutes=120)
        for phase in phases:
            self.assertGreater(len(phase["weeks"]), 0, f"Phase {phase['name']} has no weeks")
