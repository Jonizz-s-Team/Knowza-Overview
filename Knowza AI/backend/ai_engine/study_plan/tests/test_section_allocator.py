import unittest

from api.ai_engine.study_plan.section_allocator import SectionAllocator


class TestDefaultAllocation(unittest.TestCase):
    def test_ielts_default_sums_to_daily_minutes(self):
        allocs = SectionAllocator.allocate("IELTS", 120)
        total = sum(a["minutes"] for a in allocs)
        self.assertEqual(total, 120)

    def test_sat_default_sums_to_daily_minutes(self):
        allocs = SectionAllocator.allocate("SAT", 180)
        total = sum(a["minutes"] for a in allocs)
        self.assertEqual(total, 180)

    def test_ms_default_sums_to_daily_minutes(self):
        allocs = SectionAllocator.allocate("MS", 90)
        total = sum(a["minutes"] for a in allocs)
        self.assertEqual(total, 90)

    def test_ielts_has_four_sections(self):
        allocs = SectionAllocator.allocate("IELTS", 120)
        self.assertEqual(len(allocs), 4)

    def test_sat_has_two_sections(self):
        allocs = SectionAllocator.allocate("SAT", 120)
        self.assertEqual(len(allocs), 2)

    def test_each_section_has_minimum_10_minutes(self):
        allocs = SectionAllocator.allocate("IELTS", 60)
        for alloc in allocs:
            self.assertGreaterEqual(alloc["minutes"], 10)

    def test_section_names_match_config(self):
        allocs = SectionAllocator.allocate("IELTS", 120)
        names = {a["section"] for a in allocs}
        self.assertEqual(names, {"Listening", "Reading", "Writing", "Speaking"})

    def test_each_allocation_has_skills(self):
        allocs = SectionAllocator.allocate("SAT", 120)
        for alloc in allocs:
            self.assertIn("skills", alloc)
            self.assertGreater(len(alloc["skills"]), 0)


class TestGapBasedAllocation(unittest.TestCase):
    def test_gap_based_sums_to_daily_minutes(self):
        scores = {"Listening": 30, "Reading": 70, "Writing": 20, "Speaking": 50}
        allocs = SectionAllocator.allocate("IELTS", 120, scores)
        total = sum(a["minutes"] for a in allocs)
        self.assertEqual(total, 120)

    def test_weak_section_gets_more_time(self):
        scores = {"Listening": 90, "Reading": 90, "Writing": 20, "Speaking": 90}
        allocs = SectionAllocator.allocate("IELTS", 200, scores)

        writing_alloc = next(a for a in allocs if a["section"] == "Writing")
        listening_alloc = next(a for a in allocs if a["section"] == "Listening")
        self.assertGreater(writing_alloc["minutes"], listening_alloc["minutes"])

    def test_gap_scores_are_populated(self):
        scores = {"Listening": 40, "Reading": 60, "Writing": 30, "Speaking": 50}
        allocs = SectionAllocator.allocate("IELTS", 120, scores)
        for alloc in allocs:
            self.assertIn("gap_score", alloc)
            self.assertGreaterEqual(alloc["gap_score"], 0.0)

    def test_weak_skills_identified(self):
        scores = {"Main Idea": 30, "Inference": 20, "Listening": 40, "Reading": 60}
        allocs = SectionAllocator.allocate("IELTS", 120, scores)
        reading_alloc = next(a for a in allocs if a["section"] == "Reading")
        self.assertIn("weak_skills", reading_alloc)

    def test_all_equal_scores_falls_back_to_default(self):
        scores = {"Listening": 100, "Reading": 100, "Writing": 100, "Speaking": 100}
        allocs = SectionAllocator.allocate("IELTS", 120, scores)
        total = sum(a["minutes"] for a in allocs)
        self.assertEqual(total, 120)

    def test_sat_gap_allocation(self):
        scores = {"Reading and Writing": 30, "Math": 80}
        allocs = SectionAllocator.allocate("SAT", 120, scores)
        rw_alloc = next(a for a in allocs if a["section"] == "Reading and Writing")
        math_alloc = next(a for a in allocs if a["section"] == "Math")
        self.assertGreater(rw_alloc["minutes"], math_alloc["minutes"])
