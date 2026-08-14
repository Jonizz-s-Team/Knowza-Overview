"""
AIMemoryEngine — Cognitive Long-Term Memory Architecture (OpenAI MemGPT / Anthropic style).

Features:
1. Multi-tier memory nodes (Facts, Concept Mastery, Error Patterns/Misconceptions, Coaching Tactics).
2. Gradual Misconception Decay & Mastery Upgrade:
   - As student solves questions correctly, error severity decays (-1 per success).
   - Once mastery reaches >= 80%, error history is marked RESOLVED and forgotten by AI prompts.
   - Preserves clean mastery score (e.g., 'Trigonometry: 95% Mastered').
3. Top-K Cognitive Relevance Ranking (Severity x Recency x Mastery Gap weighting).
4. Predictive Exam Readiness & Learning Velocity Analytics.
5. Compiled Cognitive Knowledge Graph with sub-1ms Redis caching.
"""

import json
import logging
from django.utils import timezone
from django.core.cache import cache

from ..models import AIMemoryNode, AIProfile, SkillGap

logger = logging.getLogger(__name__)

CACHE_TTL = 3600  # 1 hour Redis cache TTL


class AIMemoryEngine:
    """Professional Cognitive Long-Term Memory Manager with Memory Decay."""

    @staticmethod
    def record_test_performance(user, subject, topic, wrong_answers, strong_topics, score_percent):
        """
        Processes test results to reinforce mastery or decay/resolve misconceptions.
        Runs automatically after every completed test.
        """
        if not user or not user.is_authenticated:
            return

        # 1. Process Wrong Answers → Record or Reinforce Misconceptions & Decay Mastery
        for item in wrong_answers:
            t = item.get('topic') or topic or 'General'
            q_text = item.get('question', '')[:100]
            exp = item.get('explanation', '')[:150]
            key = t[:255].lower().replace(' ', '_')

            node, created = AIMemoryNode.objects.get_or_create(
                user=user,
                memory_type='misconception',
                key=key,
                defaults={
                    'subject': subject[:100],
                    'topic': t[:255],
                    'value': f"Mavzu: {t}. Noto'g'ri mezon: {q_text}. Tushuntirish: {exp}",
                    'severity_score': 2,
                    'failure_count': 1,
                    'is_resolved': False,
                }
            )
            if not created:
                node.failure_count += 1
                node.severity_score += 1
                node.is_resolved = False
                node.value = f"Mavzu: {t}. Takroriy xato ({node.failure_count} marta). Oxirgi savol: {q_text}"
                node.save(update_fields=['failure_count', 'severity_score', 'is_resolved', 'value', 'last_reinforced_at'])

            # Update Mastery Node (Decay by -15%)
            m_node, _ = AIMemoryNode.objects.get_or_create(
                user=user,
                memory_type='mastery',
                key=key,
                defaults={'subject': subject[:100], 'topic': t[:255], 'mastery_percent': 40}
            )
            m_node.failure_count += 1
            m_node.mastery_percent = max(0, m_node.mastery_percent - 15)
            m_node.save(update_fields=['failure_count', 'mastery_percent', 'last_reinforced_at'])

        # 2. Process Strong Topics → Gradual Misconception Decay & Mastery Upgrade
        for st in strong_topics:
            key = st[:255].lower().replace(' ', '_')
            
            # Upgrade Mastery (+20% per success)
            m_node, _ = AIMemoryNode.objects.get_or_create(
                user=user,
                memory_type='mastery',
                key=key,
                defaults={'subject': subject[:100], 'topic': st[:255], 'mastery_percent': 60}
            )
            m_node.success_count += 1
            m_node.mastery_percent = min(100, m_node.mastery_percent + 20)
            m_node.save(update_fields=['success_count', 'mastery_percent', 'last_reinforced_at'])

            # Gradual Misconception Decay: Reduce severity score
            try:
                disc_node = AIMemoryNode.objects.get(user=user, memory_type='misconception', key=key, is_resolved=False)
                disc_node.success_count += 1
                disc_node.severity_score = max(0, disc_node.severity_score - 1)
                
                # Gradual Forgetting Condition:
                # If severity drops to 0 OR mastery reaches >= 80% OR success_count >= 2:
                # AI forgets error details and marks topic as MASTERED!
                if disc_node.severity_score == 0 or m_node.mastery_percent >= 80 or disc_node.success_count >= 2:
                    disc_node.is_resolved = True
                    disc_node.value = f"Mavzu to'liq o'zlashtirildi ({m_node.mastery_percent}% Mastery). Xato bartaraf etildi."
                    disc_node.save(update_fields=['is_resolved', 'severity_score', 'success_count', 'value', 'last_reinforced_at'])
                else:
                    disc_node.save(update_fields=['severity_score', 'success_count', 'last_reinforced_at'])
            except AIMemoryNode.DoesNotExist:
                pass

            # Sync SkillGap model
            try:
                sg = SkillGap.objects.get(user=user, skill_name=st[:250])
                if m_node.mastery_percent >= 75:
                    sg.status = 'ok'
                    sg.save(update_fields=['status'])
            except SkillGap.DoesNotExist:
                pass

        # 3. Invalidate Redis Cache
        cache_key = f"cognitive_memory_v2_{user.id}"
        cache.delete(cache_key)

        logger.info(f"AIMemoryEngine: Updated mastery and applied memory decay for user {user.username}")

    @staticmethod
    def compile_cognitive_knowledge_graph(user) -> str:
        """
        Compiles structured memory nodes into an OpenAI/MemGPT-style Knowledge Graph text.
        Active misconceptions only show unresolved errors.
        Mastered topics cleanly display percentages (e.g., 'Trigonometry: 95% Mastered').
        Cached in Redis for sub-1ms lookup speed.
        """
        if not user or not user.is_authenticated:
            return ""

        cache_key = f"cognitive_memory_v2_{user.id}"
        cached_graph = cache.get(cache_key)
        if cached_graph:
            return cached_graph

        # Fetch active memory nodes
        nodes = list(AIMemoryNode.objects.filter(user=user).order_by('-last_reinforced_at'))

        facts = [n for n in nodes if n.memory_type == 'fact']
        misconceptions = [n for n in nodes if n.memory_type == 'misconception' and not n.is_resolved]
        mastery = [n for n in nodes if n.memory_type == 'mastery']
        tactics = [n for n in nodes if n.memory_type == 'tactic']

        # Top-K Cognitive Relevance Ranking for Misconceptions
        misconceptions.sort(
            key=lambda m: (m.severity_score * 0.5) + (m.failure_count * 0.3) + ((100 - m.mastery_percent) / 100.0 * 0.2),
            reverse=True
        )

        profile = getattr(user, 'ai_profile', None)

        graph_parts = ["# 🧠 COGNITIVE KNOWLEDGE GRAPH (Knowza AI Memory Core)\n"]

        # Section 1: User Profile & Goals
        profile_lines = []
        if profile:
            if profile.global_goal:
                profile_lines.append(f"Target Exam/Goal: {profile.global_goal}")
            if profile.target_score:
                profile_lines.append(f"Target Score: {profile.target_score}")
            if profile.target_deadline:
                profile_lines.append(f"Deadline: {profile.target_deadline}")
            if profile.subject_focus:
                profile_lines.append(f"Focus Subject: {profile.subject_focus}")

        for f in facts[:5]:
            profile_lines.append(f"{f.key}: {f.value}")

        if profile_lines:
            graph_parts.append("## 👤 STUDENT FACTS & GOALS:\n- " + "\n- ".join(profile_lines))

        # Section 2: Active Misconceptions (ONLY UNRESOLVED ACTIVE ERRORS)
        if misconceptions:
            misc_lines = []
            for m in misconceptions[:5]:
                misc_lines.append(
                    f"[{m.topic.upper()} | Severity {m.severity_score}]: {m.value[:180]} (Errors: {m.failure_count})"
                )
            graph_parts.append("\n## 📉 ACTIVE MISCONCEPTIONS (Focus hints on these!):\n- " + "\n- ".join(misc_lines))

        # Section 3: Concept Mastery Matrix (Clean Percentage Breakdown)
        if mastery:
            mast_lines = []
            for m in mastery[:8]:
                if m.mastery_percent >= 90:
                    status_str = f"🌟 {m.topic}: {m.mastery_percent}% Mastered (To'liq o'zlashtirildi)"
                elif m.mastery_percent >= 75:
                    status_str = f"🟢 {m.topic}: {m.mastery_percent}% Mastered (Yaxshi)"
                elif m.mastery_percent >= 45:
                    status_str = f"🟡 {m.topic}: {m.mastery_percent}% Mastered (O'rganilmoqda)"
                else:
                    status_str = f"🔴 {m.topic}: {m.mastery_percent}% Mastered (Zaif - Diqqat talab)"

                mast_lines.append(status_str)
            graph_parts.append("\n## 📊 CONCEPT MASTERY MATRIX:\n- " + "\n- ".join(mast_lines))

        # Section 4: Optimal Coaching Tactics
        if tactics:
            tac_lines = [f"{t.key}: {t.value}" for t in tactics[:3]]
            graph_parts.append("\n## 💡 RECOMMENDED COACHING STRATEGY:\n- " + "\n- ".join(tac_lines))

        compiled_graph = "\n".join(graph_parts)

        # Store in Redis Cache
        cache.set(cache_key, compiled_graph, timeout=CACHE_TTL)
        return compiled_graph

    @staticmethod
    def get_exam_readiness_analytics(user):
        """
        Calculates predictive Exam Readiness Index (0-100%) and Learning Velocity metrics.
        """
        if not user or not user.is_authenticated:
            return {'exam_readiness_index': 0, 'learning_velocity': 'N/A', 'mastered_topics': 0, 'active_gaps': 0}

        mastery_nodes = list(AIMemoryNode.objects.filter(user=user, memory_type='mastery'))
        resolved_count = AIMemoryNode.objects.filter(user=user, memory_type='misconception', is_resolved=True).count()
        active_gaps = AIMemoryNode.objects.filter(user=user, memory_type='misconception', is_resolved=False).count()

        if not mastery_nodes:
            avg_mastery = 50
            mastered_topics = 0
        else:
            avg_mastery = sum(m.mastery_percent for m in mastery_nodes) // len(mastery_nodes)
            mastered_topics = sum(1 for m in mastery_nodes if m.mastery_percent >= 75)

        total_gaps = resolved_count + active_gaps
        resolution_rate = (resolved_count / total_gaps * 100) if total_gaps > 0 else 50
        
        readiness_index = int((avg_mastery * 0.6) + ((mastered_topics / max(1, len(mastery_nodes))) * 25) + (resolution_rate * 0.15))
        readiness_index = max(0, min(100, readiness_index))

        velocity = "Yuqori ⚡" if resolution_rate >= 60 else ("O'rtacha 📈" if resolution_rate >= 30 else "Past 🐢")

        return {
            'exam_readiness_index': readiness_index,
            'learning_velocity': velocity,
            'avg_mastery_percent': avg_mastery,
            'mastered_topics_count': mastered_topics,
            'resolved_misconceptions_count': resolved_count,
            'active_misconceptions_count': active_gaps,
        }

    @staticmethod
    def check_cefr_level_up(user) -> dict:
        """
        Checks if the student has met all thresholds to advance to the next CEFR level.
        Automatically upgrades AIProfile.current_cefr if all requirements are met.

        Returns:
        - can_advance: bool
        - current_level: str (e.g. 'A1')
        - next_level: str (e.g. 'A2')
        - progress: dict with per-skill percentages
        - blockers: list of specific skills blocking advancement
        """
        if not user or not user.is_authenticated:
            return {'can_advance': False, 'current_level': 'A0', 'blockers': ['not_authenticated']}

        from .cognitive_pedagogy import CEFRAdaptiveScaffolder

        try:
            profile = AIProfile.objects.get(user=user)
        except AIProfile.DoesNotExist:
            return {'can_advance': False, 'current_level': 'A0', 'blockers': ['no_profile']}

        current_cefr = getattr(profile, 'current_cefr', 'A0') or 'A0'
        requirements = CEFRAdaptiveScaffolder.get_progression_requirements(current_cefr)

        # Gather mastery data per skill category
        mastery_nodes = list(AIMemoryNode.objects.filter(user=user, memory_type='mastery'))

        skill_mastery = {'grammar': [], 'vocabulary': [], 'reading': [], 'listening': []}
        for node in mastery_nodes:
            topic_lower = (node.topic or '').lower()
            key_lower = (node.key or '').lower()
            combined = f"{topic_lower} {key_lower}"

            if any(kw in combined for kw in ['grammar', 'tense', 'verb', 'sentence', 'clause', 'conditional', 'passive', 'article']):
                skill_mastery['grammar'].append(node.mastery_percent)
            elif any(kw in combined for kw in ['vocab', 'word', 'collocation', 'phrasal', 'idiom', 'synonym']):
                skill_mastery['vocabulary'].append(node.mastery_percent)
            elif any(kw in combined for kw in ['reading', 'comprehension', 'text', 'passage', 'skim', 'scan']):
                skill_mastery['reading'].append(node.mastery_percent)
            elif any(kw in combined for kw in ['listening', 'audio', 'speech', 'pronunciation', 'sound']):
                skill_mastery['listening'].append(node.mastery_percent)
            else:
                # Default: count towards grammar (most common)
                skill_mastery['grammar'].append(node.mastery_percent)

        # Calculate average mastery per skill
        avg = {}
        for skill, values in skill_mastery.items():
            avg[skill] = round(sum(values) / max(1, len(values))) if values else 0

        # Count completed lessons
        from ..models import LearningNode
        completed_lessons = LearningNode.objects.filter(
            path__profile=profile, status='completed'
        ).count()

        # Count streak days
        try:
            streak = profile.streak
            streak_days = streak.current_streak
        except Exception:
            streak_days = 0

        # Check blockers
        blockers = []
        requirement_map = {
            'grammar_mastery': ('grammar', requirements.get('grammar_mastery', 85)),
            'vocab_mastery': ('vocabulary', requirements.get('vocab_mastery', 80)),
            'reading_mastery': ('reading', requirements.get('reading_mastery', 80)),
            'listening_mastery': ('listening', requirements.get('listening_mastery', 75)),
        }

        for req_key, (skill_name, threshold) in requirement_map.items():
            if avg.get(skill_name, 0) < threshold:
                blockers.append(f"{skill_name}: {avg.get(skill_name, 0)}% / {threshold}% kerak")

        min_lessons = requirements.get('min_lessons_completed', 10)
        if completed_lessons < min_lessons:
            blockers.append(f"Darslar: {completed_lessons} / {min_lessons} kerak")

        min_streak = requirements.get('min_streak_days', 5)
        if streak_days < min_streak:
            blockers.append(f"Streak: {streak_days} kun / {min_streak} kun kerak")

        can_advance = len(blockers) == 0
        next_level = requirements.get('next_level', current_cefr)

        # Auto-upgrade if all requirements met
        if can_advance and next_level != current_cefr:
            profile.current_cefr = next_level
            profile.save(update_fields=['current_cefr'])
            logger.info("CEFR Level Up! User %s: %s → %s", user.username, current_cefr, next_level)

            # Invalidate memory cache
            cache_key = f"cognitive_memory_v2_{user.id}"
            cache.delete(cache_key)

        return {
            'can_advance': can_advance,
            'current_level': current_cefr if not can_advance else next_level,
            'next_level': next_level,
            'progress': {
                'grammar': avg.get('grammar', 0),
                'vocabulary': avg.get('vocabulary', 0),
                'reading': avg.get('reading', 0),
                'listening': avg.get('listening', 0),
                'lessons_completed': completed_lessons,
                'streak_days': streak_days,
            },
            'blockers': blockers,
        }
