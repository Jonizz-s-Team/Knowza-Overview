import re
from dataclasses import dataclass
from .constants import INTENTS, COMPLEX_INDICATORS, DEEP_INDICATORS

@dataclass
class RequestProfile:
    intent: str
    is_simple: bool
    estimated_tokens: int
    has_code: bool = False
    detected_language: str = 'en'

def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    base = len(text) / 3.8
    non_latin = sum(1 for c in text if ord(c) > 127)
    ratio = non_latin / max(len(text), 1)
    overhead = 1.0 + (ratio * 0.5)
    return int(base * overhead)

def _detect_language(text: str) -> str:
    if not text:
        return 'en'
    cyrillic = sum(1 for c in text if '\u0400' <= c <= '\u04FF')
    latin = sum(1 for c in text if 'a' <= c.lower() <= 'z')
    total = max(len(text), 1)
    if cyrillic / total > 0.3:
        return 'ru'
    if latin / total > 0.5:
        uz_markers = ['ning', 'lar', 'ga', 'dan', 'dagi', 'uchun', 'bilan']
        text_lower = text.lower()
        if any(m in text_lower for m in uz_markers):
            return 'uz'
        return 'en'
    return 'en'

def _is_simple(text: str, word_count: int) -> bool:
    if word_count > 30:
        return False
    text_lower = text.lower()
    if any(ind in text_lower for ind in COMPLEX_INDICATORS):
        return False
    if any(ind in text_lower for ind in DEEP_INDICATORS):
        return False
    if re.search(r'```|def |class |import |function |SELECT |CREATE ', text):
        return False
    return True

def _detect_intent(text: str, is_simple: bool, explicit_intent: str = None) -> str:
    if explicit_intent:
        return explicit_intent
    text_lower = text.lower()
    if any(ind in text_lower for ind in DEEP_INDICATORS):
        return INTENTS.EXPLAIN_DEEP
    test_keywords = [
        'test yarat', 'test genera', 'savol tuz', 'test tuz',
        'generate test', 'make test', 'create test', 'quiz',
        'тест создай', 'тест генер', 'вопросы создай',
    ]
    article_keywords = [
        'maqola', 'article', 'essay', 'report', 'izlanish', 'research',
        'yozib ber', 'write an article', 'напиши статью', 'доклад'
    ]
    if any(kw in text_lower for kw in test_keywords):
        return INTENTS.TEST_GEN
    if any(kw in text_lower for kw in article_keywords):
        return INTENTS.ARTICLE_GEN
    if not is_simple:
        return INTENTS.EXPLAIN_DEEP
    return INTENTS.EXPLAIN_SIMPLE

def profile_request(text: str, explicit_intent: str = None) -> RequestProfile:
    if not text:
        return RequestProfile(
            intent=INTENTS.EXPLAIN_SIMPLE,
            is_simple=True,
            estimated_tokens=0,
        )
    words = text.split()
    word_count = len(words)
    is_simple = _is_simple(text, word_count)
    has_code = bool(re.search(r'```|def |class |import |function |const |let |var ', text))
    lang = _detect_language(text)
    intent = _detect_intent(text, is_simple, explicit_intent)
    tokens = estimate_tokens(text)

    return RequestProfile(
        intent=intent,
        is_simple=is_simple,
        estimated_tokens=tokens,
        has_code=has_code,
        detected_language=lang,
    )
