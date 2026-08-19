from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from .exam_knowledge import ExamRegistry
from .difficulty_engine import DifficultyEngine
from .section_allocator import SectionAllocator
from .phase_builder import PhaseBuilder
from .tier_differentiator import TierDifferentiator
from .curriculum_bank import CurriculumBank


def assemble_study_plan(
    goal_name: str,
    current_score: float,
    target_score: float,
    daily_hours: float,
    is_premium: bool = False,
    sub_skill_scores: Optional[Dict[str, float]] = None,
    study_days_per_week: int = 7,
    start_date: Optional[datetime] = None,
    ms_subject: str = "",
    interests: Optional[List[str]] = None,
) -> Dict[str, Any]:
    if start_date is None:
        start_date = datetime.now()

    exam_type = ExamRegistry.detect(goal_name)
    config = ExamRegistry.get(exam_type)

    current_score, target_score = ExamRegistry.validate_scores(
        exam_type, current_score, target_score
    )

    timeline = DifficultyEngine.calculate_total_hours(
        exam_type, current_score, target_score, daily_hours
    )

    tier_config = TierDifferentiator.get_config(is_premium)
    capped_weeks = 1  # Har doim 1-hafta rejasi tuziladi, o'quvchi tugatgach keyingisi tuziladi

    daily_minutes = int(daily_hours * 60)
    allocations = SectionAllocator.allocate(
        exam_type,
        daily_minutes,
        sub_skill_scores if tier_config["gap_based_allocation"] else None,
    )

    phases = PhaseBuilder.build(
        exam_type=exam_type,
        total_weeks=capped_weeks,
        is_pro=is_premium,
        daily_minutes=daily_minutes,
        study_days_per_week=study_days_per_week,
    )

    milestones = DifficultyEngine.generate_milestones(
        exam_type, current_score, target_score, capped_weeks * 7
    )

    if not is_premium:
        milestones = [m for m in milestones if m["week"] % 4 == 0 or m["week"] == 0 or m == milestones[-1]]

    level = CurriculumBank.get_level_for_score(exam_type, current_score)

    weeks_output = _build_weeks_output(
        phases=phases,
        exam_type=exam_type,
        level=level,
        is_premium=is_premium,
        ms_subject=ms_subject,
    )

    current_band = ExamRegistry.get_band(exam_type, current_score)
    target_band = ExamRegistry.get_band(exam_type, target_score)

    end_date = start_date + timedelta(days=capped_weeks * 7)

    todays_mission = _generate_todays_mission(
        exam_type=exam_type,
        level=level,
        daily_minutes=daily_minutes,
        allocations=allocations,
        count=tier_config["daily_missions_count"],
    )

    return {
        "exam_type": exam_type,
        "exam_display_name": config.display_name,
        "current_score": current_score,
        "target_score": target_score,
        "current_band": current_band.label if current_band else None,
        "target_band": target_band.label if target_band else None,
        "daily_hours": daily_hours,
        "daily_minutes": daily_minutes,
        "timeline": timeline,
        "milestones": milestones,
        "daily_allocation": allocations,
        "phases": [
            {
                "name": p["name"],
                "name_uz": p["name_uz"],
                "focus": p["focus"],
                "focus_uz": p["focus_uz"],
                "start_week": p["start_week"],
                "end_week": p["end_week"],
            }
            for p in phases
        ],
        "weeks": weeks_output,
        "todays_mission": todays_mission,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "tier": "pro" if is_premium else "free",
        "tier_config": tier_config,
        "needs_ai_generation": is_premium,
        "prompt_constraints": TierDifferentiator.build_prompt_constraints(
            is_premium,
            {
                "daily_minutes": daily_minutes,
                "exam_type": exam_type,
                "current_score": current_score,
                "target_score": target_score,
            },
        ),
        "ms_subject": ms_subject if exam_type == "MS" else None,
    }


SECTION_MAP_UZ = {
    "Listening": "Tinglash",
    "Reading": "O'qish",
    "Writing": "Yozish",
    "Speaking": "So'zlashuv",
    "Math": "Matematika",
    "Verbal": "Verbal / O'qish",
}


def _build_weeks_output(
    phases: List[Dict],
    exam_type: str,
    level: str,
    is_premium: bool,
    ms_subject: str = "",
) -> List[Dict]:
    weeks = []
    topic_cursor = {}

    for phase in phases:
        for week_data in phase["weeks"]:
            week_num = week_data["week_number"]
            nodes = []

            for day_data in week_data["days"]:
                if day_data["node_type"] == "mock_test":
                    description = TierDifferentiator.get_mock_test_template(
                        is_premium, week_num, exam_type
                    )
                    nodes.append({
                        "day_label": day_data["day_label"],
                        "title": f"Hafta {week_num} — Mini Mock Test",
                        "description": description,
                        "estimated_minutes": day_data["estimated_minutes"],
                        "node_type": "mock_test",
                        "needs_ai": True,
                        "phase": phase["name"],
                    })
                elif day_data["node_type"] == "lesson_group":
                    day_sub_nodes = day_data.get("nodes", [])
                    day_tasks = []
                    total_day_minutes = 0

                    for sub_node in day_sub_nodes:
                        section = sub_node.get("section", "")
                        skill = sub_node.get("skill", "")
                        topic = _pick_topic(exam_type, level, section, topic_cursor, ms_subject)
                        section_uz = SECTION_MAP_UZ.get(section, section)

                        if topic:
                            topic_uz = topic[1] if (isinstance(topic, tuple) and len(topic) > 1) else topic[0]
                            task_title = f"{section_uz}: {topic_uz}"
                        else:
                            task_title = f"{section_uz}: {skill}"

                        mins = sub_node.get("estimated_minutes", 30)
                        total_day_minutes += mins
                        day_tasks.append({
                            "title": task_title,
                            "estimated_minutes": mins,
                            "section": section,
                        })

                    day_main_title = day_tasks[0]["title"] if day_tasks else f"{day_data['day_label']} Darsliklar"

                    first_task = day_tasks[0] if day_tasks else {}
                    description = TierDifferentiator.get_description_template(
                        is_premium,
                        {
                            "section": first_task.get("section", ""),
                            "skill": day_main_title,
                            "topics": [t["title"] for t in day_tasks],
                            "estimated_minutes": total_day_minutes or day_data.get("estimated_minutes", 60),
                        }
                    )

                    nodes.append({
                        "day_label": day_data["day_label"],
                        "title": day_main_title,
                        "description": description,
                        "estimated_minutes": total_day_minutes or day_data.get("estimated_minutes", 60),
                        "node_type": "lesson",
                        "tasks": day_tasks,
                        "needs_ai": is_premium,
                        "phase": phase["name"],
                    })

            weeks.append({
                "week_number": week_num,
                "phase": phase["name"],
                "phase_uz": phase["name_uz"],
                "nodes": nodes,
            })

    return weeks


def _pick_topic(
    exam_type: str,
    level: str,
    section: str,
    cursor: Dict,
    ms_subject: str = "",
) -> Optional[tuple]:
    topics = CurriculumBank.get_topics(exam_type, level, section)
    if not topics:
        return None

    key = f"{exam_type}_{level}_{section}"
    idx = cursor.get(key, 0)
    topic = topics[idx % len(topics)]
    cursor[key] = idx + 1
    return topic


def _generate_todays_mission(
    exam_type: str,
    level: str,
    daily_minutes: int,
    allocations: List[Dict],
    count: int = 4,
) -> List[str]:
    missions = []
    sections = [a.get("section", "") for a in allocations if a.get("section")]
    if not sections:
        sections = ["Listening", "Reading", "Writing", "Speaking"]

    lesson_count = count - 1 if count > 1 else count
    part_min = max(10, daily_minutes // max(1, count))

    for i in range(lesson_count):
        sec = sections[i % len(sections)]
        topics = CurriculumBank.get_topics(exam_type, level, sec)
        sec_uz = SECTION_MAP_UZ.get(sec, sec)
        if topics:
            topic_idx = min(i, len(topics) - 1)
            topic_tuple = topics[topic_idx]
            topic_name = topic_tuple[1] if (isinstance(topic_tuple, tuple) and len(topic_tuple) > 1) else topic_tuple[0]
            missions.append(f"{sec_uz}: {topic_name} ({part_min} daqiqa)")
        else:
            missions.append(f"{sec_uz}: Amaliyot va mashqlar ({part_min} daqiqa)")

    if count > 1:
        review_min = max(10, daily_minutes - (part_min * lesson_count))
        missions.append(f"Bugungi o'rganilgan mavzularni takrorlash va xatolar ustida ishlash ({review_min} daqiqa)")

    return missions[:count]
