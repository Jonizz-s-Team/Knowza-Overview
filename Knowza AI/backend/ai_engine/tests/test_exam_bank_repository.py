import unittest

from api.ai_engine.exam_bank.repository import all_questions, bank_stats, select_questions
from api.ai_engine.exam_bank.quality import audit_questions


class ExamBankRepositoryTests(unittest.TestCase):
    def test_normalized_bank_has_gradeable_questions(self):
        questions = all_questions()
        self.assertTrue(questions)
        self.assertGreater(bank_stats()["ielts"], 0)
        self.assertGreater(bank_stats()["sat"], 0)
        self.assertGreater(bank_stats()["ms"], 0)
        self.assertTrue(all(question.correct_answer in question.options for question in questions))

    def test_student_payload_does_not_contain_answer_key(self):
        payload = all_questions()[0].public_dict()
        self.assertNotIn("correct_answer", payload)
        self.assertNotIn("explanation", payload)

    def test_selector_is_deterministic_and_does_not_duplicate(self):
        first = select_questions("sat", count=8, seed="student-1")
        second = select_questions("sat", count=8, seed="student-1")
        self.assertEqual([question.id for question in first], [question.id for question in second])
        self.assertEqual(len({question.id for question in first}), len(first))

    def test_quality_audit_reports_only_actionable_records(self):
        issues = audit_questions()
        self.assertTrue(all(issue.question_id and issue.code for issue in issues))
