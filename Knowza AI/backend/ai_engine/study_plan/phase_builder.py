import math
from typing import Dict, List

from .exam_knowledge import ExamRegistry
from .tier_differentiator import TierDifferentiator


class PhaseBuilder:
    PHASE_TEMPLATES = {
        "full": [
            {
                "name": "Diagnostic & Foundation",
                "name_uz": "Diagnostika va Asos",
                "ratio": 0.15,
                "focus": "Assess baseline, fix fundamentals, learn exam format",
                "focus_uz": "Boshlang'ich daraja, asoslar, imtihon formati",
                "node_types": ("lesson", "lesson", "lesson"),
                "includes_mock": False,
            },
            {
                "name": "Skills Development",
                "name_uz": "Ko'nikmalar rivojlanishi",
                "ratio": 0.55,
                "focus": "Target weak areas with progressive difficulty",
                "focus_uz": "Zaif tomonlarni bosqichma-bosqich kuchaytirish",
                "node_types": ("lesson", "lesson", "lesson", "mock_test"),
                "includes_mock": True,
            },
            {
                "name": "Exam Simulation",
                "name_uz": "Imtihon simulyatsiyasi",
                "ratio": 0.20,
                "focus": "Full mock tests, timing strategy, test-day simulation",
                "focus_uz": "To'liq mock testlar, vaqt boshqaruvi, imtihon kuni simulyatsiyasi",
                "node_types": ("lesson", "mock_test"),
                "includes_mock": True,
            },
            {
                "name": "Final Review",
                "name_uz": "Yakuniy tayyorgarlik",
                "ratio": 0.10,
                "focus": "Error analysis, confidence building, last-minute tips",
                "focus_uz": "Xatolar tahlili, o'ziga ishonch, oxirgi maslahatlar",
                "node_types": ("lesson", "mock_test"),
                "includes_mock": True,
            },
        ],
        "simplified": [
            {
                "name": "Foundation & Practice",
                "name_uz": "Asos va Mashq",
                "ratio": 0.45,
                "focus": "Learn basics and start practicing",
                "focus_uz": "Asoslarni o'rganing va mashq qiling",
                "node_types": ("lesson", "lesson"),
                "includes_mock": False,
            },
            {
                "name": "Exam Preparation",
                "name_uz": "Imtihonga tayyorgarlik",
                "ratio": 0.55,
                "focus": "Practice tests and review",
                "focus_uz": "Mashq testlar va takrorlash",
                "node_types": ("lesson", "mock_test"),
                "includes_mock": True,
            },
        ],
    }

    @classmethod
    def build(
        cls,
        exam_type: str,
        total_weeks: int,
        is_pro: bool = False,
        daily_minutes: int = 120,
        study_days_per_week: int = 7,
    ) -> List[Dict]:
        template_key = "full" if is_pro else "simplified"
        templates = cls.PHASE_TEMPLATES[template_key]
        config = ExamRegistry.get(exam_type)

        phases = []
        week_cursor = 1

        for tmpl in templates:
            phase_weeks = max(1, round(total_weeks * tmpl["ratio"]))

            if tmpl == templates[-1]:
                phase_weeks = total_weeks - week_cursor + 1
                if phase_weeks <= 0:
                    phase_weeks = 1

            weeks_data = []
            for w in range(phase_weeks):
                week_num = week_cursor + w
                if week_num > total_weeks:
                    break

                days = cls._build_week_days(
                    config=config,
                    week_number=week_num,
                    phase_name=tmpl["name"],
                    daily_minutes=daily_minutes,
                    study_days=study_days_per_week,
                    includes_mock=tmpl["includes_mock"],
                    is_pro=is_pro,
                )
                weeks_data.append({
                    "week_number": week_num,
                    "days": days,
                })

            phases.append({
                "name": tmpl["name"],
                "name_uz": tmpl["name_uz"],
                "focus": tmpl["focus"],
                "focus_uz": tmpl["focus_uz"],
                "start_week": week_cursor,
                "end_week": week_cursor + phase_weeks - 1,
                "total_weeks": phase_weeks,
                "weeks": weeks_data,
            })

            week_cursor += phase_weeks

        return phases

    @classmethod
    def _build_week_days(
        cls,
        config,
        week_number: int,
        phase_name: str,
        daily_minutes: int,
        study_days: int,
        includes_mock: bool,
        is_pro: bool,
    ) -> List[Dict]:
        days = []
        sections = config.sections

        for day_idx in range(study_days):
            day_num = day_idx + 1
            is_last_day = day_num == study_days

            if is_last_day and includes_mock:
                days.append({
                    "day_label": f"{day_num}-kun",
                    "node_type": "mock_test",
                    "estimated_minutes": daily_minutes,
                    "section_focus": "all",
                    "needs_ai_description": is_pro,
                })
            else:
                nodes_per_day = TierDifferentiator.get_config(is_pro)["nodes_per_day"]
                minutes_per_node = daily_minutes // nodes_per_day
                remainder = daily_minutes - (minutes_per_node * nodes_per_day)

                day_nodes = []
                for n in range(nodes_per_day):
                    # Rotate sections so each node in the same day covers a different section!
                    sec_idx = (day_idx + n) % len(sections)
                    section = sections[sec_idx]

                    node_minutes = minutes_per_node + (remainder if n == 0 else 0)
                    skill_idx = (day_idx * nodes_per_day + n) % len(section.skills)
                    skill = section.skills[skill_idx]

                    day_nodes.append({
                        "node_type": "lesson",
                        "estimated_minutes": node_minutes,
                        "section": section.name,
                        "section_uz": section.name_uz,
                        "skill": skill.name,
                        "skill_uz": skill.name_uz,
                        "topics": list(skill.topics),
                    })

                primary_sec = sections[day_idx % len(sections)]
                days.append({
                    "day_label": f"{day_num}-kun",
                    "node_type": "lesson_group",
                    "estimated_minutes": daily_minutes,
                    "section_focus": primary_sec.name,
                    "nodes": day_nodes,
                    "needs_ai_description": True,
                })

        return days
