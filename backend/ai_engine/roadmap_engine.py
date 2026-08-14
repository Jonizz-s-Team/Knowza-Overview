from django.utils import timezone
from ..models import LearningPath, LearningNode, AIProfile
import json
import os
from .utils import call_ai
from pydantic import BaseModel, Field
from typing import List, Optional

class RoadmapNodeSchema(BaseModel):
    day_label: str = Field(description="Kun (masalan: '1-kun', 'Day 1')")
    title: str = Field(description="Nodening aniq nomi (masalan: 'Reading Passage 2', 'Math: Algebra')")
    description: str = Field(description="Batafsil ma'lumot va strategiya")
    estimated_minutes: int = Field(description="Sarflanadigan vaqt (daqiqa)")
    node_type: str = Field(description="O'rganish turi: 'lesson' yoki 'mock_test'")

class RoadmapWeekSchema(BaseModel):
    week_number: int = Field(description="Hafta raqami")
    nodes: List[RoadmapNodeSchema] = Field(description="Ushbu haftadagi darslar va oxiridagi mock test")

class RoadmapSchema(BaseModel):
    greeting: str = Field(description="Foydalanuvchiga yuboriladigan motivatsion xabar (masalan: 'Hello, future IELTS 7.5 student...')")
    todays_mission: List[str] = Field(description="Bugungi kun uchun 3 ta aniq topshiriq")
    prediction: str = Field(description="Imtihon bo'yicha taxminiy natija o'sishi (masalan: '6.3 -> 6.4' yoki '+20 points')")
    weeks: List[RoadmapWeekSchema] = Field(description="Haftalarga bo'lingan Duolingo uslubidagi o'quv rejasi")


def generate_roadmap(profile_id):
    profile = AIProfile.objects.get(id=profile_id)
    
    # Eskilarni o'chirish (ko'pchilik bo'lgani uchun .all().delete())
    profile.learning_paths.all().delete()

    user = profile.user
    goals = getattr(user, 'target_goals', [])
    
    if not goals or len(goals) == 0:
        fallback_dir = profile.global_goal or profile.subject_focus or "IELTS"
        goals = [{"direction": fallback_dir, "name": fallback_dir}]

    created_paths = []
    
    for g in goals:
        if isinstance(g, dict):
            direction = g.get('name', '') or g.get('title', '') or g.get('direction', '') or g.get('goal', '') or g.get('subject', '')
            target = g.get('targetLevel', '') or g.get('target_score', '') or g.get('target', '')
            deadline = g.get('targetDeadline', '') or g.get('deadline', '')
            t_commit = g.get('timeCommitment', '') or g.get('time_commitment', '')
            current_sub_skills = g.get('currentSubSkills', {})
            target_sub_skills = g.get('targetSubSkills', {})
            goal_type = g.get('type', 'certificate')
            ms_subject = g.get('subject', '')
        else:
            direction = str(g)
            target = ''
            deadline = ''
            goal_type = ''
            current_sub_skills = {}
            target_sub_skills = {}
            ms_subject = ''
            t_commit = ''

        if not direction:
            direction = profile.global_goal or profile.subject_focus or "IELTS"

        # Sync profile global_goal & subject_focus with selected exam
        profile.global_goal = direction
        profile.subject_focus = direction
        if target:
            profile.target_score = str(target)
        profile.save()

        level = getattr(user, 'current_level', profile.current_level)
        subject = profile.subject_focus
        language = profile.learning_language
        
        study_days = getattr(user, 'study_days', [])
        study_hours_per_day = getattr(user, 'study_hours_per_day', '')
        
        daily_hours = study_hours_per_day or t_commit or '2'
        try:
            daily_hours_float = float(str(daily_hours).replace(',', '.'))
        except ValueError:
            daily_hours_float = 2.0

        import re
        def extract_score(text):
            if not text: return None
            t_str = str(text).strip()
            cefr_map = {
                "A1": 3.0, "A2": 4.0, "B1": 5.0, "B2": 6.0, "C1": 7.0, "C2": 8.5,
                "BEGINNER": 4.0, "ELEMENTARY": 4.5, "INTERMEDIATE": 5.5, "ADVANCED": 7.0
            }
            upper_text = t_str.upper()
            if upper_text in cefr_map:
                return cefr_map[upper_text]
            matches = re.findall(r'\d+(?:\.\d+)?', t_str)
            if matches: return float(matches[0])
            return None

        from .study_plan import ExamRegistry, assemble_study_plan

        exam_type = ExamRegistry.detect(direction)
        config = ExamRegistry.get(exam_type)

        # Automatically fetch latest completed diagnostic test result for exact band and weak topics
        from ..models import DiagnosticTest
        current_score_num = None
        diag_test = DiagnosticTest.objects.filter(user=user, status='completed').order_by('-completed_at').first()
        if diag_test and diag_test.estimated_band:
            try:
                current_score_num = float(diag_test.estimated_band)
            except (ValueError, TypeError):
                pass

        current_score_num = current_score_num if current_score_num is not None else extract_score(level)
        target_score_num = extract_score(target)

        if not current_score_num:
            current_score_num = 4.0  # Default to beginner Band 4.0 if level not specified
        if not target_score_num:
            target_score_num = min(current_score_num + 2.0, config.max_score)

        if current_score_num >= target_score_num:
            target_score_num = min(current_score_num + config.score_step * 2, config.max_score)

        # Automatic 2-hour daily study time recommendation for large band gaps (>= 1.5 bands)
        band_gap = target_score_num - current_score_num
        if band_gap >= 1.5 and daily_hours_float < 2.0:
            daily_hours_float = 2.0  # Allocate 2 hours (120 minutes) per day for solid 1.5+ band growth!

        is_premium = getattr(user, 'is_premium', False)
        study_days_count = len(study_days) if study_days else 7

        plan = assemble_study_plan(
            goal_name=direction,
            current_score=current_score_num,
            target_score=target_score_num,
            daily_hours=daily_hours_float,
            is_premium=is_premium,
            sub_skill_scores=current_sub_skills if current_sub_skills else None,
            study_days_per_week=study_days_count,
            ms_subject=ms_subject,
            interests=getattr(user, 'interests', [])
        )
        
        timeline = plan["timeline"]
        timeline_str = f"{current_score_num} -> {target_score_num} in {timeline['days_needed']} days"
        todays_mission = plan["todays_mission"]

        try:
            greeting, weeks_data = _generate_pro_content(
                plan=plan,
                direction=direction,
                level=level,
                subject=subject,
                language=language,
                user=user,
                daily_hours_float=daily_hours_float,
                ms_subject=ms_subject
            )
        except Exception:
            greeting = f"Salom! Sizning {direction} bo'yicha maqsadingizga {timeline['weeks_needed']} haftada erishamiz."
            weeks_data = plan["weeks"]

        total_nodes = sum(len(w.get("nodes", [])) for w in weeks_data)

        path = LearningPath.objects.create(
            profile=profile,
            goal_direction=direction,
            goal_type=goal_type,
            title=f"Roadmap: {direction}",
            subject=subject,
            total_nodes=total_nodes,
            meta_data={
                "greeting": greeting,
                "todays_mission": todays_mission,
                "prediction": timeline_str,
                "phases": plan["phases"],
                "milestones": plan["milestones"],
                "daily_allocation": plan["daily_allocation"],
                "tier": plan["tier"]
            }
        )
        
        created_nodes = []
        global_order = 0
        for week in weeks_data:
            week_number = week.get("week_number", 1)
            nodes_data = week.get("nodes", [])
            
            for node_data in nodes_data:
                node = LearningNode.objects.create(
                    path=path,
                    title=node_data.get('title', f'Dars {global_order+1}'),
                    description=node_data.get('description', ''),
                    order=global_order,
                    week_number=week_number,
                    day_label=node_data.get('day_label', ''),
                    node_type=node_data.get('node_type', 'lesson'),
                    status='available' if global_order == 0 else 'locked',
                    estimated_minutes=node_data.get('estimated_minutes', 30)
                )
                if global_order > 0:
                    node.prerequisites.add(created_nodes[-1])
                created_nodes.append(node)
                global_order += 1
            
        created_paths.append(path)
        
    return created_paths


def _generate_pro_content(plan, direction, level, subject, language, user, daily_hours_float, ms_subject):
    prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', 'prompt_roadmap.txt')
    with open(prompt_path, 'r', encoding='utf-8') as f:
        system_prompt = f.read().strip()
        
    teacher_prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prompts', 'FoundationTeacher.md')
    if os.path.exists(teacher_prompt_path):
        with open(teacher_prompt_path, 'r', encoding='utf-8') as f:
            system_prompt += "\n\n" + f.read().strip()

    system_prompt += plan["prompt_constraints"]

    skeleton_summary = _build_skeleton_summary(plan)

    # Deeply fetch student's specific skill gaps, grammar weaknesses, and diagnostic test details
    weakness_lines = []
    try:
        from ..models import SkillGap, AIMemoryNode, DiagnosticTest
        diag = DiagnosticTest.objects.filter(user=user, status='completed').order_by('-completed_at').first()
        if diag:
            weakness_lines.append(f"\n🎯 O'QUVCHINING ANIQ DIAGNOSTIKA TESTI TAHLILI:")
            weakness_lines.append(f"- Natija / Daraja: Band {diag.estimated_band or diag.display_level} (Umumiy aniqlik: {diag.accuracy_percent}%)")
            
            if diag.weak_topics and isinstance(diag.weak_topics, list) and len(diag.weak_topics) > 0:
                formatted_topics = [t.replace('grammar_', '').replace('reading_', '').replace('writing_', '').replace('listening_', '').replace('_', ' ').title() for t in diag.weak_topics]
                weakness_lines.append(f"- ANIQ XATO QILINGAN MAVZULAR VA BO'SHLIQLAR (MUST FIX): {', '.join(formatted_topics)}")
            
            if diag.section_breakdown and isinstance(diag.section_breakdown, dict):
                breakdown_str = ", ".join([f"{sec}: {data.get('correct', 0)}/{data.get('total', 0)} to'g'ri" for sec, data in diag.section_breakdown.items() if isinstance(data, dict)])
                if breakdown_str:
                    weakness_lines.append(f"- Bo'limlar bo'yicha ko'rsatkichlar: {breakdown_str}")

            if diag.mistakes and isinstance(diag.mistakes, list) and len(diag.mistakes) > 0:
                mistake_summaries = []
                for m in diag.mistakes[:10]:
                    if isinstance(m, dict):
                        q_sec = m.get('section', 'Grammar')
                        q_top = m.get('topic', '').replace('_', ' ')
                        q_exp = m.get('explanation', '')
                        mistake_summaries.append(f"  * [{q_sec}] {q_top}: {q_exp}")
                if mistake_summaries:
                    weakness_lines.append("- Xato qilingan savollar tahlili:\n" + "\n".join(mistake_summaries))

        gaps = list(SkillGap.objects.filter(user=user, status='weak').values_list('skill_name', flat=True))
        if gaps:
            weakness_lines.append(f"- Qo'shimcha zaif ko'nikmalar: {', '.join(gaps)}")
        
        mems = list(AIMemoryNode.objects.filter(user=user, is_resolved=False).values_list('value', flat=True)[:5])
        if mems:
            weakness_lines.append(f"- Xatolar ro'yxati: {', '.join(mems)}")
    except Exception as e:
        print("Error compiling diagnostic weaknesses for roadmap generation:", e)

    weakness_info = ("\n" + "\n".join(weakness_lines)) if weakness_lines else ""

    daily_minutes = int(daily_hours_float * 60)
    user_message = f"""
O'rganiladigan fan/yo'nalish: {subject}
Asosiy Maqsad: {direction} ({plan['current_score']} -> {plan['target_score']})
O'quvchining hozirgi darajasi: {level}{weakness_info}
Til: {language}
Kunlik o'quv vaqti: {daily_minutes} daqiqa ({daily_hours_float} soat)

TAYYOR SKELET:
{skeleton_summary}

CRITICAL DIRECTIVE (ENG MUHIM TALAB):
1. O'quvchi diagnostika testida AYNAN qaysi mavzularda (Grammatika: prepositions of time, wish clause, present simple, present perfect vs past simple; Reading: headings, TFNG; Writing: essay coherence va h.k.) XATO QILGAN VA BO'SHLIQLARI aniqlangan bo'lsa, ushbu o'quv rejadagi darslar (Nodes) va topshiriqlar (Tasks) AYNAN USHBU ZAIF MAVZULARNI 100% PUXTA O'RGATISH, XATOLARINI TUZATISH VA AMALIYOTDA MUSTAHKAMLASHGA YO'NALTIRILGAN BO'LSIN!
2. Har bir darsning nomi va tavsifida (description) u yo'l qo'ygan grammatik va akademik xatosi hamda uni qanday qilib to'g'ri ishlash kerakligi batafsil tushuntirilsin.
3. Har bir kunning vaqt yig'indisi ANIQ {daily_minutes} daqiqa bo'lsin.
4. 'greeting' qismida o'quvchining diagnostika testida aniqlangan ushbu xatolari (grammatika, reading, writing bo'shliqlari) aynan ushbu individual reja orqali qanday bosqichma-bosqich yo'qotilishi haqida tushuntirish bering.
"""

    response = call_ai(
        prompt=user_message, 
        system_instruction=system_prompt,
        feature="roadmap_gen",
        pydantic_model=RoadmapSchema,
        user=user
    )
    
    if isinstance(response, dict) and "error" in response:
        return (
            f"Salom! {direction} bo'yicha maqsadingizga erishamiz!",
            plan["weeks"]
        )
        
    try:
        greeting = response.get("greeting", f"Salom! {direction} bo'yicha maqsadingizga erishamiz!")
        ai_weeks = response.get("weeks", [])
        
        merged_weeks = _merge_ai_descriptions(plan["weeks"], ai_weeks)
        return greeting, merged_weeks
    except Exception:
        return (
            f"Salom! {direction} bo'yicha maqsadingizga erishamiz!",
            plan["weeks"]
        )


def _build_skeleton_summary(plan):
    lines = []
    for week in plan["weeks"][:4]:
        lines.append(f"\n--- Hafta {week['week_number']} ({week.get('phase', '')}) ---")
        for node in week["nodes"]:
            lines.append(
                f"  {node['day_label']}: {node['title']} "
                f"({node['estimated_minutes']} min, {node['node_type']})"
            )
    if len(plan["weeks"]) > 4:
        lines.append(f"\n... va yana {len(plan['weeks']) - 4} ta hafta ...")
    return "\n".join(lines)


def _merge_ai_descriptions(engine_weeks, ai_weeks):
    ai_map = {}
    for aw in ai_weeks:
        wn = aw.get("week_number", 0)
        for node in aw.get("nodes", []):
            key = (wn, node.get("day_label", ""))
            ai_map[key] = node

    merged = []
    for week in engine_weeks:
        wn = week["week_number"]
        merged_nodes = []
        for node in week["nodes"]:
            key = (wn, node.get("day_label", ""))
            ai_node = ai_map.get(key)
            if ai_node and isinstance(ai_node, dict):
                node = dict(node)
                if ai_node.get("description"):
                    node["description"] = ai_node["description"]
                if ai_node.get("title"):
                    node["title"] = ai_node["title"]
                if ai_node.get("tasks"):
                    node["tasks"] = ai_node["tasks"]
            merged_nodes.append(node)
        merged.append({**week, "nodes": merged_nodes})

    return merged


def regenerate_node(node_id):
    node = LearningNode.objects.get(id=node_id)
    profile = node.path.profile
    
    goal = profile.global_goal
    level = profile.current_level
    subject = profile.subject_focus
    
    system_prompt = f"""
    Siz ta'lim bo'yicha ekspertsiz. {subject} fanidan {level} darajadagi o'quvchi uchun 
    '{goal}' maqsadiga yetish yo'lidagi bitta dars modulini (blokini) qayta yozib berishingiz kerak.
    Faqatgina bitta blok uchun JSON formatida javob qaytaring.
    JSON formati: {{"title": "Mavzu nomi", "description": "Batafsil tavsif", "estimated_minutes": 30}}
    """
    
    user_message = f"Eski blok nomi: {node.title}\nEski tavsifi: {node.description}\nBuni yanada qiziqarliroq va aniqroq qilib, o'quvchining joriy darajasiga (Level: {level}) moslashtirib qayta yozib bering."
    
    response = call_ai(prompt=user_message, system_instruction=system_prompt)
    
    try:
        if isinstance(response, dict) and "error" in response:
            raise Exception(response["error"])
        if isinstance(response, dict):
            node_data = response
        else:
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            json_str = response[start_idx:end_idx]
            node_data = json.loads(json_str)
            
        node.title = node_data.get('title', node.title)
        node.description = node_data.get('description', node.description)
        node.estimated_minutes = node_data.get('estimated_minutes', node.estimated_minutes)
        node.save()
    except Exception as e:
        print(f"Failed to regenerate node: {e}")
        
    return node
