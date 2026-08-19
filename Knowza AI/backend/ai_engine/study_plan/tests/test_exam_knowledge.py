import unittest

from api.ai_engine.study_plan.exam_knowledge import (
    ExamRegistry,
    IELTS_CONFIG,
    SAT_CONFIG,
    MS_CONFIG,
    IELTS_HOURS_MATRIX,
    MS_SUBJECTS,
)


class TestExamRegistry(unittest.TestCase):
    def test_list_exams_returns_all_three(self):
        exams = ExamRegistry.list_exams()
        self.assertEqual(set(exams), {"IELTS", "SAT", "MS"})

    def test_get_ielts_config(self):
        config = ExamRegistry.get("IELTS")
        self.assertEqual(config.exam_type, "IELTS")
        self.assertEqual(config.min_score, 0.0)
        self.assertEqual(config.max_score, 9.0)
        self.assertEqual(config.score_step, 0.5)
        self.assertEqual(len(config.sections), 4)

    def test_get_sat_config(self):
        config = ExamRegistry.get("SAT")
        self.assertEqual(config.exam_type, "SAT")
        self.assertEqual(config.min_score, 400)
        self.assertEqual(config.max_score, 1600)
        self.assertEqual(config.score_step, 10)
        self.assertEqual(len(config.sections), 2)

    def test_get_ms_config(self):
        config = ExamRegistry.get("MS")
        self.assertEqual(config.exam_type, "MS")
        self.assertEqual(config.min_score, 0)
        self.assertEqual(config.max_score, 100)
        self.assertEqual(len(config.sections), 2)

    def test_get_unknown_raises(self):
        with self.assertRaises(ValueError):
            ExamRegistry.get("TOEFL")

    def test_detect_ielts(self):
        self.assertEqual(ExamRegistry.detect("IELTS 7.0"), "IELTS")
        self.assertEqual(ExamRegistry.detect("ielts Academic"), "IELTS")

    def test_detect_sat(self):
        self.assertEqual(ExamRegistry.detect("SAT 1500"), "SAT")
        self.assertEqual(ExamRegistry.detect("Digital SAT"), "SAT")

    def test_detect_ms(self):
        self.assertEqual(ExamRegistry.detect("Milliy Sertifikat"), "MS")
        self.assertEqual(ExamRegistry.detect("DTM imtihoni"), "MS")
        self.assertEqual(ExamRegistry.detect("SERTIFIKAT"), "MS")

    def test_detect_default_fallback(self):
        self.assertEqual(ExamRegistry.detect("Some random goal"), "IELTS")


class TestBandDescriptor(unittest.TestCase):
    def test_ielts_band_for_6_5(self):
        band = ExamRegistry.get_band("IELTS", 6.5)
        self.assertIsNotNone(band)
        self.assertEqual(band.label, "Good User")

    def test_ielts_band_for_max_score(self):
        band = ExamRegistry.get_band("IELTS", 9.0)
        self.assertIsNotNone(band)
        self.assertIn(band.label, ("Expert", "Expert User"))

    def test_sat_band_for_1350(self):
        band = ExamRegistry.get_band("SAT", 1350)
        self.assertIsNotNone(band)
        self.assertEqual(band.label, "Above Average")

    def test_ms_band_for_67(self):
        band = ExamRegistry.get_band("MS", 67)
        self.assertIsNotNone(band)
        self.assertEqual(band.label, "A")

    def test_ms_band_for_a_plus(self):
        band = ExamRegistry.get_band("MS", 75)
        self.assertIsNotNone(band)
        self.assertEqual(band.label, "A+")


class TestScoreValidation(unittest.TestCase):
    def test_validate_normal_ielts(self):
        current, target = ExamRegistry.validate_scores("IELTS", 5.0, 7.0)
        self.assertEqual(current, 5.0)
        self.assertEqual(target, 7.0)

    def test_validate_snaps_sat_scores(self):
        current, target = ExamRegistry.validate_scores("SAT", 1003, 1407)
        self.assertEqual(current, 1000)
        self.assertEqual(target, 1410)

    def test_validate_rejects_current_above_target(self):
        with self.assertRaises(ValueError):
            ExamRegistry.validate_scores("IELTS", 7.0, 5.0)

    def test_validate_rejects_equal_scores(self):
        with self.assertRaises(ValueError):
            ExamRegistry.validate_scores("SAT", 1200, 1200)

    def test_validate_clamps_out_of_range(self):
        current, target = ExamRegistry.validate_scores("IELTS", -1.0, 10.0)
        self.assertEqual(current, 0.0)
        self.assertEqual(target, 9.0)


class TestSnapScore(unittest.TestCase):
    def test_ielts_snap(self):
        self.assertEqual(ExamRegistry.snap_score("IELTS", 6.3), 6.5)
        self.assertEqual(ExamRegistry.snap_score("IELTS", 6.2), 6.0)
        self.assertEqual(ExamRegistry.snap_score("IELTS", 6.75), 7.0)

    def test_sat_snap(self):
        self.assertEqual(ExamRegistry.snap_score("SAT", 1003), 1000)
        self.assertEqual(ExamRegistry.snap_score("SAT", 1008), 1010)

    def test_ms_snap(self):
        self.assertEqual(ExamRegistry.snap_score("MS", 67.4), 67)


class TestIELTSHoursMatrix(unittest.TestCase):
    def test_matrix_has_all_base_bands(self):
        expected_keys = {"3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5"}
        self.assertEqual(set(IELTS_HOURS_MATRIX.keys()), expected_keys)

    def test_hours_5_to_7(self):
        hours = IELTS_HOURS_MATRIX["5.0"]["7.0"]
        self.assertIsNotNone(hours)
        self.assertGreater(hours, 500)
        self.assertLess(hours, 1000)

    def test_hours_increase_with_higher_target(self):
        hours_65 = IELTS_HOURS_MATRIX["5.0"]["6.5"]
        hours_70 = IELTS_HOURS_MATRIX["5.0"]["7.0"]
        self.assertGreater(hours_70, hours_65)


class TestMSSubjects(unittest.TestCase):
    def test_has_core_subjects(self):
        self.assertIn("Matematika", MS_SUBJECTS)
        self.assertIn("Biologiya", MS_SUBJECTS)
        self.assertIn("Kimyo", MS_SUBJECTS)
        self.assertIn("Tarix", MS_SUBJECTS)

    def test_subject_has_required_fields(self):
        for name, cfg in MS_SUBJECTS.items():
            self.assertIn("topics", cfg, f"{name} missing topics")
            self.assertIn("closed_ratio", cfg, f"{name} missing closed_ratio")
            self.assertGreater(len(cfg["topics"]), 5, f"{name} has too few topics")

    def test_get_ms_subject_config(self):
        config = ExamRegistry.get_ms_subject_config("Matematika")
        self.assertIsNotNone(config)
        self.assertEqual(config["name"], "Matematika")
        self.assertGreater(len(config["topics"]), 0)

    def test_get_ms_subject_partial_match(self):
        config = ExamRegistry.get_ms_subject_config("matematika")
        self.assertIsNotNone(config)


class TestSectionSkillCompleteness(unittest.TestCase):
    def test_ielts_section_weights_sum_to_one(self):
        total = sum(s.weight for s in IELTS_CONFIG.sections)
        self.assertAlmostEqual(total, 1.0, places=2)

    def test_sat_section_weights_sum_to_one(self):
        total = sum(s.weight for s in SAT_CONFIG.sections)
        self.assertAlmostEqual(total, 1.0, places=2)

    def test_ms_section_weights_sum_to_one(self):
        total = sum(s.weight for s in MS_CONFIG.sections)
        self.assertAlmostEqual(total, 1.0, places=2)

    def test_ielts_daily_ratios_sum_to_one(self):
        total = sum(s.daily_ratio for s in IELTS_CONFIG.sections)
        self.assertAlmostEqual(total, 1.0, places=2)

    def test_sat_daily_ratios_sum_to_one(self):
        total = sum(s.daily_ratio for s in SAT_CONFIG.sections)
        self.assertAlmostEqual(total, 1.0, places=2)

    def test_every_section_has_skills(self):
        for config in [IELTS_CONFIG, SAT_CONFIG, MS_CONFIG]:
            for section in config.sections:
                self.assertGreater(
                    len(section.skills), 0,
                    f"{config.exam_type}/{section.name} has no skills"
                )

    def test_every_skill_has_topics(self):
        for config in [IELTS_CONFIG, SAT_CONFIG, MS_CONFIG]:
            for section in config.sections:
                for skill in section.skills:
                    self.assertGreater(
                        len(skill.topics), 0,
                        f"{config.exam_type}/{section.name}/{skill.name} has no topics"
                    )
