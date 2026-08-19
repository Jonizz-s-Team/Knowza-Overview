"""
Test Engine - AI-powered test generation with exam bank few-shot examples.

This module generates high-quality practice tests by:
1. Loading few-shot examples from the exam_bank for the relevant exam type
2. Injecting them into the AI prompt so generated tests match real exam quality
3. Tracking skill gaps based on student performance
"""
import json
import os
import logging
from .utils import call_ai
from ..models import SkillGap, AIProfile
from .exam_bank.repository import select_questions

logger = logging.getLogger(__name__)


def _detect_exam_type(topic: str) -> str:
    """Detect whether the topic is SAT, IELTS, MS, or general."""
    topic_lower = topic.lower()
    
    sat_keywords = ['sat', 'digital sat', 'algebra', 'geometry', 'trigonometry', 
                    'reading and writing', 'advanced math', 'college board',
                    'craft and structure', 'expression of ideas', 'standard english']
    ielts_keywords = ['ielts', 'listening', 'speaking', 'writing task', 'reading passage',
                      'band', 'academic reading', 'general training', 'cue card',
                      'true false not given', 'matching headings']
    ms_keywords = ['milliy sertifikat', 'dtm', 'sertifikat', 'milliy']
    
    for kw in sat_keywords:
        if kw in topic_lower:
            return 'sat'
    for kw in ielts_keywords:
        if kw in topic_lower:
            return 'ielts'
    for kw in ms_keywords:
        if kw in topic_lower:
            return 'ms'
    return 'general'


def _get_few_shot_examples(exam_type: str, topic: str, difficulty: str = None) -> str:
    """Load relevant few-shot examples from the exam bank."""
    try:
        from .exam_bank import (
            get_sat_examples, 
            get_ielts_examples, 
            get_ms_examples,
            format_examples_for_prompt
        )
        
        examples = []
        
        if exam_type == 'sat':
            # Detect SAT domain from topic
            topic_lower = topic.lower()
            domain = None
            section_type = None
            
            if any(kw in topic_lower for kw in ['algebra', 'equation', 'linear', 'inequality']):
                domain = 'algebra'
                section_type = 'math'
            elif any(kw in topic_lower for kw in ['geometry', 'triangle', 'circle', 'trig', 'angle']):
                domain = 'geometry'
                section_type = 'math'
            elif any(kw in topic_lower for kw in ['advanced', 'quadratic', 'polynomial', 'exponential']):
                domain = 'advanced'
                section_type = 'math'
            elif any(kw in topic_lower for kw in ['data', 'statistics', 'probability', 'ratio', 'percent']):
                domain = 'problem-solving'
                section_type = 'math'
            elif any(kw in topic_lower for kw in ['math', 'matematik']):
                section_type = 'math'
            elif any(kw in topic_lower for kw in ['reading', 'writing', 'grammar', 'vocabulary', 'craft']):
                section_type = 'reading'
            
            examples = get_sat_examples(
                domain=domain,
                difficulty=difficulty,
                section_type=section_type,
                count=4
            )
            
            # If domain-specific didn't return enough, get general SAT examples
            if len(examples) < 3:
                extra = get_sat_examples(count=4 - len(examples))
                examples.extend(extra)
                
        elif exam_type == 'ielts':
            # Detect IELTS section from topic
            topic_lower = topic.lower()
            section = None
            question_type = None
            
            if 'reading' in topic_lower:
                section = 'reading'
            elif 'listening' in topic_lower:
                section = 'listening'
            elif 'writing' in topic_lower:
                section = 'writing'
            elif 'speaking' in topic_lower:
                section = 'speaking'
            
            if 'true' in topic_lower and 'false' in topic_lower:
                question_type = 'true/false'
            elif 'matching' in topic_lower:
                question_type = 'matching'
            elif 'completion' in topic_lower:
                question_type = 'completion'
            
            examples = get_ielts_examples(
                section=section,
                question_type=question_type,
                count=4
            )
            
            if len(examples) < 3:
                extra = get_ielts_examples(count=4 - len(examples))
                examples.extend(extra)

        elif exam_type == 'ms':
            examples = get_ms_examples(
                subject=topic,
                difficulty=difficulty,
                count=4
            )
        
        if examples:
            return format_examples_for_prompt(examples, max_examples=3)
        
    except ImportError as e:
        logger.warning(f"Exam bank not available: {e}")
    except Exception as e:
        logger.warning(f"Error loading exam bank examples: {e}")
    
    return ""


def generate_sandbox_test_content(topic, difficulty, profile):
    """
    Generate a practice test using AI with exam bank few-shot examples.
    Returns parsed JSON test data.
    """
    # Exam-prep tests are selected from the local reviewed bank.  They must
    # never be fabricated at request time, otherwise scores and explanations
    # cannot be trusted. General non-exam LMS content keeps the legacy AI path.
    exam_type = _detect_exam_type(topic)
    if exam_type in {"ielts", "sat", "ms"}:
        selected = select_questions(
            exam_type,
            count=10,
            difficulty=difficulty or "",
            seed=f"sandbox:{exam_type}:{topic}:{difficulty or 'medium'}",
        )
        return {
            "title": f"{exam_type.upper()} Practice: {topic}",
            "exam_type": exam_type,
            "difficulty": difficulty or "medium",
            "questions": [
                {
                    "id": item.id,
                    "question": item.prompt,
                    "passage": item.passage,
                    "options": list(item.options),
                    "correct_answer": item.correct_answer,
                    "explanation": item.explanation,
                    "topic": item.domain or item.skill,
                    "section": item.section,
                }
                for item in selected
            ],
            "bank_shortfall": max(0, 10 - len(selected)),
        }

    prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', 'test_generator.txt')
    with open(prompt_path, 'r', encoding='utf-8') as f:
        system_prompt = f.read().strip()
    
    # Detect exam type and load few-shot examples
    few_shot_examples = _get_few_shot_examples(exam_type, topic, difficulty)
    
    # Format the system prompt with profile data
    goal = getattr(profile, 'global_goal', 'general')
    level = getattr(profile, 'current_level', 'basic')
    language = getattr(profile, 'learning_language', 'uz')
    subject = getattr(profile, 'subject_focus', topic)
    
    level_map = {
        'zero': 'Beginner level',
        'basic': 'Intermediate level', 
        'advanced': 'Advanced level',
    }
    level_instruction = level_map.get(level, 'Intermediate level')
    
    lang_map = {
        'uz': 'Respond in Uzbek language.',
        'en': 'Respond in English.',
        'ru': 'Respond in Russian.',
    }
    lang_instruction = lang_map.get(language, 'Respond in Uzbek language.')
    
    try:
        system_prompt = system_prompt.format(
            subject=subject or topic,
            level_instruction=level_instruction,
            language_instruction=lang_instruction,
            question_count=10,
            few_shot_examples=few_shot_examples
        )
    except KeyError:
        # Fallback if format string has issues
        system_prompt = system_prompt.replace('{subject}', subject or topic)
        system_prompt = system_prompt.replace('{level_instruction}', level_instruction)
        system_prompt = system_prompt.replace('{language_instruction}', lang_instruction)
        system_prompt = system_prompt.replace('{question_count}', '10')
        system_prompt = system_prompt.replace('{few_shot_examples}', few_shot_examples)
    
    user_message = (
        f"Generate a {difficulty or 'medium'} level test about: {topic}\n"
        f"Subject focus: {subject}\n"
        f"Exam type: {exam_type.upper()}\n"
        f"Generate exactly 10 high-quality questions."
    )
    
    response = call_ai(
        prompt=user_message,
        system_instruction=system_prompt,
        feature="test_gen",
        user=getattr(profile, 'user', None)
    )
    
    # Parse JSON response
    if isinstance(response, dict):
        if 'error' in response:
            logger.error(f"AI error in test generation: {response['error']}")
            return []
        return response
    
    try:
        # Try to extract JSON from string response
        text = str(response)
        # Try full object first
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        if start_idx >= 0 and end_idx > start_idx:
            json_str = text[start_idx:end_idx]
            return json.loads(json_str)
        
        # Try array
        start_idx = text.find('[')
        end_idx = text.rfind(']') + 1
        if start_idx >= 0 and end_idx > start_idx:
            json_str = text[start_idx:end_idx]
            return json.loads(json_str)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse test generation response: {e}")
    
    return []


def socratic_coach_response(question_text, user_answer, correct_answer, explanation, profile):
    """
    Generate a Socratic coaching response for a wrong answer.
    Guides students to discover the correct answer themselves.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', 'socratic_coach.txt')
    with open(prompt_path, 'r', encoding='utf-8') as f:
        system_prompt = f.read().strip()
    
    goal = getattr(profile, 'global_goal', 'general')
    level = getattr(profile, 'current_level', 'basic')
    language = getattr(profile, 'learning_language', 'uz')
    subject = getattr(profile, 'subject_focus', 'General')
    
    level_map = {
        'zero': 'Beginner level',
        'basic': 'Intermediate level',
        'advanced': 'Advanced level',
    }
    level_instruction = level_map.get(level, 'Intermediate level')
    lang_map = {
        'uz': 'Respond in Uzbek language.',
        'en': 'Respond in English.',
        'ru': 'Respond in Russian.',
    }
    lang_instruction = lang_map.get(language, 'Respond in Uzbek language.')
    
    try:
        system_prompt = system_prompt.format(
            goal=goal,
            subject=subject,
            level_instruction=level_instruction,
            language_instruction=lang_instruction
        )
    except KeyError:
        pass
        
    user_message = (
        f"Question: {question_text}\n"
        f"User Answer: {user_answer}\n"
        f"Correct Answer: {correct_answer}\n"
        f"Explanation: {explanation}\n"
        f"Provide socratic feedback."
    )
    
    response = call_ai(
        prompt=user_message,
        system_instruction=system_prompt,
        feature="socratic",
        user=getattr(profile, 'user', None)
    )
    
    if isinstance(response, dict):
        return response.get('text', response.get('error', 'Unable to generate response'))
    return str(response)


def update_skill_gaps(user, test_results, subject):
    """
    Track skill gaps based on test results.
    Marks skills as 'weak' after 3+ errors, removes weakness after correct answers.
    """
    from django.utils import timezone
    
    for result in test_results:
        skill_name = result.get('topic', result.get('topic_tag', 'General'))
        
        if not result.get('is_correct', False):
            skill, _ = SkillGap.objects.get_or_create(
                user=user, 
                skill_name=skill_name,
                subject=subject
            )
            skill.error_count += 1
            skill.last_error_at = timezone.now()
            if skill.error_count >= 3:
                skill.status = 'weak'
            skill.save()
        else:
            skill = SkillGap.objects.filter(
                user=user, 
                skill_name=skill_name, 
                subject=subject
            ).first()
            if skill:
                skill.error_count = max(0, skill.error_count - 1)
                if skill.error_count == 0:
                    skill.status = 'ok'
                skill.save()
