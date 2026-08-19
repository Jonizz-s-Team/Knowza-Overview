import math
from typing import Dict, Any

from .exam_knowledge import ExamRegistry


class DifficultyEngine:
    BURNOUT_TABLE = (
        (2.0, 1.0),
        (3.0, 1.08),
        (4.0, 1.18),
        (5.0, 1.35),
        (6.0, 1.55),
        (8.0, 1.80),
        (float("inf"), 2.10),
    )

    @classmethod
    def efficiency_multiplier(cls, daily_hours: float) -> float:
        try:
            daily_hours = float(daily_hours)
        except (ValueError, TypeError):
            daily_hours = 2.0
        for threshold, multiplier in cls.BURNOUT_TABLE:
            if daily_hours <= threshold:
                return multiplier
        return 2.10

    @classmethod
    def calculate_hours(cls, exam_type: str, current: float, target: float) -> float:
        if exam_type == "IELTS":
            return cls._ielts_hours(current, target)
        return cls._generic_hours(exam_type, current, target)

    @classmethod
    def _ielts_hours(cls, current: float, target: float) -> float:
        lookup = ExamRegistry.get_ielts_hours(current, target)
        if lookup is not None:
            return lookup
        return cls._generic_hours("IELTS", current, target)

    @classmethod
    def _generic_hours(cls, exam_type: str, current: float, target: float) -> float:
        config = ExamRegistry.get(exam_type)
        current = max(config.min_score, min(current, config.max_score - 0.01))
        target = max(current + config.score_step, min(target, config.max_score))

        score_range = config.max_score - config.min_score
        norm_current = (current - config.min_score) / score_range
        norm_target = (target - config.min_score) / score_range

        raw_gap = target - current
        base_hours = raw_gap * config.base_hours_per_unit

        avg_norm = (norm_current + norm_target) / 2.0
        avg_norm = min(avg_norm, 0.98)

        exponent = config.difficulty_exponent - 1.0
        difficulty_multiplier = 1.0 / math.pow(1.0 - avg_norm, exponent)

        total = base_hours * difficulty_multiplier
        return max(total, 1.0)

    @classmethod
    def calculate_total_hours(
        cls,
        exam_type: str,
        current: float,
        target: float,
        daily_hours: float,
    ) -> Dict[str, Any]:
        optimal = cls.calculate_hours(exam_type, current, target)
        burnout = cls.efficiency_multiplier(daily_hours)
        actual = optimal * burnout
        days = math.ceil(actual / daily_hours) if daily_hours > 0 else 0
        weeks = math.ceil(days / 7.0) if days > 0 else 0

        return {
            "optimal_hours": round(optimal, 1),
            "burnout_multiplier": burnout,
            "actual_hours": round(actual, 1),
            "days_needed": days,
            "weeks_needed": weeks,
            "daily_hours": daily_hours,
        }

    @classmethod
    def generate_milestones(
        cls,
        exam_type: str,
        current: float,
        target: float,
        days_needed: int,
    ) -> list:
        config = ExamRegistry.get(exam_type)
        milestones = []
        weeks_needed = math.ceil(days_needed / 7.0) if days_needed > 0 else 0

        milestones.append({
            "day": 0,
            "week": 0,
            "predicted_score": ExamRegistry.snap_score(exam_type, current),
        })

        for week in range(1, weeks_needed + 1):
            day_num = min(week * 7, days_needed)
            ratio = day_num / days_needed if days_needed > 0 else 1.0
            progress = math.pow(ratio, 1.0 / config.difficulty_exponent)
            raw_score = current + (target - current) * progress
            snapped = ExamRegistry.snap_score(exam_type, raw_score)

            milestones.append({
                "day": day_num,
                "week": week,
                "predicted_score": snapped,
            })

            if day_num >= days_needed:
                break

        return milestones
