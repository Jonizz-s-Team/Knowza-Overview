"""Content-quality checks for the local Knowza Exam Bank.

The checks are intentionally deterministic and free: they are run before an
editor marks a bank build as ready, instead of spending AI tokens to discover
empty options or duplicate question text at runtime.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from .repository import BankQuestion, all_questions


@dataclass(frozen=True)
class ContentIssue:
    question_id: str
    code: str
    detail: str


def audit_questions(questions: tuple[BankQuestion, ...] | None = None) -> list[ContentIssue]:
    items = questions if questions is not None else all_questions()
    issues: list[ContentIssue] = []
    prompt_counts = Counter(question.prompt.casefold() for question in items)
    for question in items:
        if len(question.options) < 2:
            issues.append(ContentIssue(question.id, "options_missing", "At least two answer options are required."))
        if question.correct_answer not in question.options:
            issues.append(ContentIssue(question.id, "answer_not_in_options", "Correct answer is not one of the options."))
        if not question.explanation:
            issues.append(ContentIssue(question.id, "explanation_missing", "Published questions need an explanation."))
        if prompt_counts[question.prompt.casefold()] > 1:
            issues.append(ContentIssue(question.id, "duplicate_prompt", "Question text occurs more than once in the bank."))
    return issues


def quality_summary() -> dict:
    items = all_questions()
    issues = audit_questions(items)
    return {
        "total_questions": len(items),
        "issues": len(issues),
        "unique_prompts": len({question.prompt.casefold() for question in items}),
        "by_code": dict(Counter(issue.code for issue in issues)),
    }
