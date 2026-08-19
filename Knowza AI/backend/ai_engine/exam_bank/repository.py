"""Stable, local question-bank access for Knowza AI Exam Prep.

This module deliberately does not call an LLM.  An exam answer must come from
reviewed bank content; AI is used only after grading for an explanation.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from functools import lru_cache
from pathlib import Path
from random import Random
from typing import Any, Iterable, Optional
import json


BANK_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class BankQuestion:
    """One normalized, gradeable question from the local curated bank."""

    id: str
    exam_type: str
    section: str
    domain: str
    skill: str
    difficulty: str
    prompt: str
    options: tuple[str, ...]
    correct_answer: str
    explanation: str
    passage: str = ""
    subject: str = ""
    question_type: str = "multiple_choice"

    def public_dict(self) -> dict[str, Any]:
        """Student-safe question payload: answers stay on the server."""
        data = asdict(self)
        data.pop("correct_answer", None)
        data.pop("explanation", None)
        data["options"] = list(self.options)
        return data


def _clean(value: Any) -> str:
    return str(value or "").strip()


@lru_cache(maxsize=8)
def _load(filename: str) -> list[dict[str, Any]]:
    with (BANK_DIR / filename).open("r", encoding="utf-8") as file:
        data = json.load(file)
    return data if isinstance(data, list) else []


def _normalise_ielts(item: dict[str, Any]) -> Optional[BankQuestion]:
    body = item.get("question") or item.get("content") or {}
    if not isinstance(body, dict):
        return None
    prompt = _clean(body.get("question") or body.get("prompt") or item.get("prompt"))
    if not prompt:
        return None
    raw_opts = body.get("options")
    if isinstance(raw_opts, (list, tuple)) and len(raw_opts) >= 2:
        options = tuple(_clean(option) for option in raw_opts if _clean(option))
        answer = _clean(body.get("correct_answer")) or options[0]
    else:
        return None
    return BankQuestion(
        id=_clean(item.get("id")), exam_type="ielts",
        section=_clean(item.get("section")) or "General",
        domain=_clean(body.get("topic_tag")) or _clean(item.get("question_type")) or "General",
        skill=_clean(item.get("question_type")) or "diagnostic",
        difficulty=_clean(item.get("difficulty")) or _clean(item.get("band_level")) or "Medium",
        prompt=prompt, options=options, correct_answer=answer,
        explanation=_clean(body.get("explanation") or body.get("tips")),
        passage=_clean(body.get("passage") or body.get("task")),
        question_type=_clean(item.get("question_type")) or "multiple_choice",
    )


def _normalise_sat(item: dict[str, Any]) -> Optional[BankQuestion]:
    body = item.get("question") or item.get("content") or {}
    if not isinstance(body, dict):
        return None
    prompt = _clean(body.get("question") or item.get("prompt"))
    if not prompt:
        return None
    raw_opts = body.get("options")
    raw_choices = body.get("choices")
    if isinstance(raw_opts, (list, tuple)) and len(raw_opts) >= 2:
        options = tuple(_clean(option) for option in raw_opts if _clean(option))
        answer = _clean(body.get("correct_answer")) or options[0]
    elif isinstance(raw_choices, dict):
        options = tuple(_clean(v) for v in raw_choices.values() if _clean(v))
        correct_key = _clean(body.get("correct_answer"))
        answer = _clean(raw_choices.get(correct_key, options[0] if options else ""))
    else:
        return None
    if not (prompt and answer and options):
        return None
    return BankQuestion(
        id=_clean(item.get("id")), exam_type="sat",
        section=_clean(item.get("type")) or "General",
        domain=_clean(item.get("domain")), skill=_clean(item.get("skill")),
        difficulty=_clean(item.get("difficulty")) or "Medium", prompt=prompt,
        options=options, correct_answer=answer,
        explanation=_clean(body.get("explanation")), passage=_clean(body.get("paragraph")),
    )


def _normalise_ms(item: dict[str, Any], index: int) -> Optional[BankQuestion]:
    options = tuple(_clean(option) for option in item.get("options", []) if _clean(option))
    correct_index = item.get("correct_option")
    if not isinstance(correct_index, int) or correct_index < 0 or correct_index >= len(options):
        return None
    prompt = _clean(item.get("question"))
    if not prompt:
        return None
    subject = _clean(item.get("subject")) or "Milliy Sertifikat"
    return BankQuestion(
        id=_clean(item.get("id")) or f"ms_{index:04d}", exam_type="ms",
        section=subject, domain=_clean(item.get("topic")), skill=_clean(item.get("topic")),
        difficulty=_clean(item.get("difficulty")) or "medium", prompt=prompt,
        options=options, correct_answer=options[correct_index],
        explanation=_clean(item.get("explanation")), subject=subject,
    )


@lru_cache(maxsize=1)
def all_questions() -> tuple[BankQuestion, ...]:
    """Return only gradeable reviewed-schema records, never placeholder data."""
    questions: list[BankQuestion] = []
    questions.extend(q for item in _load("grammar_examples.json") if (q := _normalise_ielts(item)))
    questions.extend(q for item in _load("ielts_examples.json") if (q := _normalise_ielts(item)))
    questions.extend(q for item in _load("sat_examples.json") if (q := _normalise_sat(item)))
    questions.extend(q for item in _load("large_sat_data.json") if (q := _normalise_sat(item)))
    questions.extend(q for index, item in enumerate(_load("ms_examples.json"), start=1)
                     if (q := _normalise_ms(item, index)))
    return tuple(questions)


def select_questions(
    exam_type: str,
    *,
    count: int,
    section: str = "",
    subject: str = "",
    difficulty: str = "",
    exclude_ids: Iterable[str] = (),
    seed: Optional[str] = None,
) -> list[BankQuestion]:
    """Select unique questions reproducibly from the reviewed local bank."""
    normalized_exam = {"milliy": "ms", "dtm": "ms"}.get(exam_type.lower(), exam_type.lower())
    excluded = set(exclude_ids)
    candidates = [q for q in all_questions() if q.exam_type == normalized_exam and q.id not in excluded]
    if section:
        token = section.lower()
        candidates = [q for q in candidates if token in q.section.lower()]
    if subject:
        token = subject.lower()
        candidates = [q for q in candidates if token in q.subject.lower() or token in q.section.lower()]
    if difficulty:
        token = difficulty.lower()
        exact = [q for q in candidates if token in q.difficulty.lower()]
        if exact:
            candidates = exact
    randomizer = Random(seed)
    randomizer.shuffle(candidates)
    return candidates[:max(0, count)]


def bank_stats() -> dict[str, int]:
    """Small observability helper for dashboards and content operations."""
    stats: dict[str, int] = {"ielts": 0, "sat": 0, "ms": 0}
    for question in all_questions():
        stats[question.exam_type] = stats.get(question.exam_type, 0) + 1
    return stats
