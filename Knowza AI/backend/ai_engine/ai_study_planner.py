import math
from datetime import datetime, timedelta
from typing import Dict, Any, List

class AIStudyPlanner:
    """
    Advanced predictive AI Study Planner.
    Models learning curves, diminishing returns, and burn-out factors to generate
    highly accurate, realistic score predictions and section-by-section study allocations.
    """

    EXAM_CONFIGS = {
        "SAT": {
            "min_score": 400,
            "max_score": 1600,
            "base_hours_per_point": 0.2,  # Base: 0.2 hours per 1 point at the median
            "difficulty_curve_exponent": 1.5, # >1 means it gets exponentially harder near the max score
            "median_score": 1050,
            "sections": [
                {"name": "Reading and Writing", "weight": 0.5, "daily_ratio": 0.45},
                {"name": "Math", "weight": 0.5, "daily_ratio": 0.55}
            ]
        },
        "IELTS": {
            "min_score": 0.0,
            "max_score": 9.0,
            "base_hours_per_point": 30.0, # Base: 30 hours per 0.5 band (so 60 hours per 1.0 band)
            "difficulty_curve_exponent": 2.0, # Very hard to jump from 8 to 9
            "median_score": 6.0,
            "sections": [
                {"name": "Listening", "weight": 0.25, "daily_ratio": 0.2},
                {"name": "Reading", "weight": 0.25, "daily_ratio": 0.25},
                {"name": "Writing", "weight": 0.25, "daily_ratio": 0.3},
                {"name": "Speaking", "weight": 0.25, "daily_ratio": 0.25}
            ]
        },
        "MS": { # Milliy Sertifikat
            "min_score": 0,
            "max_score": 100,
            "base_hours_per_point": 2.0,
            "difficulty_curve_exponent": 1.3,
            "median_score": 50,
            "sections": [
                {"name": "Asosiy Fan (Major)", "weight": 0.7, "daily_ratio": 0.65},
                {"name": "Majburiy Fanlar (Mandatory)", "weight": 0.3, "daily_ratio": 0.35}
            ]
        }
    }

    @classmethod
    def _detect_exam_type(cls, goal_name: str) -> str:
        goal = str(goal_name).upper()
        if 'SAT' in goal: return 'SAT'
        if 'IELTS' in goal: return 'IELTS'
        if 'MILLIY' in goal or 'DTM' in goal or 'SERTIFIKAT' in goal: return 'MS'
        return 'SAT' # Default fallback for calculation purposes

    @classmethod
    def _calculate_efficiency_multiplier(cls, daily_hours: float) -> float:
        """
        Models burnout and diminishing daily returns.
        1-2 hours: 100% efficient
        3-4 hours: 90% efficient
        5-6 hours: 75% efficient
        >6 hours: 50% efficient on the marginal hours
        Returns a multiplier where >1.0 means it takes longer.
        """
        try:
            daily_hours = float(daily_hours)
        except (ValueError, TypeError):
            daily_hours = 2.0
        if daily_hours <= 2.0:
            return 1.0
        elif daily_hours <= 4.0:
            return 1.15
        elif daily_hours <= 6.0:
            return 1.4
        else:
            return 1.8

    @classmethod
    def _calculate_hours_for_gap(cls, exam: str, current: float, target: float) -> float:
        """
        Integral-based calculation to model that moving from 1400->1500 is harder 
        than 1000->1100 on SAT.
        """
        config = cls.EXAM_CONFIGS[exam]
        
        # Ensure bounds
        current = max(config['min_score'], min(current, config['max_score'] - 0.01))
        target = max(current + 0.1, min(target, config['max_score']))
        
        # Normalize scores to 0-1 range
        range_val = config['max_score'] - config['min_score']
        norm_curr = (current - config['min_score']) / range_val
        norm_target = (target - config['min_score']) / range_val
        
        # Base hours required for the raw point gap
        raw_gap = target - current
        base_hours = raw_gap * config['base_hours_per_point']
        
        # Difficulty multiplier based on how close target is to max score
        # e.g., if target is 0.9 (90% of max), the exponent pushes the multiplier very high
        # We average the difficulty over the jump
        avg_norm = (norm_curr + norm_target) / 2.0
        
        # Avoid division by zero at the very absolute top by capping avg_norm
        avg_norm = min(avg_norm, 0.99)
        
        difficulty_multiplier = 1.0 / math.pow(1.0 - avg_norm, config['difficulty_curve_exponent'] - 1.0)
        
        # Calculate total hours needed
        total_hours = base_hours * difficulty_multiplier
        return max(total_hours, 1.0)

    @classmethod
    def predict_timeline(cls, goal_name: str, current_score: float, target_score: float, daily_hours: float, start_date: datetime = None) -> Dict[str, Any]:
        """
        Calculates the timeline and milestones for a given exam goal.
        """
        if start_date is None:
            start_date = datetime.now()
            
        exam = cls._detect_exam_type(goal_name)
        config = cls.EXAM_CONFIGS[exam]
        
        if current_score >= target_score:
            return {
                "exam_type": exam,
                "status": "completed",
                "message": "Joriy ball maqsadli balldan yuqori yoki teng.",
                "days_needed": 0,
                "estimated_end_date": start_date.strftime('%Y-%m-%d'),
                "milestones": []
            }
            
        # Calculate base hours required considering the difficulty curve
        optimal_hours_needed = cls._calculate_hours_for_gap(exam, current_score, target_score)
        
        # Apply daily burnout inefficiency
        efficiency_multiplier = cls._calculate_efficiency_multiplier(daily_hours)
        actual_hours_needed = optimal_hours_needed * efficiency_multiplier
        
        days_needed = math.ceil(actual_hours_needed / daily_hours)
        estimated_end_date = start_date + timedelta(days=days_needed)
        
        # Generate Weekly Milestones
        milestones = []
        weeks_needed = math.ceil(days_needed / 7.0)
        
        # We reverse-engineer the score at each week using a simplified inverse
        # For simplicity in output generation, we do a linear interpolation on the normalized effort
        curr_effort = 0.0
        
        milestones.append({
            "day": 0,
            "date": start_date.strftime('%Y-%m-%d'),
            "predicted_score": round(current_score, 1)
        })
        
        for week in range(1, weeks_needed + 1):
            day_num = week * 7
            if day_num > days_needed:
                day_num = days_needed
                
            effort_ratio = day_num / days_needed
            
            # Non-linear score progression (fast at start, slow at end)
            # score = current + (target - current) * (effort_ratio ^ (1/difficulty_exponent))
            progress_ratio = math.pow(effort_ratio, 1.0 / config['difficulty_curve_exponent'])
            
            pred_score = current_score + (target_score - current_score) * progress_ratio
            
            # Snap to typical exam increments (e.g. 10 for SAT, 0.5 for IELTS)
            if exam == 'SAT':
                pred_score = round(pred_score / 10) * 10
            elif exam == 'IELTS':
                pred_score = round(pred_score * 2) / 2.0
            else:
                pred_score = round(pred_score)
                
            milestones.append({
                "day": day_num,
                "date": (start_date + timedelta(days=day_num)).strftime('%Y-%m-%d'),
                "predicted_score": pred_score
            })
            
            if day_num == days_needed:
                break
                
        # Generate daily section allocations
        daily_plan = []
        for section in config['sections']:
            allocated_mins = int((daily_hours * 60) * section['daily_ratio'])
            daily_plan.append({
                "section": section['name'],
                "minutes": allocated_mins
            })
            
        return {
            "exam_type": exam,
            "status": "calculating",
            "current_score": current_score,
            "target_score": target_score,
            "daily_hours": daily_hours,
            "total_hours_needed": round(actual_hours_needed, 1),
            "days_needed": days_needed,
            "weeks_needed": weeks_needed,
            "estimated_end_date": estimated_end_date.strftime('%Y-%m-%d'),
            "milestones": milestones,
            "daily_allocation": daily_plan
        }

    @classmethod
    def generate_prompt_injection(cls, prediction_data: Dict[str, Any]) -> str:
        """
        Formats the predictive data into a strict constraint string for the LLM.
        """
        if prediction_data.get('status') == 'completed':
            return "[PREDICTION MODEL]: Student has already reached their target score. Generate a maintenance and final review plan."
            
        days = prediction_data['days_needed']
        weeks = prediction_data['weeks_needed']
        end_date = prediction_data['estimated_end_date']
        
        alloc_str = ", ".join([f"{s['minutes']} min for {s['section']}" for s in prediction_data['daily_allocation']])
        
        prompt = (
            f"\n\n[CRITICAL AI PREDICTION ENGINE]:\n"
            f"You MUST align your roadmap exactly with the following mathematically calculated milestones.\n"
            f"- Exam: {prediction_data['exam_type']}\n"
            f"- Target Date to reach {prediction_data['target_score']}: {end_date} ({days} days / {weeks} weeks)\n"
            f"- Daily Total Study Time: {prediction_data['daily_hours'] * 60} minutes\n"
            f"- Daily Section Allocation (STRICT): {alloc_str}\n"
            f"\n*** EXTREME WARNING ***\n"
            f"1. The sum of 'estimated_minutes' for all nodes on ANY given day MUST EXACTLY EQUAL {prediction_data['daily_hours'] * 60} minutes!\n"
            f"2. You MUST design the curriculum to logically take the student from {prediction_data['current_score']} to {prediction_data['target_score']} using highly effective pedagogical steps.\n"
            f"3. If the user provided a deadline shorter than {days} days, YOU MUST WARN THEM that their timeline is mathematically highly improbable due to human learning limits and diminishing returns. Do NOT pretend they will reach the score in an impossible timeframe. Generate a 'Crash Course' instead of a full guarantee.\n"
        )
        return prompt
