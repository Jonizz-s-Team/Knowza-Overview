from typing import Dict, List, Optional

from .exam_knowledge import ExamRegistry, ExamConfig


class SectionAllocator:
    @classmethod
    def allocate(
        cls,
        exam_type: str,
        daily_minutes: int,
        sub_skill_scores: Optional[Dict[str, float]] = None,
    ) -> List[Dict]:
        config = ExamRegistry.get(exam_type)

        if sub_skill_scores:
            return cls._gap_based_allocation(config, daily_minutes, sub_skill_scores)
        return cls._default_allocation(config, daily_minutes)

    @classmethod
    def _default_allocation(cls, config: ExamConfig, daily_minutes: int) -> List[Dict]:
        allocations = []
        total_assigned = 0

        for i, section in enumerate(config.sections):
            if i == len(config.sections) - 1:
                minutes = daily_minutes - total_assigned
            else:
                minutes = round(daily_minutes * section.daily_ratio)
                total_assigned += minutes

            allocations.append({
                "section": section.name,
                "section_uz": section.name_uz,
                "minutes": max(minutes, 10),
                "skills": [
                    {"name": s.name, "name_uz": s.name_uz, "weight": s.weight}
                    for s in section.skills
                ],
            })

        return allocations

    @classmethod
    def _gap_based_allocation(
        cls,
        config: ExamConfig,
        daily_minutes: int,
        sub_skill_scores: Dict[str, float],
    ) -> List[Dict]:
        section_gaps = {}
        for section in config.sections:
            section_name_lower = section.name.lower()
            raw_score = sub_skill_scores.get(
                section.name,
                sub_skill_scores.get(section_name_lower, None),
            )
            score = None
            if raw_score is not None:
                try:
                    score = float(str(raw_score).replace(',', '.'))
                except (ValueError, TypeError):
                    score = None

            if score is not None:
                gap = max(0.0, 1.0 - (score / 100.0)) if score <= 100 else max(0.0, 1.0 - (score / config.max_score))
            else:
                gap = 0.5
            section_gaps[section.name] = gap

        total_gap = sum(section_gaps.values())
        if total_gap == 0:
            return cls._default_allocation(config, daily_minutes)

        allocations = []
        total_assigned = 0

        for i, section in enumerate(config.sections):
            if i == len(config.sections) - 1:
                minutes = daily_minutes - total_assigned
            else:
                gap_ratio = section_gaps[section.name] / total_gap
                base_ratio = section.daily_ratio
                blended_ratio = (base_ratio * 0.3) + (gap_ratio * 0.7)
                minutes = round(daily_minutes * blended_ratio)
                total_assigned += minutes

            weak_skills = cls._identify_weak_skills(section, sub_skill_scores)

            allocations.append({
                "section": section.name,
                "section_uz": section.name_uz,
                "minutes": max(minutes, 10),
                "gap_score": round(section_gaps[section.name], 2),
                "weak_skills": weak_skills,
                "skills": [
                    {"name": s.name, "name_uz": s.name_uz, "weight": s.weight}
                    for s in section.skills
                ],
            })

        return allocations

    @classmethod
    def _identify_weak_skills(cls, section, sub_skill_scores: Dict[str, float]) -> List[str]:
        weak = []
        for skill in section.skills:
            raw_score = sub_skill_scores.get(skill.name)
            if raw_score is not None:
                try:
                    score = float(str(raw_score).replace(',', '.'))
                    if score < 50:
                        weak.append(skill.name)
                except (ValueError, TypeError):
                    pass
        return weak
