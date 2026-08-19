from django.utils import timezone
from datetime import date, timedelta
from ..models import StreakCounter
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# XP LEVEL SYSTEM
# ──────────────────────────────────────────────
XP_LEVELS = [
    {'level': 1, 'title': 'Yangi Boshlovchi', 'title_en': 'Newcomer', 'xp_required': 0},
    {'level': 2, 'title': 'Izlanuvchi', 'title_en': 'Explorer', 'xp_required': 200},
    {'level': 3, 'title': "O'rganuvchi", 'title_en': 'Learner', 'xp_required': 500},
    {'level': 4, 'title': 'Bilimdon', 'title_en': 'Scholar', 'xp_required': 1200},
    {'level': 5, 'title': 'Ustoz', 'title_en': 'Master', 'xp_required': 2500},
    {'level': 6, 'title': 'Ekspert', 'title_en': 'Expert', 'xp_required': 5000},
    {'level': 7, 'title': 'Grandmaster', 'title_en': 'Grandmaster', 'xp_required': 10000},
]

STREAK_MILESTONES = {
    3: {'badge': '🔥', 'title': '3 Kunlik Seriya', 'bonus_xp': 25},
    7: {'badge': '⭐', 'title': 'Haftalik Yulduz', 'bonus_xp': 75},
    14: {'badge': '💎', 'title': '2 Haftalik Olmos', 'bonus_xp': 150},
    30: {'badge': '🏆', 'title': 'Oylik Chempion', 'bonus_xp': 500},
    60: {'badge': '👑', 'title': 'Qirol', 'bonus_xp': 1000},
    100: {'badge': '🌟', 'title': 'Legenda', 'bonus_xp': 2500},
}

# XP rewards for different mission types
MISSION_XP = {
    'lesson': 50,
    'srs_review': 20,
    'micro_quiz': 30,
    'skill_practice': 25,
    'diagnostic_complete': 40,
    'roadmap_node_complete': 35,
    'daily_all_complete_bonus': 50,
}


def update_streak(profile):
    """Update the student's daily streak counter."""
    today = date.today()
    streak, created = StreakCounter.objects.get_or_create(profile=profile)

    if streak.last_completed_date == today:
        # Already completed a mission today
        return streak

    if streak.last_completed_date == today - timedelta(days=1):
        # Continuous streak
        streak.current_streak += 1
    elif streak.last_completed_date is None or streak.last_completed_date < today - timedelta(days=1):
        # Streak broken, reset
        streak.current_streak = 1

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.last_completed_date = today
    streak.save()

    # Check for milestone bonuses
    milestone_result = check_streak_milestone(streak, profile)
    if milestone_result:
        logger.info("Streak milestone reached: %s for profile %s", milestone_result.get('title'), profile.id)

    return streak


def award_xp(profile, amount: int, reason: str = '') -> dict:
    """
    Award XP to a student profile and check for level-up.
    Returns dict with xp details and level_up info if triggered.
    """
    if amount <= 0:
        return {'xp_awarded': 0, 'level_up': False}

    streak, _ = StreakCounter.objects.get_or_create(profile=profile)

    old_xp = streak.total_xp
    old_level = _get_level_for_xp(old_xp)

    streak.total_xp += amount
    streak.save(update_fields=['total_xp'])

    new_level = _get_level_for_xp(streak.total_xp)

    result = {
        'xp_awarded': amount,
        'reason': reason,
        'total_xp': streak.total_xp,
        'current_level': new_level['level'],
        'current_title': new_level['title'],
        'level_up': False,
    }

    if new_level['level'] > old_level['level']:
        result['level_up'] = True
        result['new_level'] = new_level['level']
        result['new_title'] = new_level['title']
        result['new_title_en'] = new_level['title_en']
        logger.info(
            "Level up! Profile %s: Level %d (%s) → Level %d (%s)",
            profile.id, old_level['level'], old_level['title'],
            new_level['level'], new_level['title']
        )

    return result


def check_streak_milestone(streak, profile) -> dict:
    """
    Check if the current streak has hit a milestone day and award bonus XP.
    Returns milestone info if reached, empty dict otherwise.
    """
    milestone = STREAK_MILESTONES.get(streak.current_streak)
    if not milestone:
        return {}

    # Award bonus XP for reaching the milestone
    award_xp(profile, milestone['bonus_xp'], reason=f"Streak milestone: {milestone['title']}")

    return {
        'badge': milestone['badge'],
        'title': milestone['title'],
        'bonus_xp': milestone['bonus_xp'],
        'streak_days': streak.current_streak,
    }


def get_progress_summary(profile) -> dict:
    """
    Return a full progress summary: level, XP, streak, next milestone, next level.
    Used by the frontend dashboard to display the student's gamification state.
    """
    streak, _ = StreakCounter.objects.get_or_create(profile=profile)

    current_level = _get_level_for_xp(streak.total_xp)
    next_level = _get_next_level(current_level['level'])

    # Calculate XP progress to next level
    if next_level:
        xp_for_next = next_level['xp_required'] - streak.total_xp
        xp_progress_pct = round(
            ((streak.total_xp - current_level['xp_required']) /
             max(1, next_level['xp_required'] - current_level['xp_required'])) * 100
        )
    else:
        xp_for_next = 0
        xp_progress_pct = 100

    # Find next streak milestone
    next_milestone = None
    for day_threshold in sorted(STREAK_MILESTONES.keys()):
        if streak.current_streak < day_threshold:
            next_milestone = {
                'days_needed': day_threshold,
                'days_remaining': day_threshold - streak.current_streak,
                **STREAK_MILESTONES[day_threshold],
            }
            break

    return {
        'total_xp': streak.total_xp,
        'current_level': current_level['level'],
        'current_title': current_level['title'],
        'current_title_en': current_level['title_en'],
        'xp_to_next_level': max(0, xp_for_next),
        'xp_progress_percent': min(100, max(0, xp_progress_pct)),
        'next_level_title': next_level['title'] if next_level else None,
        'current_streak': streak.current_streak,
        'longest_streak': streak.longest_streak,
        'last_completed_date': str(streak.last_completed_date) if streak.last_completed_date else None,
        'next_milestone': next_milestone,
    }


# ──────────────────────────────────────────────
# PRIVATE HELPERS
# ──────────────────────────────────────────────

def _get_level_for_xp(total_xp: int) -> dict:
    """Determine the current level based on total XP."""
    current = XP_LEVELS[0]
    for lvl in XP_LEVELS:
        if total_xp >= lvl['xp_required']:
            current = lvl
        else:
            break
    return current


def _get_next_level(current_level_num: int) -> dict:
    """Get the next level config, or None if at max."""
    for lvl in XP_LEVELS:
        if lvl['level'] > current_level_num:
            return lvl
    return None
