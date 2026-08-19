from typing import Dict, Any


class TierDifferentiator:
    TIER_CONFIGS = {
        "free": {
            "max_phases": 2,
            "weekly_mock_tests": False,
            "gap_based_allocation": False,
            "ai_lesson_descriptions": False,
            "daily_missions_count": 2,
            "milestone_frequency": "monthly",
            "curriculum_depth": "generic",
            "max_weeks": 8,
            "nodes_per_day": 2,
            "description_style": "short",
        },
        "pro": {
            "max_phases": 4,
            "weekly_mock_tests": True,
            "gap_based_allocation": True,
            "ai_lesson_descriptions": True,
            "daily_missions_count": 3,
            "milestone_frequency": "weekly",
            "curriculum_depth": "exam_specific",
            "max_weeks": 52,
            "nodes_per_day": 3,
            "description_style": "full_md",
        },
    }

    @classmethod
    def get_config(cls, is_premium: bool) -> Dict[str, Any]:
        key = "pro" if is_premium else "free"
        return dict(cls.TIER_CONFIGS[key])

    @classmethod
    def should_use_ai(cls, is_premium: bool) -> bool:
        return cls.TIER_CONFIGS["pro" if is_premium else "free"]["ai_lesson_descriptions"]

    @classmethod
    def cap_weeks(cls, weeks: int, is_premium: bool) -> int:
        max_weeks = cls.TIER_CONFIGS["pro" if is_premium else "free"]["max_weeks"]
        return min(weeks, max_weeks)

    @classmethod
    def get_description_template(cls, is_premium: bool, node_data: Dict) -> str:
        if is_premium:
            return ""

        section = node_data.get("section", "")
        skill = node_data.get("skill", "")
        topics = node_data.get("topics", [])
        minutes = node_data.get("estimated_minutes", 30)

        topics_str = ", ".join(topics[:3]) if topics else "umumiy mavzular"

        return (
            f"**{section} — {skill}** ({minutes} daqiqa)\n\n"
            f"Bugungi mashg'ulotda siz quyidagi mavzularni o'rganasiz: {topics_str}.\n\n"
            f"Har bir mavzuni sinchiklab o'rganing va mashqlarni bajaring."
        )

    @classmethod
    def get_mock_test_template(cls, is_premium: bool, week_number: int, exam_type: str) -> str:
        if is_premium:
            return ""

        return (
            f"**{week_number}-hafta yakuniy mini-test**\n\n"
            f"Ushbu haftada o'rganilgan barcha mavzularni qamrab oluvchi {exam_type} formatidagi test.\n\n"
            f"Vaqtni nazorat qiling va real imtihon sharoitida ishlang."
        )

    @classmethod
    def build_prompt_constraints(cls, is_premium: bool, plan_data: Dict) -> str:
        if not is_premium:
            return ""

        daily_minutes = plan_data.get("daily_minutes", 120)
        exam_type = plan_data.get("exam_type", "")
        current_score = plan_data.get("current_score", "")
        target_score = plan_data.get("target_score", "")

        return (
            f"\n[PLAN ENGINE CONSTRAINTS]:\n"
            f"- Exam: {exam_type}\n"
            f"- Student progress: {current_score} → {target_score}\n"
            f"- Daily study budget: {daily_minutes} minutes (STRICT)\n"
            f"- Each lesson description MUST be written as professional, detailed Markdown\n"
            f"- Include specific strategies, examples, and practice methods\n"
            f"- Descriptions must feel like a real private tutor session\n"
        )
