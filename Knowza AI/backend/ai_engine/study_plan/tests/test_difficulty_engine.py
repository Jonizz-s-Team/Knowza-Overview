import unittest

from api.ai_engine.study_plan.difficulty_engine import DifficultyEngine


class TestEfficiencyMultiplier(unittest.TestCase):
    def test_low_hours_no_burnout(self):
        self.assertEqual(DifficultyEngine.efficiency_multiplier(1.0), 1.0)
        self.assertEqual(DifficultyEngine.efficiency_multiplier(2.0), 1.0)

    def test_moderate_hours_slight_burnout(self):
        mult = DifficultyEngine.efficiency_multiplier(3.0)
        self.assertGreater(mult, 1.0)
        self.assertLess(mult, 1.2)

    def test_high_hours_significant_burnout(self):
        mult = DifficultyEngine.efficiency_multiplier(6.0)
        self.assertGreater(mult, 1.4)

    def test_extreme_hours_max_burnout(self):
        mult = DifficultyEngine.efficiency_multiplier(10.0)
        self.assertGreaterEqual(mult, 2.0)

    def test_burnout_is_monotonically_increasing(self):
        prev = 1.0
        for hours in [1, 2, 3, 4, 5, 6, 7, 8, 10]:
            mult = DifficultyEngine.efficiency_multiplier(float(hours))
            self.assertGreaterEqual(mult, prev)
            prev = mult


class TestCalculateHours(unittest.TestCase):
    def test_ielts_uses_lookup_table(self):
        hours = DifficultyEngine.calculate_hours("IELTS", 5.0, 7.0)
        self.assertGreater(hours, 500)
        self.assertLess(hours, 1000)

    def test_ielts_fallback_when_no_lookup(self):
        hours = DifficultyEngine.calculate_hours("IELTS", 2.5, 4.0)
        self.assertGreater(hours, 0)

    def test_sat_hours_1000_to_1400(self):
        hours = DifficultyEngine.calculate_hours("SAT", 1000, 1400)
        self.assertGreater(hours, 20)
        self.assertLess(hours, 500)

    def test_sat_higher_targets_need_more_hours(self):
        hours_1200 = DifficultyEngine.calculate_hours("SAT", 1000, 1200)
        hours_1400 = DifficultyEngine.calculate_hours("SAT", 1000, 1400)
        hours_1550 = DifficultyEngine.calculate_hours("SAT", 1000, 1550)
        self.assertLess(hours_1200, hours_1400)
        self.assertLess(hours_1400, hours_1550)

    def test_ms_hours_50_to_70(self):
        hours = DifficultyEngine.calculate_hours("MS", 50, 70)
        self.assertGreater(hours, 30)

    def test_minimum_hours_is_one(self):
        hours = DifficultyEngine.calculate_hours("MS", 49, 50)
        self.assertGreaterEqual(hours, 1.0)


class TestCalculateTotalHours(unittest.TestCase):
    def test_returns_all_required_fields(self):
        result = DifficultyEngine.calculate_total_hours("IELTS", 5.0, 7.0, 2.0)
        required = {"optimal_hours", "burnout_multiplier", "actual_hours", "days_needed", "weeks_needed", "daily_hours"}
        self.assertTrue(required.issubset(result.keys()))

    def test_actual_hours_greater_than_optimal(self):
        result = DifficultyEngine.calculate_total_hours("SAT", 1000, 1400, 4.0)
        self.assertGreaterEqual(result["actual_hours"], result["optimal_hours"])

    def test_days_needed_positive(self):
        result = DifficultyEngine.calculate_total_hours("IELTS", 5.0, 7.0, 2.0)
        self.assertGreater(result["days_needed"], 0)

    def test_weeks_needed_positive(self):
        result = DifficultyEngine.calculate_total_hours("MS", 40, 70, 3.0)
        self.assertGreater(result["weeks_needed"], 0)

    def test_more_daily_hours_fewer_days(self):
        result_2h = DifficultyEngine.calculate_total_hours("SAT", 1000, 1300, 2.0)
        result_4h = DifficultyEngine.calculate_total_hours("SAT", 1000, 1300, 4.0)
        self.assertGreater(result_2h["days_needed"], result_4h["days_needed"])


class TestMilestones(unittest.TestCase):
    def test_milestones_start_at_current_score(self):
        milestones = DifficultyEngine.generate_milestones("IELTS", 5.0, 7.0, 180)
        self.assertEqual(milestones[0]["predicted_score"], 5.0)

    def test_milestones_end_at_target_score(self):
        milestones = DifficultyEngine.generate_milestones("SAT", 1000, 1400, 90)
        last = milestones[-1]
        self.assertGreaterEqual(last["predicted_score"], 1350)

    def test_milestones_are_monotonically_increasing(self):
        milestones = DifficultyEngine.generate_milestones("IELTS", 5.0, 7.0, 180)
        for i in range(1, len(milestones)):
            self.assertGreaterEqual(
                milestones[i]["predicted_score"],
                milestones[i - 1]["predicted_score"],
            )

    def test_milestones_have_correct_day_field(self):
        milestones = DifficultyEngine.generate_milestones("SAT", 1000, 1300, 42)
        self.assertEqual(milestones[0]["day"], 0)
        for m in milestones[1:]:
            self.assertGreater(m["day"], 0)

    def test_ielts_milestones_snap_to_half_bands(self):
        milestones = DifficultyEngine.generate_milestones("IELTS", 5.0, 7.0, 180)
        for m in milestones:
            score = m["predicted_score"]
            self.assertEqual(score, round(score * 2) / 2)
