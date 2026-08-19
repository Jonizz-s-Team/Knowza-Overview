import json
import logging
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from api.ai_engine.utils import call_ai
from api.models import IELTSReadingPassage, IELTSReadingQuestion, IELTSReadingAttempt, DiagnosticTest, AIProfile, AIMemoryNode

logger = logging.getLogger(__name__)

# --- Pydantic Models for structured AI Output ---

class ReadingQuestionDef(BaseModel):
    question_type: str = Field(description="e.g., 'tfng', 'mcq', 'matching', 'blanks'")
    question_text: str = Field(description="The text of the question")
    options: List[str] = Field(description="Options if MCQ or matching, empty otherwise")
    correct_answer: str = Field(description="The correct answer string")
    explanation: str = Field(description="Why this is the correct answer")

class IELTSReadingPassageGen(BaseModel):
    title: str = Field(description="Title of the reading passage")
    content: str = Field(description="The full text of the reading passage")
    questions: List[ReadingQuestionDef] = Field(description="List of questions associated with the passage")

class IELTSReadingEvaluationResult(BaseModel):
    score_percent: float = Field(description="Percentage score")
    band_equivalent: float = Field(description="IELTS band score equivalent (0-9)")
    skill_gaps: List[str] = Field(description="Identified skill gaps based on incorrect answers (e.g., 'Struggles with T/F/NG')")

# --- Engine Functions ---

def generate_reading_passage(user, topic: str, difficulty_level: str) -> IELTSReadingPassage:
    """
    Generates a personalized IELTS reading passage and questions based on user's direction, diagnostic test, and weaknesses.
    """
    # Fetch User Context
    profile = AIProfile.objects.filter(user=user).first()
    direction = profile.global_goal if profile else "IELTS"
    
    diag_test = DiagnosticTest.objects.filter(user=user, status='completed').order_by('-completed_at').first()
    diag_summary = diag_test.ai_summary if diag_test else "No diagnostic test completed yet."
    
    skill_gaps = AIMemoryNode.objects.filter(user=user, memory_type='misconception', subject='IELTS Reading').order_by('-created_at')[:5]
    gaps_str = ", ".join([g.value for g in skill_gaps]) if skill_gaps else "No specific reading weaknesses recorded yet."

    system_instruction = (
        "You are an expert IELTS examiner generating a highly personalized IELTS reading passage and a set of 5-7 questions. "
        f"The difficulty should be tailored to {difficulty_level} level. "
        f"Student's Goal/Direction: {direction}\n"
        f"Diagnostic Test Summary: {diag_summary}\n"
        f"Known Weaknesses/Skill Gaps: {gaps_str}\n"
        "Include a mix of question types, specifically targeting the student's known weaknesses (e.g., if they struggle with True/False/Not Given, include more of those). "
        "Return the result strictly in JSON according to the schema provided."
    )
    
    prompt = f"Generate an IELTS reading passage about: {topic}, highly tailored to the student's profile."

    response = call_ai(
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=0.8,
        user=user,
        feature="ielts_reading_gen",
        pydantic_model=IELTSReadingPassageGen
    )

    if isinstance(response, dict) and "error" in response:
        logger.error(f"Failed to generate IELTS Reading passage, using fallback: {response['error']}")
        passage_data = {
            "title": "The Evolution of Sleep",
            "content": "Sleep is a universal behavior that has evolved across species over millions of years. While the exact reasons for sleep remain a subject of intensive scientific debate, most researchers agree that it serves critical restorative functions for the brain and body. Early theories suggested that sleep simply conserved energy when animals could not hunt or forage, typically during the night. However, modern neuroscience reveals a far more active process. During the deep stages of sleep, the brain consolidates memories, clears out metabolic waste products, and repairs cellular damage. Interestingly, not all animals sleep in the same way. Marine mammals like dolphins engage in unihemispheric slow-wave sleep, meaning only one half of their brain sleeps at a time. This allows them to continue swimming and remain alert to predators while resting. Birds also exhibit this ability, particularly during long migrations. In humans, sleep architecture is divided into Rapid Eye Movement (REM) and Non-REM stages. Non-REM sleep, especially the deep slow-wave phase, is crucial for physical restoration, whereas REM sleep is closely associated with emotional regulation and complex problem-solving. Chronic sleep deprivation has been unequivocally linked to severe health issues, including cardiovascular disease, obesity, and cognitive decline. Despite the seemingly vulnerable state sleep puts organisms in, its evolutionary persistence underscores its absolute necessity for survival.",
            "questions": [
                {
                    "question_type": "tfng",
                    "question_text": "Early theories proposed that the primary purpose of sleep was memory consolidation.",
                    "options": [],
                    "correct_answer": "False",
                    "explanation": "Early theories suggested it was to conserve energy, not memory consolidation."
                },
                {
                    "question_type": "mcq",
                    "question_text": "According to the passage, how do dolphins sleep?",
                    "options": ["They sleep on the ocean floor", "They only sleep during the day", "Half of their brain sleeps at a time", "They do not need sleep"],
                    "correct_answer": "Half of their brain sleeps at a time",
                    "explanation": "The text states dolphins engage in unihemispheric slow-wave sleep."
                },
                {
                    "question_type": "tfng",
                    "question_text": "Humans are the only species that experience REM sleep.",
                    "options": [],
                    "correct_answer": "Not Given",
                    "explanation": "The passage discusses REM sleep in humans, but does not explicitly state that other species do or do not experience it."
                }
            ]
        }
    else:
        try:
            if isinstance(response, str):
                passage_data = IELTSReadingPassageGen.model_validate_json(response).model_dump()
            elif hasattr(response, 'model_dump'):
                passage_data = response.model_dump()
            else:
                passage_data = response
        except Exception as e:
            logger.exception("Error parsing IELTS Reading passage JSON, using fallback")
            passage_data = {
                "title": "Fallback Passage",
                "content": "This is a fallback passage because the AI failed to generate content.",
                "questions": [
                    {
                        "question_type": "tfng",
                        "question_text": "This is a fallback text.",
                        "options": [],
                        "correct_answer": "True",
                        "explanation": "It is stated in the text."
                    }
                ]
            }
            
    passage = IELTSReadingPassage.objects.create(
        user=user,
        title=passage_data.get('title', 'Reading Passage'),
        content=passage_data.get('content', ''),
        difficulty_level=difficulty_level,
        topic=topic
    )

    for q_data in passage_data.get('questions', []):
        IELTSReadingQuestion.objects.create(
            passage=passage,
            question_type=q_data.get('question_type', 'mcq'),
            question_text=q_data.get('question_text', ''),
            options=q_data.get('options', []),
            correct_answer=q_data.get('correct_answer', ''),
            explanation=q_data.get('explanation', '')
        )

    return passage


def evaluate_reading_attempt(passage: IELTSReadingPassage, answers: Dict[str, str], time_spent_seconds: int) -> IELTSReadingAttempt:
    """
    Evaluates an IELTS reading attempt natively (no AI needed for exact matching, 
    but AI used for skill gap analysis).
    answers format: {question_id_str: 'student_answer'}
    """
    questions = passage.questions.all()
    correct_count = 0
    total_questions = questions.count()
    
    incorrect_details = []

    for q in questions:
        student_ans = str(answers.get(str(q.id), "")).strip().lower()
        correct_ans = str(q.correct_answer).strip().lower()
        
        # Simple string matching
        if student_ans == correct_ans:
            correct_count += 1
        else:
            incorrect_details.append({
                "question_type": q.question_type,
                "question": q.question_text,
                "student_answer": student_ans,
                "correct_answer": correct_ans
            })
            
    score_percent = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    # IELTS Band rough estimate based on percentage
    # (Actual IELTS Reading band calculation is more complex and depends on Academic/General, but this is a proxy)
    band_equivalent = 0.0
    if score_percent >= 90: band_equivalent = 8.5
    elif score_percent >= 80: band_equivalent = 7.5
    elif score_percent >= 70: band_equivalent = 6.5
    elif score_percent >= 60: band_equivalent = 5.5
    elif score_percent >= 50: band_equivalent = 5.0
    elif score_percent >= 40: band_equivalent = 4.5
    else: band_equivalent = 4.0

    skill_gaps = []
    
    if incorrect_details:
        # Use AI to analyze the pattern of incorrect answers
        system_instruction = (
            "You are an expert IELTS reading tutor. Analyze the student's incorrect answers. "
            "Identify 1-3 specific skill gaps (e.g., 'Struggles with True/False/Not Given', 'Poor scanning for dates'). "
            "Return strictly as a JSON list of strings in the 'skill_gaps' field."
        )
        
        prompt = f"Student got {correct_count}/{total_questions} correct. Incorrect details: {json.dumps(incorrect_details)}. Identify skill gaps."
        
        response = call_ai(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            user=passage.user,
            feature="ielts_reading_eval",
            pydantic_model=IELTSReadingEvaluationResult
        )
        
        if isinstance(response, dict) and "error" in response:
            logger.error(f"Failed to generate IELTS Reading evaluation, using fallback: {response['error']}")
            skill_gaps = ["Fallback: Struggling with basic reading comprehension."]
        else:
            try:
                if isinstance(response, str):
                    eval_data = IELTSReadingEvaluationResult.model_validate_json(response).model_dump()
                elif hasattr(response, 'model_dump'):
                    eval_data = response.model_dump()
                else:
                    eval_data = response
                    
                skill_gaps = eval_data.get('skill_gaps', [])
            except Exception:
                logger.exception("Failed to parse AI skill gap analysis, using fallback")
                skill_gaps = ["Fallback: Failed to identify specific skill gaps due to AI error"]
            
    # Save the attempt
    attempt = IELTSReadingAttempt.objects.create(
        passage=passage,
        answers=answers,
        time_spent_seconds=time_spent_seconds,
        score_percent=score_percent,
        band_equivalent=band_equivalent,
        skill_gaps_identified=skill_gaps
    )
    
    # Save skill gaps to AIMemoryNode for Adaptive Learning Loop
    from api.models import AIMemoryNode
    for gap in skill_gaps:
        AIMemoryNode.objects.create(
            user=passage.user,
            memory_type='misconception',
            subject='IELTS Reading',
            topic=passage.topic,
            key='reading_error_pattern',
            value=gap,
            severity_score=2
        )

    passage.is_completed = True
    passage.save()
    
    return attempt
