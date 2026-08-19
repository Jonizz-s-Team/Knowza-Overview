import json
import logging
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from api.ai_engine.utils import call_ai
from api.models import IELTSWritingTask, IELTSWritingSubmission, IELTSWritingEvaluation, DiagnosticTest, AIProfile, AIMemoryNode

logger = logging.getLogger(__name__)

# --- Pydantic Models for structured AI Output ---

class IELTSWritingTaskGen(BaseModel):
    task_type: str = Field(description="'task_1' or 'task_2'")
    topic: str = Field(description="The general topic of the prompt (e.g., Environment, Education, Bar Chart)")
    prompt_text: str = Field(description="The full text of the IELTS writing prompt")

class IELTSWritingEvaluationResult(BaseModel):
    overall_band: float = Field(description="Overall band score (0-9)")
    task_response_band: float = Field(description="Task Response / Achievement band score (0-9)")
    coherence_band: float = Field(description="Coherence and Cohesion band score (0-9)")
    lexical_resource_band: float = Field(description="Lexical Resource band score (0-9)")
    grammar_band: float = Field(description="Grammatical Range and Accuracy band score (0-9)")
    feedback_summary: str = Field(description="Overall constructive feedback on the essay")
    error_patterns: List[str] = Field(description="Specific recurring error patterns (e.g., 'Article misuse', 'Poor paragraphing')")
    improvements: List[str] = Field(description="Specific suggestions for improvement")

# --- Engine Functions ---

def generate_writing_task(user, target_band: float, task_type: str = "task_2") -> IELTSWritingTask:
    """
    Generates a personalized IELTS writing task based on the user's level, diagnostic test, and identified skill gaps.
    """
    # Fetch User Context
    profile = AIProfile.objects.filter(user=user).first()
    direction = profile.global_goal if profile else "IELTS"
    
    diag_test = DiagnosticTest.objects.filter(user=user, status='completed').order_by('-completed_at').first()
    diag_summary = diag_test.ai_summary if diag_test else "No diagnostic test completed yet."
    
    skill_gaps = AIMemoryNode.objects.filter(user=user, memory_type='misconception', subject='IELTS Writing').order_by('-created_at')[:5]
    gaps_str = ", ".join([g.value for g in skill_gaps]) if skill_gaps else "No specific writing weaknesses recorded yet."

    system_instruction = (
        "You are an expert IELTS examiner generating a highly personalized IELTS writing prompt. "
        f"The student is aiming for Band {target_band}. "
        f"Student's Goal/Direction: {direction}\n"
        f"Diagnostic Test Summary: {diag_summary}\n"
        f"Known Weaknesses/Skill Gaps: {gaps_str}\n"
        "Design the prompt to specifically challenge their weaknesses while remaining authentic to standard IELTS tasks. "
        "Return the result strictly in JSON according to the schema provided."
    )
    
    prompt = f"Generate a highly realistic IELTS Writing {task_type.replace('_', ' ').title()} prompt tailored to the student's weaknesses."

    response = call_ai(
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=0.8,
        user=user,
        feature="ielts_writing_gen",
        pydantic_model=IELTSWritingTaskGen
    )

    if isinstance(response, dict) and "error" in response:
        logger.error(f"Failed to generate IELTS Writing task, using fallback: {response['error']}")
        # Fallback to predefined prompt if AI fails (e.g., quota exhausted)
        task_data = {
            "task_type": task_type,
            "topic": "Environment and Technology",
            "prompt_text": "Some people think that the rapid development of technology is having a negative impact on the environment. To what extent do you agree or disagree with this opinion? Give reasons for your answer and include any relevant examples from your own knowledge or experience." if task_type == 'task_2' else "The chart below shows the total number of minutes (in billions) of telephone calls in the UK, divided into three categories, from 1995-2002. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
        }
    else:
        try:
            # Pydantic model_validate_json gives us an object, or call_ai might return a parsed dict
            if isinstance(response, str):
                task_data = IELTSWritingTaskGen.model_validate_json(response).model_dump()
            elif hasattr(response, 'model_dump'):
                task_data = response.model_dump()
            else:
                task_data = response
        except Exception as e:
            logger.exception("Error parsing IELTS Writing task JSON, using fallback")
            task_data = {
                "task_type": task_type,
                "topic": "Education",
                "prompt_text": "In many countries, students are encouraged to take a gap year before university. What are the advantages and disadvantages of this?" if task_type == 'task_2' else "Write a letter to your friend."
            }

    task = IELTSWritingTask.objects.create(
        user=user,
        task_type=task_data.get('task_type', task_type),
        topic=task_data.get('topic', 'General'),
        prompt_text=task_data.get('prompt_text', ''),
        target_band=target_band
    )
    return task


def evaluate_essay(submission: IELTSWritingSubmission) -> IELTSWritingEvaluation:
    """
    Evaluates an IELTS essay submission and returns a structured evaluation.
    """
    task = submission.task
    
    system_instruction = (
        "You are an expert, strict IELTS examiner. Grade the following essay submitted by a student. "
        "Assess strictly according to the official IELTS writing band descriptors (Task Response, Coherence, Lexical Resource, Grammar). "
        "Be highly critical and exact. "
        "In addition to bands, detect recurring grammatical or structural error patterns that the student makes. "
        "Return ONLY JSON matching the provided schema."
    )
    
    prompt = (
        f"Prompt:\n{task.prompt_text}\n\n"
        f"Student Essay:\n{submission.essay_text}\n\n"
        f"Word Count: {submission.word_count}\n"
        "Evaluate this essay."
    )

    response = call_ai(
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=0.3,
        user=task.user,
        feature="ielts_writing_eval",
        pydantic_model=IELTSWritingEvaluationResult
    )

    if isinstance(response, dict) and "error" in response:
        logger.error(f"Failed to evaluate IELTS essay, using fallback: {response['error']}")
        eval_data = {
            "overall_band": 6.0,
            "task_response_band": 6.0,
            "coherence_band": 6.0,
            "lexical_resource_band": 6.0,
            "grammar_band": 6.0,
            "feedback_summary": "This is an automated fallback evaluation because the AI service is currently unavailable (Quota Exhausted). Your essay has been recorded and given a default score of 6.0.",
            "error_patterns": ["Fallback: Unable to detect errors"],
            "improvements": ["Fallback: Try to use more complex sentence structures."]
        }
    else:
        try:
            if isinstance(response, str):
                eval_data = IELTSWritingEvaluationResult.model_validate_json(response).model_dump()
            elif hasattr(response, 'model_dump'):
                eval_data = response.model_dump()
            else:
                eval_data = response
        except Exception as e:
            logger.exception("Error parsing IELTS Writing evaluation JSON, using fallback")
            eval_data = {
                "overall_band": 6.0,
                "task_response_band": 6.0,
                "coherence_band": 6.0,
                "lexical_resource_band": 6.0,
                "grammar_band": 6.0,
                "feedback_summary": "AI Parsing Error fallback.",
                "error_patterns": [],
                "improvements": []
            }

    evaluation = IELTSWritingEvaluation.objects.create(
        submission=submission,
        overall_band=eval_data.get('overall_band', 0.0),
        task_response_band=eval_data.get('task_response_band', 0.0),
        coherence_band=eval_data.get('coherence_band', 0.0),
        lexical_resource_band=eval_data.get('lexical_resource_band', 0.0),
        grammar_band=eval_data.get('grammar_band', 0.0),
        ai_feedback_json=eval_data
    )
    
    # Here we could also loop through error_patterns and save them to AIMemoryNode or SkillGap
    # to ensure the "Adaptive Learning Loop" captures them.
    from api.models import AIMemoryNode
    for error in eval_data.get('error_patterns', []):
        AIMemoryNode.objects.create(
            user=task.user,
            memory_type='misconception',
            subject='IELTS Writing',
            topic=task.topic,
            key='writing_error_pattern',
            value=error,
            severity_score=2
        )

    task.is_completed = True
    task.save()

    return evaluation
