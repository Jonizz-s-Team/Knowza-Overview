import os
from .constants import INTENTS
from .profiling import estimate_tokens

def _load_prompt_template(template_name: str) -> str:
    prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prompts')
    filepath = os.path.join(prompts_dir, template_name)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        return ''

def _build_system_prompt(intent: str, profile: dict, system_prompt_limit: int) -> str:
    template_map = {
        INTENTS.EXPLAIN_SIMPLE: 'explain_simple.txt',
        INTENTS.EXPLAIN_DEEP: 'explain_deep.txt',
        INTENTS.SIMPLIFY: 'explain_simple.txt',
        INTENTS.DEEPEN: 'explain_deep.txt',
        INTENTS.TEST_GEN: 'test_generator.txt',
        INTENTS.SOCRATIC_COACH: 'socratic_coach.txt',
        INTENTS.ARTICLE_GEN: 'article_writer.txt',
        INTENTS.TEST_HELP: 'test_help.txt',
        INTENTS.TEST_FEEDBACK: 'test_feedback.txt',
    }
    template = _load_prompt_template(template_map.get(intent, 'explain_simple.txt'))

    goal = profile.get('global_goal', 'general knowledge')
    level = profile.get('current_level', 'basic')
    language = profile.get('learning_language', 'en')
    if intent == INTENTS.ARTICLE_GEN:
        subject = 'unspecified'
    else:
        subject = profile.get('subject_focus', '')

    level_map = {
        'zero': 'Beginner level - use very simple language and metaphors',
        'basic': 'Intermediate level - explain core concepts clearly',
        'advanced': 'Advanced level - use deep academic explanations',
    }
    level_instruction = level_map.get(level, level_map['basic'])

    lang_map = {
        'uz': 'Respond strictly in Uzbek. Use natural and polite Uzbek language.',
        'uz_latin': 'Respond strictly in Uzbek. Use natural and polite Uzbek language.',
        'uz_cyrillic': 'Respond strictly in Uzbek (Cyrillic script).',
        'ru': 'Respond strictly in Russian. Use natural and professional Russian language.',
        'en': 'Respond in English.',
        'mixed': 'Respond in English.'
    }
    lang_instruction = lang_map.get(language, lang_map['en'])

    # Load few-shot examples for test generation
    few_shot_examples = ""
    question_count = "10"
    if intent == INTENTS.TEST_GEN:
        try:
            from ..exam_bank import get_sat_examples, get_ielts_examples, format_examples_for_prompt
            
            # Detect exam type from profile goals
            goals = profile.get('target_goals', []) or profile.get('goals', [])
            exam_type = 'general'
            if goals and isinstance(goals, list) and len(goals) > 0:
                goal_name = goals[0].get('name', '').lower() if isinstance(goals[0], dict) else str(goals[0]).lower()
                if 'sat' in goal_name:
                    exam_type = 'sat'
                elif 'ielts' in goal_name:
                    exam_type = 'ielts'
            
            # Also check from subject/goal text
            if exam_type == 'general':
                combined = f"{subject} {goal}".lower()
                if 'sat' in combined:
                    exam_type = 'sat'
                elif 'ielts' in combined:
                    exam_type = 'ielts'
            
            examples = []
            if exam_type == 'sat':
                examples = get_sat_examples(count=3)
            elif exam_type == 'ielts':
                examples = get_ielts_examples(count=3)
            
            if examples:
                few_shot_examples = format_examples_for_prompt(examples, max_examples=3)
        except Exception:
            pass

    if template:
        try:
            system_prompt = template.format(
                goal=goal,
                level=level,
                level_instruction=level_instruction,
                language_instruction=lang_instruction,
                subject=subject or 'unspecified',
                question_count=question_count,
                few_shot_examples=few_shot_examples,
            )
        except KeyError:
            # Fallback: do simple replacements for templates that don't use all keys
            system_prompt = template.format(
                goal=goal,
                level=level,
                level_instruction=level_instruction,
                language_instruction=lang_instruction,
                subject=subject or 'unspecified',
            )
    else:
        system_prompt = (
            f"You are Knowza AI - an educational assistant. "
            f"Student goal: {goal}. Level: {level_instruction}. "
            f"{lang_instruction}"

        )

    # Personalization block
    persona = profile.get('ai_persona')
    bio = profile.get('bio')
    interests = profile.get('interests')
    if isinstance(interests, list):
        interests = ", ".join(interests[:5])  # Cap at 5 for prompt efficiency
    socials = profile.get('favorite_social_media')
    if isinstance(socials, list):
        socials = ", ".join(socials[:5])
    age = profile.get('age')
    ai_memory_summary = profile.get('ai_memory_summary')
    
    personalization = []
    if persona:
        persona_map = {
            'qattiqqol': 'Strict and disciplined teacher',
            'dostona': 'Friendly and supportive peer',
            'motivator': 'Highly encouraging and motivating',
            'hazilkash': 'Humorous and funny (use jokes/memes/fun analogies)',
            'faylasuf': 'Philosophical, deep, and thoughtful',
            'jiddiy': 'Formal, serious, and professional'
        }
        mapped_persona = persona_map.get(persona, persona)
        personalization.append(f"\n[YOUR AI PERSONA]: You MUST act as a {mapped_persona}.")
    
    student_ctx = []
    if ai_memory_summary: 
        student_ctx.append(f"AI Long-Term Memory Summary: {ai_memory_summary}")
    
    if age: student_ctx.append(f"Age: {age}")
    if interests: student_ctx.append(f"Interests: {interests}")
    if socials: student_ctx.append(f"Social Media: {socials}")
    if bio: student_ctx.append(f"Bio: {bio[:200]}") # limit bio length
    
    target_goals = profile.get('target_goals')
    if target_goals: 
        student_ctx.append(f"Target Goals: {target_goals}")
        personalization.append("\n[GOAL FEASIBILITY]: Review the student's target deadlines. If a deadline is unrealistically short for the subject (e.g., learning a whole science in 3 days), EXPLICITLY warn the user that the timeline is highly compressed or impossible, and offer a focused 'crash course' alternative instead of pretending it's a normal timeline.")
    
    if student_ctx:
        personalization.append(f"[STUDENT CONTEXT]:\n- " + "\n- ".join(student_ctx))
        personalization.append("\n[INSTRUCTION]: Incorporate the student's interests and context naturally into your examples, analogies, and explanations without being overly repetitive.")

    is_premium = profile.get('is_premium', False)
    if not is_premium:
        personalization.append("\n[ACCOUNT STATUS]: The user is on a FREE plan. If they mention preparing for a specific university in their goals or prompts, IGNORE IT. You must NOT provide university-specific guidance or act as a university preparation guide for FREE users. General study goals are fine.")

    try:
        if age and int(age) < 18:
            personalization.append("\n[SAFETY LIMITATION]: The student is under 18. You MUST NOT discuss, teach, or recommend any taboo, explicit, or age-inappropriate topics under any circumstances.")
    except (ValueError, TypeError):
        pass

    personalization.append("\n[IDENTITY SAFETY]: You are Knowza AI, an educational assistant. The user's Bio and background (e.g., Founder, CEO, student) are purely for your context. You MUST NOT adopt their titles or pretend to be part of their organization.")

    if personalization:
        system_prompt += "\n\n" + "\n".join(personalization)

    # Append master Foundation Teacher prompt
    foundation_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prompts', 'FoundationTeacher.md')
    if os.path.exists(foundation_prompt_path):
        with open(foundation_prompt_path, 'r', encoding='utf-8') as f:
            system_prompt += "\n\n" + f.read().strip()

    # Inject CEFR-level adaptive scaffolding based on student's current level
    try:
        from ..ai_engine.cognitive_pedagogy import CEFRAdaptiveScaffolder
        cefr_level = profile.get('current_level', 'A1')
        # Map generic level names to CEFR codes
        cefr_map = {'zero': 'A0', 'basic': 'A1', 'intermediate': 'B1', 'advanced': 'B2'}
        mapped_level = cefr_map.get(cefr_level, cefr_level)
        scaffolding = CEFRAdaptiveScaffolder.get_scaffolding(mapped_level, topic=subject)
        if scaffolding:
            system_prompt += f"\n\n{scaffolding}"
    except Exception:
        pass

    if len(system_prompt) > system_prompt_limit:
        system_prompt = system_prompt[:system_prompt_limit]

    return system_prompt

def build_prompt(
    intent: str,
    user_message: str,
    profile: dict,
    history: list,
    system_prompt_limit: int,
    knowledge_context: str = '',
) -> list:
    messages = []
    system_prompt = _build_system_prompt(intent, profile, system_prompt_limit)
    if knowledge_context:
        system_prompt += f"\n\n# DATABASE REFERENCE:\n{knowledge_context}"
    messages.append({'role': 'system', 'content': system_prompt})
    
    for msg in history:
        messages.append({
            'role': msg.get('role', 'user'),
            'content': msg.get('content', ''),
        })
        
    messages.append({'role': 'user', 'content': user_message})
    return messages

def fit_to_budget(messages: list, input_cap: int) -> list:
    if not messages:
        return messages
    total = sum(estimate_tokens(m.get('content', '')) for m in messages)
    while total > input_cap and len(messages) > 2:
        removed = messages.pop(1)
        total -= estimate_tokens(removed.get('content', ''))
    return messages
