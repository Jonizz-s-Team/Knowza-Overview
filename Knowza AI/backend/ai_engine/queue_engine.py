from django.utils import timezone
from ..models import AIQueueItem, SkillGap, LearningPath, LearningNode, AIProfile
from datetime import date
from .streak_engine import update_streak, award_xp, MISSION_XP
import logging

logger = logging.getLogger(__name__)


def get_daily_missions(profile_id):
    """
    Generates 4 types of daily missions for the student based on their
    current learning state, SRS review needs, and weak skill areas.

    Mission Types:
    1. LESSON — Next node from the Roadmap learning path
    2. SRS_REVIEW — Flashcard cards due for spaced repetition review
    3. MICRO_QUIZ — Targeted quiz on weakest skill gap
    4. SKILL_PRACTICE — Reading/Listening practice at current CEFR level
    """
    profile = AIProfile.objects.get(id=profile_id)
    today = date.today()

    # Return existing missions if already generated today
    items = AIQueueItem.objects.filter(profile=profile, date=today)
    if items.exists():
        return items

    missions = []

    # ── MISSION 1: NEXT LESSON FROM ROADMAP ──
    lesson_mission = _create_lesson_mission(profile, today)
    if lesson_mission:
        missions.append(lesson_mission)

    # ── MISSION 2: SRS FLASHCARD REVIEW ──
    srs_mission = _create_srs_review_mission(profile, today)
    if srs_mission:
        missions.append(srs_mission)

    # ── MISSION 3: WEAKNESS MICRO-QUIZ ──
    quiz_mission = _create_micro_quiz_mission(profile, today)
    if quiz_mission:
        missions.append(quiz_mission)

    # ── MISSION 4: SKILL PRACTICE (Reading/Listening) ──
    practice_mission = _create_skill_practice_mission(profile, today)
    if practice_mission:
        missions.append(practice_mission)

    # Fallback: if no missions could be created, add a generic review
    if not missions:
        missions.append(
            AIQueueItem(
                profile=profile,
                title=f"Kunlik Takrorlash: {profile.subject_focus}",
                description="Bugungi kun uchun umumiy bilimlarni takrorlash mashqi.",
                item_type='review',
                priority='medium',
                subject=profile.subject_focus,
                topic="General knowledge review",
                date=today,
                xp_reward=MISSION_XP.get('lesson', 50),
            )
        )

    AIQueueItem.objects.bulk_create(missions)
    return AIQueueItem.objects.filter(profile=profile, date=today)


def complete_mission(item_id):
    """
    Complete a mission, award XP, update streak, and check for CEFR level-up.
    """
    item = AIQueueItem.objects.get(id=item_id)
    if not item.is_completed:
        item.is_completed = True
        item.completed_at = timezone.now()
        item.save()

        # Handle roadmap node completion
        if item.node:
            item.node.status = 'completed'
            item.node.completed_at = timezone.now()
            item.node.save()

            path = item.node.path
            path.completed_nodes += 1
            path.save()

            next_node = path.nodes.filter(order=item.node.order + 1).first()
            if next_node and next_node.status == 'locked':
                next_node.status = 'available'
                next_node.save()

        # Update streak
        update_streak(item.profile)

        # Award XP based on mission type
        xp_map = {
            'lesson': MISSION_XP.get('lesson', 50),
            'srs_review': MISSION_XP.get('srs_review', 20),
            'micro_quiz': MISSION_XP.get('micro_quiz', 30),
            'skill_practice': MISSION_XP.get('skill_practice', 25),
            'review': MISSION_XP.get('lesson', 50),
        }
        xp_amount = xp_map.get(item.item_type, 25)
        xp_result = award_xp(item.profile, xp_amount, reason=f"Mission complete: {item.title}")

        # Check if all daily missions are complete → bonus XP
        today_items = AIQueueItem.objects.filter(profile=item.profile, date=date.today())
        all_complete = all(i.is_completed for i in today_items)
        if all_complete and today_items.count() >= 3:
            bonus = MISSION_XP.get('daily_all_complete_bonus', 50)
            award_xp(item.profile, bonus, reason="Kunlik barcha vazifalar bajarildi! 🎉")
            logger.info("Daily all-complete bonus awarded to profile %s", item.profile.id)

        # Check CEFR level progression
        try:
            from .memory_engine import AIMemoryEngine
            cefr_result = AIMemoryEngine.check_cefr_level_up(item.profile.user)
            if cefr_result.get('can_advance'):
                logger.info(
                    "CEFR Level Up triggered for user %s: %s",
                    item.profile.user.username, cefr_result
                )
        except Exception as e:
            logger.warning("CEFR level-up check failed: %s", e)

    return item


# ──────────────────────────────────────────────
# MISSION GENERATORS (Private)
# ──────────────────────────────────────────────

def _create_lesson_mission(profile, today):
    """Create a mission for the next available lesson on the learning roadmap."""
    try:
        paths = LearningPath.objects.filter(profile=profile)
        for path in paths:
            next_node = path.nodes.filter(
                status__in=['available', 'in_progress']
            ).order_by('order').first()

            if next_node:
                return AIQueueItem(
                    profile=profile,
                    title=f"📚 Yangi Dars: {next_node.title}",
                    description=next_node.description[:300] if next_node.description else "Keyingi darsni boshlang!",
                    item_type='lesson',
                    priority='high',
                    subject=path.subject or profile.subject_focus,
                    topic=next_node.title,
                    date=today,
                    node=next_node,
                    xp_reward=MISSION_XP.get('lesson', 50),
                )
    except Exception as e:
        logger.warning("Failed to create lesson mission: %s", e)
    return None


def _create_srs_review_mission(profile, today):
    """Create a mission for reviewing due SRS flashcards."""
    try:
        from .srs_engine import get_due_cards
        due_cards = get_due_cards(profile.user, limit=50)
        due_count = due_cards.count() if hasattr(due_cards, 'count') else len(due_cards)

        if due_count > 0:
            review_count = min(due_count, 20)
            return AIQueueItem(
                profile=profile,
                title=f"🧠 Flashcard Takrorlash: {review_count} ta karta",
                description=f"Bugun {due_count} ta karta takrorlashga tayyor. Eng muhim {review_count} tasini takrorlang!",
                item_type='srs_review',
                priority='high' if due_count >= 10 else 'medium',
                subject=profile.subject_focus,
                topic="Spaced Repetition Review",
                date=today,
                xp_reward=MISSION_XP.get('srs_review', 20),
            )
    except Exception as e:
        logger.warning("Failed to create SRS review mission: %s", e)
    return None


def _create_micro_quiz_mission(profile, today):
    """Create a targeted micro-quiz on the student's weakest skill gap."""
    try:
        weakest_gap = SkillGap.objects.filter(
            user=profile.user, status='weak'
        ).order_by('mastery_percent').first()

        if weakest_gap:
            return AIQueueItem(
                profile=profile,
                title=f"🎯 Mikro-Quiz: {weakest_gap.skill_name}",
                description=(
                    f"Sizning eng zaif ko'nikmangiz: {weakest_gap.skill_name} "
                    f"({weakest_gap.mastery_percent}%). "
                    f"5 ta tezkor savol bilan mustahkamlang!"
                ),
                item_type='micro_quiz',
                priority='medium',
                subject=profile.subject_focus,
                topic=weakest_gap.skill_name,
                date=today,
                xp_reward=MISSION_XP.get('micro_quiz', 30),
            )
    except Exception as e:
        logger.warning("Failed to create micro quiz mission: %s", e)
    return None


def _create_skill_practice_mission(profile, today):
    """Create a CEFR-appropriate skill practice mission (Reading or Listening)."""
    try:
        cefr = getattr(profile, 'current_cefr', 'A1') or 'A1'
        cefr_upper = cefr.upper()

        # Alternate between reading and listening based on day
        day_of_week = today.weekday()
        is_reading_day = day_of_week % 2 == 0  # Mon, Wed, Fri = Reading; Tue, Thu, Sat = Listening

        if is_reading_day:
            skill_type = "Reading"
            practice_map = {
                'A0': "Oddiy gaplarni o'qib tushunish (3-5 so'zli gaplar)",
                'A1': "Qisqa matnlarni o'qish va asosiy ma'noni topish (50-80 so'z)",
                'A2': "O'rta uzunlikdagi matnlardan ma'lumot ajratish (80-120 so'z)",
                'B1': "Maqolalardan asosiy fikrni va detaillarni topish (150-200 so'z)",
                'B2': "Akademik matnlarni tahlil qilish va xulosalar chiqarish (250+ so'z)",
            }
        else:
            skill_type = "Listening"
            practice_map = {
                'A0': "Oddiy so'z va iboralarni eshitib tanish (salom, raqamlar, ranglar)",
                'A1': "Kundalik suhbatlardan asosiy ma'lumotni eshitib tushunish",
                'A2': "Aniq detallarni eshitib yozib olish (raqamlar, sanalar, ismlar)",
                'B1': "Tezroq suhbatlarni eshitish va connected speech (gonna, wanna) ni tanish",
                'B2': "Akademik ma'ruzalarni eshitib, muhim nuqtalarni qayd qilish",
            }

        description = practice_map.get(cefr_upper, practice_map.get('A1', ''))

        return AIQueueItem(
            profile=profile,
            title=f"🎧 {skill_type} Mashq ({cefr_upper} daraja)",
            description=f"Bugungi {skill_type.lower()} mashqi: {description}",
            item_type='skill_practice',
            priority='low',
            subject=profile.subject_focus,
            topic=f"{skill_type} Practice - {cefr_upper}",
            date=today,
            xp_reward=MISSION_XP.get('skill_practice', 25),
        )
    except Exception as e:
        logger.warning("Failed to create skill practice mission: %s", e)
    return None
