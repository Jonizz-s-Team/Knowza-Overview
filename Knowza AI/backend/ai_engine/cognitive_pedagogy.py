"""
Cognitive Pedagogy Engine for Knowza AI.

Modules:
1. SpacedRepetitionScheduler — Ebbinghaus Forgetting Curve & SM-2 Spaced Repetition.
2. CognitiveLoadAnalyzer — Detects student frustration/overload & adapts coaching scaffolding.
3. BloomsTaxonomyTracker — Tracks cognitive depth across Bloom's 6 levels (Remember → Create).
"""

import math
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class SpacedRepetitionScheduler:
    """
    Implements Ebbinghaus Forgetting Curve & SM-2 Spaced Repetition.
    Predicts optimal review interval for concept retention.
    """

    @staticmethod
    def calculate_next_review(failure_count: int, success_count: int, last_ease_factor: float = 2.5):
        """
        Calculates interval in days and updated Ease Factor (EF).
        SM-2 Algorithm implementation.
        """
        quality = 5 if success_count > failure_count else max(0, 3 - failure_count)
        
        # Calculate new Ease Factor
        ef = last_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        ef = max(1.3, ef)

        if quality < 3:
            interval = 1
        elif success_count == 1:
            interval = 1
        elif success_count == 2:
            interval = 6
        else:
            interval = int(6 * (ef ** (success_count - 1)))

        return interval, round(ef, 2)

    @staticmethod
    def get_forgetting_probability(days_since_last_review: float, memory_retention_factor: float = 1.5) -> float:
        """
        Ebbinghaus Forgetting Curve: R = e^(-t / S)
        Returns probability of forgetting (0.0 to 1.0).
        """
        retention = math.exp(-days_since_last_review / max(0.5, memory_retention_factor))
        return round(1.0 - retention, 2)


class CognitiveLoadAnalyzer:
    """
    Analyzes student message patterns for cognitive overload, frustration, or fatigue.
    Triggers adaptive scaffolding when overload is detected.
    """

    FRUSTRATION_KEYWORDS = [
        "tushunmadim", "tushunmayapman", "qiyin", "juda qiyin", "bilmayman",
        "don't understand", "too hard", "confused", "stuck", "what?", "почему", "сложно", "не понимаю"
    ]

    @staticmethod
    def analyze_cognitive_state(user_message: str, attempt_count: int, history_messages: list):
        """
        Returns cognitive state dict:
        - overload_detected: bool
        - scaffolding_instruction: str
        - sentiment: 'neutral' | 'frustrated' | 'confident'
        """
        msg_lower = user_message.lower().strip()
        
        is_short = len(msg_lower.split()) <= 4
        contains_frustration = any(kw in msg_lower for kw in CognitiveLoadAnalyzer.FRUSTRATION_KEYWORDS)
        high_attempts = attempt_count >= 3

        overload = (contains_frustration and is_short) or (high_attempts and is_short)

        if overload:
            scaffolding = (
                "\n[⚠️ ADAPTIVE SCAFFOLDING TRIGGERED - COGNITIVE OVERLOAD DETECTED]: "
                "The student is feeling confused or stuck. "
                "1. Break the problem into 1 super simple micro-step. "
                "2. Use a vivid real-world analogy. "
                "3. Keep tone extremely warm, supportive, and encouraging. Do NOT overload with text!"
            )
            sentiment = 'frustrated'
        elif any(w in msg_lower for w in ["tushundim", "got it", "easy", "oson", "понял"]):
            scaffolding = ""
            sentiment = 'confident'
        else:
            scaffolding = ""
            sentiment = 'neutral'

        return {
            'overload_detected': overload,
            'scaffolding_instruction': scaffolding,
            'sentiment': sentiment,
        }


class BloomsTaxonomyTracker:
    """
    Tracks and advances cognitive depth across Bloom's Taxonomy:
    1. Remember → 2. Understand → 3. Apply → 4. Analyze → 5. Evaluate → 6. Create
    """

    LEVELS = {
        1: "Remember (Recall basic facts)",
        2: "Understand (Explain ideas/concepts)",
        3: "Apply (Use information in new situations)",
        4: "Analyze (Draw connections among ideas)",
        5: "Evaluate (Justify a stand or decision)",
        6: "Create (Produce new or original work)",
    }

    @staticmethod
    def get_blooms_instruction(mastery_percent: int) -> str:
        """Determines target Bloom's cognitive level based on mastery percentage."""
        if mastery_percent < 30:
            level_num = 1
            guidance = "Focus on basic definitions, key terms, and core rules."
        elif mastery_percent < 50:
            level_num = 2
            guidance = "Ask student to explain the core concept in their own words."
        elif mastery_percent < 70:
            level_num = 3
            guidance = "Present a standard application problem to solve."
        elif mastery_percent < 85:
            level_num = 4
            guidance = "Ask student to compare two different solving methods or analyze edge cases."
        elif mastery_percent < 95:
            level_num = 5
            guidance = "Present a flawed solution and ask student to spot and fix the mistake."
        else:
            level_num = 6
            guidance = "Ask student to synthesize learning, design a problem, or create a brand new solution."
        return f"[BLOOM'S TAXONOMY LEVEL {level_num} - {BloomsTaxonomyTracker.LEVELS[level_num]}]: {guidance}"


class MasteryGatekeeper:
    """
    Heart of Knowza AI: 90% Mastery Threshold Gatekeeper.
    Students CANNOT unlock the next lesson until 90% mastery is achieved.
    """

    MASTERY_THRESHOLD = 90.0

    @staticmethod
    def evaluate_node_mastery(node, score_percent: float) -> dict:
        """
        Evaluates node quiz score.
        If score >= 90%, unlocks next node.
        If score < 90%, node remains locked and triggers remedial Socratic coaching.
        """
        score_percent = float(score_percent)
        node.mastery_score = max(node.mastery_score, score_percent)

        if score_percent >= MasteryGatekeeper.MASTERY_THRESHOLD:
            node.is_mastered = True
            node.status = 'completed'
            node.completed_at = timezone.now()
            node.save(update_fields=['is_mastered', 'status', 'mastery_score', 'completed_at'])

            # Unlock next prerequisite node in the learning path
            from ..models import LearningNode
            next_node = LearningNode.objects.filter(
                path=node.path,
                order__gt=node.order,
                status='locked'
            ).order_by('order').first()

            if next_node:
                next_node.status = 'available'
                next_node.save(update_fields=['status'])

            return {
                "is_mastered": True,
                "score_percent": score_percent,
                "threshold": MasteryGatekeeper.MASTERY_THRESHOLD,
                "unlocked_next": next_node.title if next_node else None,
                "message": "Mastery Achieved! 🏆 Next micro-skill unlocked.",
            }
        else:
            node.is_mastered = False
            node.status = 'in_progress'
            node.save(update_fields=['is_mastered', 'status', 'mastery_score'])

            return {
                "is_mastered": False,
                "score_percent": score_percent,
                "threshold": MasteryGatekeeper.MASTERY_THRESHOLD,
                "unlocked_next": None,
                "message": f"Not mastered yet ({score_percent}% / 90% required). AI will explain differently with visual analogies and code-switching.",
                "remedial_instruction": (
                    "[REMEDIAL INSTRUCTION - 90% MASTERY NOT ACHIEVED]: "
                    "The student scored below 90%. Do NOT allow advancing yet. "
                    "1. Explain the misconception with a clear visual analogy. "
                    "2. Use Uzbek-English code-switching if useful. "
                    "3. Provide 3 targeted new practice questions."
                ),
            }


class CEFRAdaptiveScaffolder:
    """
    Adapts AI teaching style to the student's exact CEFR level (A0 → B2).
    Injects level-appropriate scaffolding instructions into the system prompt
    before every LLM call, ensuring the AI never teaches above or below the
    student's current ability.
    """

    CEFR_PROFILES = {
        'A0': {
            'max_sentence_length': 5,
            'code_switch_ratio': 0.9,
            'example_complexity': 'single_word_or_phrase',
            'grammar_focus': ['to_be', 'basic_nouns', 'articles'],
            'vocab_target': 50,
            'instruction': (
                "[CEFR A0 — ABSOLUTE BEGINNER]: "
                "Student knows ZERO English. Use max 5 English words per sentence. "
                "Explain 90% in Uzbek. Introduce ONE concept at a time. "
                "Use emoji visual analogies (🍎 = apple). "
                "NEVER use grammar terms like 'noun', 'verb', or 'article'. "
                "Just model correct patterns visually."
            ),
        },
        'A1': {
            'max_sentence_length': 8,
            'code_switch_ratio': 0.7,
            'example_complexity': 'simple_sentence',
            'grammar_focus': ['present_simple', 'present_continuous', 'pronouns', 'plurals'],
            'vocab_target': 300,
            'instruction': (
                "[CEFR A1 — BEGINNER]: "
                "Student knows basic words and phrases. Use max 8 English words per sentence. "
                "Explain 70% in Uzbek, 30% in English. Introduce 2 new grammar patterns max per session. "
                "Use recast corrections (repeat student's sentence correctly). "
                "Gently introduce grammar terms: 'Bu — verb (fe'l) deyiladi.'"
            ),
        },
        'A2': {
            'max_sentence_length': 15,
            'code_switch_ratio': 0.5,
            'example_complexity': 'short_dialogue',
            'grammar_focus': ['past_simple', 'irregular_verbs', 'prepositions', 'modals', 'comparatives'],
            'vocab_target': 800,
            'instruction': (
                "[CEFR A2 — ELEMENTARY]: "
                "Student has basic understanding. Use 50/50 English-Uzbek ratio. "
                "Teach explicit grammar rules with formulas: 'Past Simple = Subject + V2'. "
                "Use elicitation corrections: ask student to spot own errors. "
                "Introduce short dialogues (4-6 exchanges) and 60-100 word reading passages."
            ),
        },
        'B1': {
            'max_sentence_length': 25,
            'code_switch_ratio': 0.2,
            'example_complexity': 'paragraph',
            'grammar_focus': ['present_perfect', 'past_perfect', 'conditionals_1_2',
                              'relative_clauses', 'passive_voice', 'reported_speech'],
            'vocab_target': 2000,
            'instruction': (
                "[CEFR B1 — INTERMEDIATE]: "
                "Student can communicate independently. Use 80% English, 20% Uzbek only for "
                "complex abstract grammar concepts. Teach complex tenses, conditionals, relative clauses. "
                "Use metalinguistic feedback: guide student to analyze own errors. "
                "Introduce connected speech patterns (gonna, wanna). "
                "Assign 80-120 word paragraph writing tasks."
            ),
        },
        'B2': {
            'max_sentence_length': 40,
            'code_switch_ratio': 0.05,
            'example_complexity': 'academic_text',
            'grammar_focus': ['mixed_conditionals', 'subjunctive', 'inversion',
                              'cleft_sentences', 'advanced_passive', 'discourse_markers'],
            'vocab_target': 4000,
            'instruction': (
                "[CEFR B2 — UPPER-INTERMEDIATE]: "
                "Student has strong command. Use 95% English. "
                "Focus on academic discourse, nuanced grammar (mixed conditionals, inversion), "
                "idiomatic expressions, collocations, and register awareness. "
                "Use self-correction prompts: ask student to identify own improvements. "
                "Assign 300+ word reading with inference and critical analysis questions."
            ),
        },
    }

    CEFR_ORDER = ['A0', 'A1', 'A2', 'B1', 'B2']

    @staticmethod
    def get_scaffolding(cefr_level: str, topic: str = '') -> str:
        """Returns level-appropriate teaching instruction for the LLM."""
        level = cefr_level.upper() if cefr_level else 'A1'
        profile = CEFRAdaptiveScaffolder.CEFR_PROFILES.get(level)
        if not profile:
            profile = CEFRAdaptiveScaffolder.CEFR_PROFILES['A1']

        instruction = profile['instruction']
        if topic:
            instruction += f" Current topic focus: {topic}."
        return instruction

    @staticmethod
    def should_code_switch(cefr_level: str, student_sentiment: str) -> bool:
        """Determines if AI should switch to Uzbek explanation based on level and frustration."""
        level = cefr_level.upper() if cefr_level else 'A1'
        profile = CEFRAdaptiveScaffolder.CEFR_PROFILES.get(level)
        if not profile:
            return True
        # Always code-switch for frustrated students at any level
        if student_sentiment == 'frustrated':
            return True
        # For A0-A2, always allow code-switching
        return profile['code_switch_ratio'] >= 0.5

    @staticmethod
    def get_progression_requirements(current_level: str) -> dict:
        """Returns mastery thresholds needed to advance to the next CEFR level."""
        thresholds = {
            'A0': {
                'next_level': 'A1',
                'grammar_mastery': 85,
                'vocab_mastery': 80,
                'reading_mastery': 75,
                'listening_mastery': 70,
                'min_lessons_completed': 10,
                'min_streak_days': 5,
            },
            'A1': {
                'next_level': 'A2',
                'grammar_mastery': 85,
                'vocab_mastery': 80,
                'reading_mastery': 80,
                'listening_mastery': 75,
                'min_lessons_completed': 20,
                'min_streak_days': 10,
            },
            'A2': {
                'next_level': 'B1',
                'grammar_mastery': 90,
                'vocab_mastery': 85,
                'reading_mastery': 85,
                'listening_mastery': 80,
                'min_lessons_completed': 35,
                'min_streak_days': 20,
            },
            'B1': {
                'next_level': 'B2',
                'grammar_mastery': 90,
                'vocab_mastery': 90,
                'reading_mastery': 90,
                'listening_mastery': 85,
                'min_lessons_completed': 50,
                'min_streak_days': 30,
            },
            'B2': {
                'next_level': 'B2+',
                'grammar_mastery': 95,
                'vocab_mastery': 95,
                'reading_mastery': 95,
                'listening_mastery': 95,
                'min_lessons_completed': 80,
                'min_streak_days': 45,
            },
        }
        level = current_level.upper() if current_level else 'A0'
        return thresholds.get(level, thresholds['A0'])

    @staticmethod
    def get_level_profile(cefr_level: str) -> dict:
        """Returns full CEFR profile configuration for a given level."""
        level = cefr_level.upper() if cefr_level else 'A1'
        return CEFRAdaptiveScaffolder.CEFR_PROFILES.get(level, CEFRAdaptiveScaffolder.CEFR_PROFILES['A1'])
