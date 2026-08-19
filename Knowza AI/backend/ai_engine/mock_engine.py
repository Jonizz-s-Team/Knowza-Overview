"""
Mock Exam Engine — Full-length exam simulator for IELTS, SAT, and Milliy Sertifikat.

Supports:
- IELTS: Listening (40q/30m), Reading (40q/60m), Writing (2 tasks/60m), Speaking (3 parts/15m)
- SAT: Digital SAT Reading & Writing (2 modules × 27q/32m), Math (2 modules × 22q/35m)
- Milliy Sertifikat: Majburiy (30q/33p), 1-Asosiy (30q/93p), 2-Asosiy (30q/63p)
"""
import json
import logging
from typing import Dict, List, Optional, Tuple
from django.utils import timezone
from .utils import call_ai
from .study_plan.exam_knowledge import ExamRegistry
from .exam_bank.repository import select_questions

logger = logging.getLogger(__name__)

# Section structures per exam type
MOCK_EXAM_STRUCTURES = {
    "ielts": [
        {"name": "Listening", "name_uz": "Tinglash", "time_limit_minutes": 30, "question_count": 10},
        {"name": "Reading", "name_uz": "O'qish", "time_limit_minutes": 60, "question_count": 10},
        {"name": "Writing", "name_uz": "Yozish", "time_limit_minutes": 60, "question_count": 2},
        {"name": "Speaking", "name_uz": "Gapirish", "time_limit_minutes": 15, "question_count": 3},
    ],
    "sat": [
        {"name": "Reading & Writing — Module 1", "name_uz": "O'qish va Yozish — 1-Modul", "time_limit_minutes": 32, "question_count": 10},
        {"name": "Reading & Writing — Module 2", "name_uz": "O'qish va Yozish — 2-Modul", "time_limit_minutes": 32, "question_count": 10},
        {"name": "Math — Module 1", "name_uz": "Matematika — 1-Modul", "time_limit_minutes": 35, "question_count": 10},
        {"name": "Math — Module 2", "name_uz": "Matematika — 2-Modul", "time_limit_minutes": 35, "question_count": 10},
    ],
    "ms": [
        {"name": "Majburiy Fanlar (Ona tili, Tarix, Matematika)", "name_uz": "Majburiy Fanlar", "time_limit_minutes": 45, "question_count": 10},
        {"name": "1-Asosiy Fan", "name_uz": "1-Asosiy Fan", "time_limit_minutes": 60, "question_count": 10},
        {"name": "2-Asosiy Fan", "name_uz": "2-Asosiy Fan", "time_limit_minutes": 60, "question_count": 10},
    ],
}


def start_mock_exam(user, exam_type: str, exam_format: str = "full_mock", subject: str = "") -> 'MockExam':
    """Initialize a new mock exam session."""
    from ..models import MockExam

    exam_type = exam_type.lower()
    sections = MOCK_EXAM_STRUCTURES.get(exam_type, MOCK_EXAM_STRUCTURES["ielts"])

    # If subject specified for MS, customize main sections
    if exam_type == "ms" and subject:
        sections = [
            {"name": "Majburiy Fanlar", "name_uz": "Majburiy Fanlar", "time_limit_minutes": 45, "question_count": 10},
            {"name": f"{subject} — 1-qism", "name_uz": f"{subject} — 1-qism", "time_limit_minutes": 60, "question_count": 10},
            {"name": f"{subject} — 2-qism", "name_uz": f"{subject} — 2-qism", "time_limit_minutes": 60, "question_count": 10},
        ]

    mock_exam = MockExam.objects.create(
        user=user,
        exam_type=exam_type,
        exam_format=exam_format,
        subject=subject,
        sections=sections,
        answers={},
        section_scores={},
        status='in_progress',
    )
    return mock_exam


def generate_mock_section_questions(mock_id: int, section_index: int) -> Optional[List[Dict]]:
    """Retrieve reviewed local-bank questions for one mock section.

    A mock exam must never silently turn into AI-generated or dummy questions.
    This keeps answer keys stable and makes every result auditable.
    """
    from ..models import MockExam

    mock_exam = MockExam.objects.get(id=mock_id)
    if section_index >= len(mock_exam.sections):
        return None

    section_info = mock_exam.sections[section_index]
    section_name = section_info["name"]
    count = section_info.get("question_count", 10)

    # Check if questions already generated in section_info
    if "questions" in section_info and section_info["questions"]:
        return [_public_question(question) for question in section_info["questions"]]

    normalized_section = section_name.replace(" & ", " and ").split(" — ")[0]
    selected = select_questions(
        mock_exam.exam_type,
        count=count,
        section=normalized_section,
        subject=mock_exam.subject,
        seed=f"mock:{mock_exam.id}:{section_index}",
    )
    if not selected:
        logger.warning("No reviewed bank questions for %s / %s", mock_exam.exam_type, section_name)
        return []

    # Correct answers are persisted only for server-side grading.  The return
    # value sent to a student excludes both answer key and explanation.
    questions = [
        {
            "id": question.id,
            "question": question.prompt,
            "passage": question.passage,
            "options": list(question.options),
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "topic": question.domain or question.skill,
            "difficulty": question.difficulty,
        }
        for question in selected
    ]
    sections = mock_exam.sections.copy()
    sections[section_index]["questions"] = questions
    sections[section_index]["bank_shortfall"] = max(0, count - len(questions))
    mock_exam.sections = sections
    mock_exam.save(update_fields=['sections'])
    return [_public_question(question) for question in questions]


def _public_question(question: Dict) -> Dict:
    """Remove the answer key from all student-facing mock payloads."""
    return {key: value for key, value in question.items() if key not in {"correct_answer", "explanation"}}


def submit_mock_section(mock_id: int, section_index: int, user_answers: Dict[str, str], time_spent: int = 0) -> Dict:
    """Save user answers for a section and return section feedback."""
    from ..models import MockExam

    mock_exam = MockExam.objects.get(id=mock_id)
    if section_index >= len(mock_exam.sections):
        return {"error": "Noto'g'ri bo'lim indeksi"}

    section_info = mock_exam.sections[section_index]
    section_name = section_info["name"]
    questions = section_info.get("questions", [])

    correct_count = 0
    total_q = len(questions)

    for idx, q in enumerate(questions):
        q_id = str(q.get("id", idx + 1))
        ans = user_answers.get(q_id, "").strip().upper()
        correct = q.get("correct_answer", "").strip().upper()
        options = q.get("options", [])
        if len(ans) == 1 and ans in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
            option_index = ord(ans) - ord("A")
            if 0 <= option_index < len(options):
                ans = str(options[option_index]).strip().upper()
        if ans == correct:
            correct_count += 1

    # Save answers into mock_exam
    all_answers = mock_exam.answers.copy()
    all_answers[section_name] = user_answers
    mock_exam.answers = all_answers

    # Save section score
    sec_scores = mock_exam.section_scores.copy()
    sec_scores[section_name] = {
        "correct": correct_count,
        "total": total_q,
        "accuracy_percent": round((correct_count / max(1, total_q)) * 100),
    }
    mock_exam.section_scores = sec_scores
    mock_exam.time_spent_seconds += time_spent
    mock_exam.save()

    is_last = section_index == len(mock_exam.sections) - 1

    return {
        "section_name": section_name,
        "correct": correct_count,
        "total": total_q,
        "accuracy_percent": sec_scores[section_name]["accuracy_percent"],
        "is_last_section": is_last,
    }


def complete_mock_exam(mock_id: int) -> Dict:
    """Calculate final score, band equivalence, AI post-exam review, and update skill gaps."""
    from ..models import MockExam, SkillGap

    mock_exam = MockExam.objects.get(id=mock_id)
    if mock_exam.status == 'completed':
        return _format_mock_result(mock_exam)

    exam_type = mock_exam.exam_type.lower()
    sec_scores = mock_exam.section_scores

    total_correct = sum(val.get("correct", 0) for val in sec_scores.values())
    total_questions = sum(val.get("total", 0) for val in sec_scores.values())
    overall_accuracy = total_correct / max(1, total_questions)

    # Convert to official exam scale
    if exam_type == "ielts":
        total_score = round(overall_accuracy * 9.0 * 2) / 2
        band_equivalent = f"Band {total_score}"
    elif exam_type == "sat":
        total_score = round(400 + overall_accuracy * 1200)
        band_equivalent = f"{total_score} / 1600"
    elif exam_type == "ms":
        total_score = round(overall_accuracy * 100)
        if total_score >= 85:
            band_equivalent = "A+"
        elif total_score >= 75:
            band_equivalent = "A"
        elif total_score >= 65:
            band_equivalent = "B+"
        elif total_score >= 55:
            band_equivalent = "B"
        else:
            band_equivalent = "C"
    else:
        total_score = round(overall_accuracy * 100)
        band_equivalent = f"{total_score}%"

    # Identify weak and strong topics
    weak_topics = []
    strong_topics = []
    for sec_name, score_data in sec_scores.items():
        acc = score_data.get("accuracy_percent", 0)
        if acc < 60:
            weak_topics.append(sec_name)
            # Update SkillGap model in Django DB
            SkillGap.objects.update_or_create(
                user=mock_exam.user,
                skill_name=sec_name,
                defaults={"subject": mock_exam.subject or exam_type, "status": "weak"},
            )
        else:
            strong_topics.append(sec_name)

    # Generate AI post-exam review text
    ai_review_prompt = f"""Talabaning {mock_exam.exam_type.upper()} mock imtihon natijalari bo'yicha qisqa motivatsion tahlil va tavsiya yoz.
Umumiy ball: {band_equivalent} ({total_correct}/{total_questions} to'g'ri)
Kuchli bo'limlar: {', '.join(strong_topics) if strong_topics else 'Yo\'q'}
Rivojlantirish kerak bo'lgan bo'limlar: {', '.join(weak_topics) if weak_topics else 'Yo\'q'}

O'zbek tilida, do'stona va professional tonda 3 ta aniq maslahat bilan javob ber (Markdown formatida)."""

    try:
        review_text = call_ai(
            ai_review_prompt,
            feature="test_review",
            temperature=0.4,
            user=mock_exam.user,
        )
        if isinstance(review_text, dict):
            review_text = review_text.get("error") or "Natija saqlandi. Keyinroq batafsil tahlil tayyor bo'ladi."
    except Exception:
        review_text = f"Tabriklaymiz! Siz {mock_exam.exam_type.upper()} mock imtihonini yakunladingiz. Natijangiz: {band_equivalent}."

    mock_exam.total_score = total_score
    mock_exam.band_equivalent = band_equivalent
    mock_exam.weak_topics = weak_topics
    mock_exam.strong_topics = strong_topics
    mock_exam.ai_review = {"summary": review_text}
    mock_exam.status = 'completed'
    mock_exam.completed_at = timezone.now()
    mock_exam.save()

    return _format_mock_result(mock_exam)


def _format_mock_result(mock_exam) -> Dict:
    """Format mock exam results for API response."""
    return {
        "id": mock_exam.id,
        "exam_type": mock_exam.exam_type,
        "exam_format": mock_exam.exam_format,
        "subject": mock_exam.subject,
        "total_score": mock_exam.total_score,
        "band_equivalent": mock_exam.band_equivalent,
        "section_scores": mock_exam.section_scores,
        "weak_topics": mock_exam.weak_topics,
        "strong_topics": mock_exam.strong_topics,
        "time_spent_seconds": mock_exam.time_spent_seconds,
        "ai_review": mock_exam.ai_review,
        "status": mock_exam.status,
        "completed_at": mock_exam.completed_at.strftime("%Y-%m-%d %H:%M") if mock_exam.completed_at else None,
    }
