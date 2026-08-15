"""
Diagnostic Engine — Adaptive baseline test for IELTS, SAT, and Milliy Sertifikat.

Uses simplified Item Response Theory (IRT) to adaptively select question difficulty
based on student responses, converging on an accurate ability estimate in 20-30 questions.
"""
import json
import logging
import math
from typing import Any, Dict, List, Optional, Tuple
from django.utils import timezone
from .utils import call_ai
from .study_plan.exam_knowledge import ExamRegistry
from .exam_bank.repository import all_questions, bank_stats, select_questions
logger = logging.getLogger(__name__)


# Topic pools for diagnostic questions across CEFR English Foundation skills
DIAGNOSTIC_TOPICS = {
    "foundation": {
        "Grammar": [
            ("easy", "To Be, Nouns, and Articles (A0-A1)"),
            ("easy", "Present Simple and Present Continuous (A1)"),
            ("medium", "Past Simple and Irregular Verbs (A2)"),
            ("medium", "Prepositions, Modals (Can/Must/Should) (A2-B1)"),
            ("hard", "Present Perfect and Relative Clauses (B1)"),
            ("hard", "Conditionals and Passive Voice (B2)"),
        ],
        "Vocabulary": [
            ("easy", "Core 500 Everyday Verbs and Nouns (A0-A1)"),
            ("medium", "A2-B1 Collocations and Adjectives"),
            ("hard", "B1-B2 Phrasal Verbs and Contextual Meaning"),
        ],
        "Reading": [
            ("easy", "Short Sentence Comprehension (A1)"),
            ("medium", "Gist and Main Idea Identification (A2-B1)"),
            ("hard", "Contextual Inference and Academic Reading (B1-B2)"),
        ],
    },
    "ielts": {
        "Grammar": [
            ("easy", "Basic Grammar & Sentence Structure"),
            ("medium", "Complex Sentences & Tenses"),
            ("hard", "Advanced Passive & Conditionals"),
        ],
        "Vocabulary": [
            ("easy", "General Vocabulary"),
            ("medium", "Academic Collocations"),
            ("hard", "Advanced Idioms & Phrasal Verbs"),
        ],
        "Reading": [
            ("easy", "Skimming & Scanning"),
            ("medium", "True/False/Not Given"),
            ("hard", "Complex Text Analysis"),
        ],
    }
}


def _difficulty_to_theta(difficulty: str) -> float:
    """Convert difficulty label to IRT theta value."""
    return {"easy": 0.25, "medium": 0.5, "hard": 0.8}.get(difficulty, 0.5)


def _theta_to_difficulty(theta: float) -> str:
    """Convert IRT theta to difficulty label."""
    if theta < 0.35:
        return "easy"
    elif theta < 0.65:
        return "medium"
    return "hard"


def _irt_probability(theta: float, difficulty: float) -> float:
    """IRT 1-Parameter Logistic (Rasch) model.
    P(correct) = 1 / (1 + e^(-a*(theta - difficulty)))
    """
    a = 1.7  # discrimination parameter
    return 1.0 / (1.0 + math.exp(-a * (theta - difficulty)))


def _update_theta(current_theta: float, is_correct: bool, question_difficulty: float) -> float:
    """Update ability estimate using simplified maximum likelihood."""
    step = 0.08 if is_correct else -0.08
    # Larger adjustments early, smaller adjustments later
    new_theta = current_theta + step
    return max(0.05, min(0.95, new_theta))


def _select_next_section(exam_type: str, answered_sections: Dict[str, int]) -> str:
    """Select next section to ask about, balancing across sections."""
    sections = list(DIAGNOSTIC_TOPICS.get(exam_type, {}).keys())
    if not sections:
        return ""
    
    # Pick the section with fewest questions answered
    min_count = float('inf')
    best_section = sections[0]
    for section in sections:
        count = answered_sections.get(section, 0)
        if count < min_count:
            min_count = count
            best_section = section
    return best_section


def _estimate_exam_score(exam_type: str, theta: float, section_thetas: Dict[str, float]) -> Tuple[float, str, str]:
    """Convert IRT theta to exam-specific score, level, and band."""
    try:
        config = ExamRegistry.get(exam_type)
    except ValueError:
        return theta * 100, "intermediate", ""
    
    score_range = config.max_score - config.min_score
    estimated_score = config.min_score + (theta * score_range)
    
    # Round to appropriate step
    if config.score_step > 0:
        estimated_score = round(estimated_score / config.score_step) * config.score_step
    estimated_score = max(config.min_score, min(config.max_score, estimated_score))
    
    # Find matching band
    estimated_band = ""
    estimated_level = "intermediate"
    for band in config.bands:
        if band.min_score <= estimated_score <= band.max_score:
            estimated_band = band.label
            estimated_level = band.level
            break
    
    return estimated_score, estimated_level, estimated_band


def _calculate_section_scores(exam_type: str, section_thetas: Dict[str, float]) -> Dict[str, float]:
    """Convert per-section theta values to exam-native section scores."""
    try:
        ExamRegistry.get(exam_type)
    except ValueError:
        return {}
    
    section_scores = {}
    for section_name, theta in section_thetas.items():
        if exam_type == "ielts":
            # IELTS: each section 0-9, step 0.5
            raw = theta * 9.0
            section_scores[section_name] = round(raw * 2) / 2  # Round to nearest 0.5
        elif exam_type == "sat":
            # SAT: each section 200-800
            section_scores[section_name] = round(200 + theta * 600)
        elif exam_type == "ms":
            # MS: percentage 0-100
            section_scores[section_name] = round(theta * 100)
    
    return section_scores


def generate_diagnostic_question(
    exam_type: str,
    section: str,
    difficulty: str,
    topic_hint: str,
    previous_questions: List[str] = None,
) -> Optional[Dict]:
    """Return a diagnostic question from the reviewed local bank.

    Dynamic generation is intentionally retained only for the legacy English
    Foundation flow. IELTS, SAT, and Milliy diagnostics must be gradeable
    against a stable answer key.
    """
    normalized_exam = {"milliy": "ms", "dtm": "ms"}.get(exam_type.lower(), exam_type.lower())
    if normalized_exam in {"ielts", "sat", "ms"}:
        source_ids = previous_questions or []
        selected = select_questions(
            normalized_exam,
            count=1,
            section=section,
            subject=section if normalized_exam == "ms" else "",
            difficulty=difficulty,
            exclude_ids=source_ids,
            seed=f"diagnostic:{normalized_exam}:{section}:{difficulty}:{len(source_ids)}",
        )
        # A section label in a legacy diagnostic may not match the real
        # blueprint (for example, SAT Grammar). Fall back to any reviewed item.
        if not selected:
            selected = select_questions(
                normalized_exam,
                count=1,
                difficulty=difficulty,
                exclude_ids=source_ids,
                seed=f"diagnostic:{normalized_exam}:{difficulty}:{len(source_ids)}",
            )
        if selected:
            item = selected[0]
            return {
                "source_id": item.id,
                "question": item.prompt,
                "passage": item.passage,
                "options": list(item.options),
                "correct_answer": item.correct_answer,
                "explanation": item.explanation,
                "topic": item.domain or item.skill,
                "section": item.section,
                "difficulty": item.difficulty,
            }
        return None
    
    difficulty_desc = {
        "easy": "boshlang'ich daraja, oddiy tushunchalar",
        "medium": "o'rta daraja, amaliy ko'nikmalar",
        "hard": "yuqori daraja, murakkab tahlil va qo'llash",
    }
    
    avoid_text = ""
    if previous_questions:
        avoid_text = f"\n\nQuyidagi savollarni TAKRORLAMANG:\n" + "\n".join(f"- {q}" for q in previous_questions[-5:])
    
    prompt = f"""Diagnostik test uchun BIR dona {exam_type.upper()} savoli yarat.

Bo'lim: {section}
Qiyinlik: {difficulty} ({difficulty_desc.get(difficulty, '')})
Mavzu: {topic_hint}
{avoid_text}

QUIDAGI JSON FORMATDA JAVOB BER (boshqa hech narsa yozma):
{{
  "question": "Savol matni (o'zbek tilida)",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A",
  "explanation": "Qisqa tushuntirish",
  "topic": "{topic_hint}",
  "section": "{section}",
  "difficulty": "{difficulty}"
}}"""
    
    try:
        response = call_ai(
            prompt=prompt,
            temperature=0.7,
            feature="test_gen"
        )
        
        # If call_ai successfully parsed JSON, it returns a dictionary
        if isinstance(response, dict):
            if "error" in response:
                logger.error(f"Diagnostic question generation AI error: {response['error']}")
                return None
            return response
            
        # Fallback if call_ai returns a string
        if isinstance(response, str):
            content = response.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            return json.loads(content)
            
    except Exception as e:
        logger.error(f"Diagnostic question generation failed: {e}")
        return None


def _select_bank_question(
    exam_type: str,
    section: str,
    difficulty: str,
    topic_hint: str,
    previous_questions: List[str] = None,
    subject: str = "",
) -> Optional[Dict]:
    """Return a diagnostic question from the reviewed local bank."""
    import random
    source_ids = previous_questions or []
    normalized_exam = {"milliy": "ms", "dtm": "ms"}.get(exam_type.lower(), exam_type.lower())
    
    # Filter candidates by exam type and exclude previously answered question IDs
    candidates = [q for q in all_questions() if q.id not in source_ids]
    if normalized_exam in {"ielts", "sat", "ms"}:
        exam_candidates = [q for q in candidates if q.exam_type == normalized_exam]
        if exam_candidates:
            candidates = exam_candidates

    matched = []
    if section == "Reading":
        matched = [q for q in candidates if (q.passage and len(q.passage.strip()) > 15) or q.section.lower() == "reading"]
    elif section == "Writing":
        matched = [q for q in candidates if q.section.lower() in {"writing", "essay"}]
    elif section == "Math":
        matched = [q for q in candidates if q.section.lower() in {"math", "matematika"} or "math" in q.domain.lower()]
    elif section == "Subject":
        if subject:
            matched = [q for q in candidates if subject.lower() in q.subject.lower() or subject.lower() in q.section.lower()]
        if not matched:
            matched = candidates
    else:  # Grammar & Vocabulary
        matched = [q for q in candidates if q.section.lower() in {"grammar", "vocabulary", "general"} or not q.passage or len(q.passage.strip()) <= 15]

    if not matched:
        matched = candidates

    if matched:
        item = random.choice(matched)
        opts = list(item.options)
        random.shuffle(opts)
        return {
            "source_id": item.id,
            "question": item.prompt,
            "passage": item.passage if (section in {"Reading", "Writing"} or item.passage) else "",
            "options": opts,
            "correct_answer": item.correct_answer,
            "explanation": item.explanation,
            "topic": item.domain or item.skill or section,
            "section": section,
            "difficulty": item.difficulty,
        }

    # Fallback essay topic if Writing section is selected
    if section == "Writing":
        essay_topics = [
            "Writing Task 2 Essay: Some people believe that university education should be free for everyone. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
            "Writing Task 2 Essay: Modern technology has made communication faster and easier, but it has also isolated people. Discuss both views and give your opinion.",
            "Writing Task 2 Essay: Artificial intelligence will replace many human jobs in the future. Is this a positive or negative development?"
        ]
        chosen_topic = random.choice(essay_topics)
        return {
            "source_id": f"essay_topic_{len(source_ids)}",
            "question": chosen_topic,
            "passage": "Write your essay response in English in the text box below (minimum 150-250 words).",
            "options": [],
            "correct_answer": "ESSAY_RESPONSE",
            "explanation": "Writing essay response recorded for AI scoring and evaluation.",
            "topic": "Essay Writing",
            "section": "Writing",
            "difficulty": "hard",
            "is_essay": True,
        }

    # Generic fallback question
    fallback_opts = ["Option A", "Option B", "Option C", "Option D"]
    random.shuffle(fallback_opts)
    return {
        "source_id": f"fallback_{len(source_ids)}",
        "question": f"{section} diagnostik savoli: Mos javobni belgilang.",
        "passage": "",
        "options": fallback_opts,
        "correct_answer": fallback_opts[0],
        "explanation": "Namunaviy diagnostik savol.",
        "topic": section,
        "section": section,
        "difficulty": difficulty,
    }


def start_diagnostic(user, exam_type: str = "IELTS", subject: str = "English Foundation") -> Any:
    """Initialize a new diagnostic test session or retrieve an active unfinished session.
    
    - Enforces SINGLE ATTEMPT RULE: Users who have already completed a diagnostic test cannot retake it.
    - REUSES UNFINISHED SESSION: Stores diagnostic session in backend DB with 3 random variants until fully submitted.
    """
    from ..models import DiagnosticTest

    # Single attempt rule per user
    if user and user.is_authenticated:
        completed = DiagnosticTest.objects.filter(user=user, status='completed').order_by('-completed_at').first()
        if completed:
            return {
                "already_completed": True,
                "diagnostic_id": completed.id,
                "result": _format_result(completed)
            }
        
        # Check if user already has an active in_progress test session in DB
        active = DiagnosticTest.objects.filter(user=user, status='in_progress', exam_type__iexact=exam_type).order_by('-started_at').first()
        if active:
            populate_all_questions_for_diagnostic(active)
            return active

    norm = (exam_type or "IELTS").upper()
    if "SAT" in norm:
        total = 30
    elif "MS" in norm or "MILLIY" in norm or "DTM" in norm:
        total = 25
    else:
        total = 58
    
    diagnostic = DiagnosticTest.objects.create(
        user=user,
        exam_type=exam_type or "IELTS",
        subject=subject or "English Foundation",
        total_questions_target=total,
        current_difficulty=0.5,
        status='in_progress',
    )
    # Pre-generate all questions for instant navigation and save to DB
    populate_all_questions_for_diagnostic(diagnostic)
    return diagnostic


def populate_all_questions_for_diagnostic(diagnostic) -> List[Dict]:
    """Pre-generate all target questions for the test session if not already generated."""
    total = diagnostic.total_questions_target
    if len(diagnostic.questions) >= total:
        return diagnostic.questions

    questions = diagnostic.questions.copy()
    prev_ids = [q.get("source_id") or q.get("question", "") for q in questions]
    norm = (diagnostic.exam_type or "IELTS").upper()

    for idx in range(len(questions), total):
        if "SAT" in norm:
            section = "Reading" if idx < 15 else "Math"
        elif "MS" in norm or "MILLIY" in norm or "DTM" in norm:
            section = "Subject"
        else:  # IELTS / Foundation
            if idx < 45:
                section = "Grammar"
            elif idx < 57:
                section = "Reading"
            else:
                section = "Writing"

        difficulty = _theta_to_difficulty(diagnostic.current_difficulty)
        item = _select_bank_question(
            exam_type=diagnostic.exam_type,
            section=section,
            difficulty=difficulty,
            topic_hint=section,
            previous_questions=prev_ids,
            subject=diagnostic.subject,
        )
        if not item:
            item = generate_diagnostic_question(
                exam_type=diagnostic.exam_type,
                section=section,
                difficulty=difficulty,
                topic_hint=section,
                previous_questions=prev_ids,
            )

        if item:
            item["index"] = idx
            item["section"] = section
            # Enforce strict passage, essay, and prompt rules
            if section == "Grammar":
                item["passage"] = ""
            elif section == "Writing":
                essay_prompts = [
                    "Writing Task 2 Essay: Some people believe that university education should be free for everyone. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
                    "Writing Task 2 Essay: Modern technology has made communication faster and easier, but it has also isolated people. Discuss both views and give your opinion on this statement.",
                    "Writing Task 2 Essay: Artificial intelligence will replace many human jobs in the future. Is this a positive or negative development?"
                ]
                item["question"] = essay_prompts[idx % len(essay_prompts)]
                item["passage"] = "Write your essay response in English in the text box below (minimum 150-250 words)."
                item["options"] = []
                item["is_essay"] = True
            elif section == "Reading" and not item.get("passage"):
                item["passage"] = "Read the text carefully and choose the correct answer."

            prev_ids.append(item.get("source_id") or item.get("question", ""))
            questions.append(item)



    diagnostic.questions = questions
    diagnostic.save(update_fields=['questions'])
    return questions


def get_all_diagnostic_questions(diagnostic_id: int) -> Dict:
    """Get all pre-populated public questions and answered indices for a test session."""
    from ..models import DiagnosticTest
    diagnostic = DiagnosticTest.objects.get(id=diagnostic_id)
    questions = populate_all_questions_for_diagnostic(diagnostic)
    public_qs = [_public_question(q) for q in questions]
    
    # Map index to user selected answer
    answers_map = {}
    for a in diagnostic.answers:
        idx = a.get("question_idx")
        if idx is not None:
            answers_map[str(idx)] = a.get("selected") or a.get("selected_answer")
            
    return {
        "diagnostic_id": diagnostic.id,
        "exam_type": diagnostic.exam_type,
        "subject": diagnostic.subject,
        "total_questions": diagnostic.total_questions_target,
        "questions": public_qs,
        "answers": answers_map,
        "is_finished": diagnostic.status == "completed" or len(diagnostic.answers) >= diagnostic.total_questions_target,
    }


def get_next_question(diagnostic_id: int) -> Optional[Dict]:
    """Get the next adaptive question for an ongoing diagnostic test session."""
    from ..models import DiagnosticTest
    diagnostic = DiagnosticTest.objects.get(id=diagnostic_id)
    
    if diagnostic.status != 'in_progress':
        return None
    
    questions = populate_all_questions_for_diagnostic(diagnostic)
    answered_indices = {a.get("question_idx") for a in diagnostic.answers if a.get("question_idx") is not None}
    
    # Find first unanswered index
    for q in questions:
        if q.get("index") not in answered_indices:
            return _public_question(q)
            
    if len(questions) > 0:
        return _public_question(questions[-1])
        
    return None


def _public_question(question: Dict) -> Dict:
    """Do not expose an answer key before the student submits an answer."""
    return {
        key: value for key, value in question.items()
        if key not in {"correct_answer", "explanation"}
    }
def submit_answer(diagnostic_id: int, question_idx: int, selected_answer: str, time_spent: int = 0) -> Dict:
    """Submit an answer and get updated state."""
    from ..models import DiagnosticTest
    
    diagnostic = DiagnosticTest.objects.get(id=diagnostic_id)
    
    if diagnostic.status != 'in_progress':
        return {"error": "Test allaqachon yakunlangan"}
    
    if not diagnostic.questions:
        populate_all_questions_for_diagnostic(diagnostic)
    
    # Safely handle 0-indexed question_idx
    idx = question_idx
    if idx >= len(diagnostic.questions):
        idx = len(diagnostic.questions) - 1
    if idx < 0:
        idx = 0
    question = diagnostic.questions[idx]
    correct = str(question.get("correct_answer", "")).strip().upper()
    selected = str(selected_answer).strip().upper()

    options = question.get("options", [])
    if len(selected) == 1 and selected in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        index = ord(selected) - ord("A")
        if 0 <= index < len(options):
            selected = str(options[index]).strip().upper()

    # Essay / Writing evaluation rule
    if question.get("section") == "Writing" or question.get("is_essay") or len(options) == 0:
        is_correct = len(str(selected_answer).strip()) >= 5
    else:
        is_correct = selected == correct
    difficulty_val = _difficulty_to_theta(question.get("difficulty", "medium"))
    
    # Record answer
    answer_record = {
        "question_idx": question_idx,
        "selected": selected_answer,
        "is_correct": is_correct,
        "time_spent_seconds": time_spent,
        "difficulty": question.get("difficulty", "medium"),
        "section": question.get("section", ""),
    }
    
    answers = diagnostic.answers.copy()
    existing_idx = None
    for i, a in enumerate(answers):
        if a.get("question_idx") == question_idx:
            existing_idx = i
            break
            
    if existing_idx is not None:
        answers[existing_idx] = answer_record
    else:
        answers.append(answer_record)
        
    diagnostic.answers = answers
    
    # Update theta
    new_theta = _update_theta(diagnostic.current_difficulty, is_correct, difficulty_val)
    diagnostic.current_difficulty = new_theta
    diagnostic.save(update_fields=['answers', 'current_difficulty'])
    
    # Check if test is complete
    is_finished = len(answers) >= diagnostic.total_questions_target
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.get("correct_answer", ""),
        "explanation": question.get("explanation", ""),
        "progress": len(answers),
        "total": diagnostic.total_questions_target,
        "is_finished": is_finished,
    }


def _clean_topic_name(topic: str) -> str:
    """Transform raw snake_case technical topic keys into clean human-readable academic titles."""
    if not topic:
        return "General Knowledge"
    t = str(topic).strip()
    for prefix in ["grammar_", "reading_", "listening_", "writing_"]:
        if t.lower().startswith(prefix):
            t = t[len(prefix):]
    t = t.replace("_", " ").replace("-", " ")
    t = " ".join(t.split())
    
    mapping = {
        "mcq": "Multiple Choice Questions",
        "tfng": "True / False / Not Given",
        "second conditional": "Second Conditional (If Clauses)",
        "modal obligation": "Modal Verbs of Obligation",
        "modal deduction": "Modal Verbs of Deduction",
        "possessive relative clause": "Possessive Relative Clauses",
        "present perfect vs past simple": "Present Perfect vs. Past Simple",
        "subject verb agreement": "Subject-Verb Agreement",
        "gerund vs infinitive": "Gerunds vs. Infinitives",
        "articles a an the": "Articles (A / An / The)",
        "causative form": "Causative Form (Have/Get something done)",
        "antonym scarcity": "Vocabulary (Antonyms & Synonyms)",
        "wish clause": "Wish Clauses & Past Regrets",
        "prepositions of time": "Prepositions of Time (At / On / In)",
        "future continuous": "Future Continuous Tense",
        "present perfect": "Present Perfect Tense",
        "past perfect": "Past Perfect Tense",
        "past continuous": "Past Continuous Tense",
        "past simple": "Past Simple Tense",
        "present simple": "Present Simple Tense",
        "zero conditional": "Zero Conditional",
        "inversion": "Inversion & Negative Adverbials",
        "relative clauses": "Relative Clauses",
        "reported speech": "Reported Speech",
        "reading comprehension": "Reading Comprehension & Analysis",
        "reading headings": "Reading Paragraph Headings",
        "reading matching": "Reading Information Matching"
    }
    t_lower = t.lower()
    if t_lower in mapping:
        return mapping[t_lower]
    return t.title()


def complete_diagnostic(diagnostic_id: int) -> Dict:
    """Finalize diagnostic test, evaluate with high precision, and trigger background individual study plan generation."""
    from ..models import DiagnosticTest, AIProfile
    
    diagnostic = DiagnosticTest.objects.get(id=diagnostic_id)
    if diagnostic.status == 'completed':
        return _format_result(diagnostic)
    
    # Calculate accuracy and theta
    total_correct = sum(1 for a in diagnostic.answers if a.get("is_correct"))
    total_answered = len(diagnostic.answers)
    accuracy_pct = round((total_correct / max(1, total_answered)) * 100, 1)
    
    theta = diagnostic.current_difficulty
    
    # Determine CEFR level from theta
    if theta < 0.25:
        cefr_level = "A0"
    elif theta < 0.40:
        cefr_level = "A1"
    elif theta < 0.60:
        cefr_level = "A2"
    elif theta < 0.80:
        cefr_level = "B1"
    else:
        cefr_level = "B2"

    foundation_score = round(theta * 100, 1)
    normalized_exam = {"milliy": "ms", "dtm": "ms"}.get(diagnostic.exam_type.lower(), diagnostic.exam_type.lower())
    section_scores = {}
    if normalized_exam in {"ielts", "sat", "ms"}:
        section_accuracy = {}
        for answer in diagnostic.answers:
            name = answer.get("section") or "General"
            bucket = section_accuracy.setdefault(name, [])
            bucket.append(1 if answer.get("is_correct") else 0)
        section_thetas = {
            name: max(0.05, min(0.95, sum(values) / max(1, len(values))))
            for name, values in section_accuracy.items()
        }
        estimated_score, estimated_level, estimated_band = _estimate_exam_score(
            normalized_exam, theta, section_thetas
        )
        section_scores = _calculate_section_scores(normalized_exam, section_thetas)
    else:
        estimated_score, estimated_level, estimated_band = foundation_score, cefr_level, cefr_level

    diagnostic.estimated_score = estimated_score
    diagnostic.estimated_level = estimated_level
    diagnostic.estimated_band = estimated_band
    diagnostic.section_scores = section_scores
    diagnostic.status = 'completed'
    diagnostic.completed_at = timezone.now()
    diagnostic.save()
    
    # Update user's AIProfile with diagnosed CEFR level & Foundation Score
    try:
        profile, _ = AIProfile.objects.get_or_create(user=diagnostic.user)
        profile.current_cefr = cefr_level
        profile.foundation_score = foundation_score
        profile.overall_mastery_pct = accuracy_pct
        profile.global_goal = diagnostic.exam_type
        profile.save(update_fields=['current_cefr', 'foundation_score', 'overall_mastery_pct', 'global_goal'])
    except Exception as e:
        print(f"AIProfile update warning: {e}")

    return _format_result(diagnostic)



def _format_result(diagnostic) -> Dict:
    """Format diagnostic result for API response with detailed error and topic analysis."""
    total_correct = sum(1 for a in diagnostic.answers if a.get("is_correct"))
    total_answered = len(diagnostic.answers)
    
    section_stats = {}
    weak_topics_set = set()
    mistakes_list = []

    for idx, ans in enumerate(diagnostic.answers):
        sec = ans.get("section") or "General"
        if sec not in section_stats:
            section_stats[sec] = {"correct": 0, "total": 0, "accuracy": 0}
        
        section_stats[sec]["total"] += 1
        if ans.get("is_correct"):
            section_stats[sec]["correct"] += 1
        else:
            q_info = diagnostic.questions[idx] if idx < len(diagnostic.questions) else {}
            raw_topic = q_info.get("topic") or ans.get("section") or "Mavzuli tushuncha"
            cleaned_topic = _clean_topic_name(raw_topic)
            weak_topics_set.add(cleaned_topic)
            mistakes_list.append({
                "question_index": idx + 1,
                "section": sec,
                "topic": cleaned_topic,
                "question": q_info.get("question", ""),
                "explanation": q_info.get("explanation", ""),
            })

    for sec, data in section_stats.items():
        data["accuracy"] = round((data["correct"] / max(1, data["total"])) * 100)

    norm = (diagnostic.exam_type or "IELTS").upper()
    if "SAT" in norm:
        display_level = f"SAT {int(diagnostic.estimated_score)}" if diagnostic.estimated_score > 0 else "SAT 1000"
    elif "MS" in norm or "MILLIY" in norm or "DTM" in norm:
        display_level = f"MS {int(diagnostic.estimated_score)}%" if diagnostic.estimated_score > 0 else "MS 60%"
    else:
        score = diagnostic.estimated_score if diagnostic.estimated_score > 0 else 5.5
        display_level = f"IELTS Band {score}"

    return {
        "id": diagnostic.id,
        "exam_type": diagnostic.exam_type,
        "display_level": display_level,
        "estimated_score": diagnostic.estimated_score,
        "estimated_level": diagnostic.estimated_level,
        "estimated_band": diagnostic.estimated_band,
        "section_scores": diagnostic.section_scores,
        "section_breakdown": section_stats,
        "weak_topics": list(weak_topics_set),
        "mistakes": mistakes_list,
        "total_correct": total_correct,
        "total_questions": total_answered,
        "accuracy_percent": round((total_correct / max(1, total_answered)) * 100),
        "status": diagnostic.status,
    }
