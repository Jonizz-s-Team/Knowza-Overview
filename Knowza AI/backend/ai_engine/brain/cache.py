import hashlib
import re
from django.core.cache import cache as django_cache
from .constants import QUERY_STOPWORDS, INTENTS

def normalize_semantic_text(text: str) -> str:
    if not text:
        return ''
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    tokens = text.split()
    filtered = [t for t in tokens if t not in QUERY_STOPWORDS and len(t) > 1]
    filtered.sort()
    return ' '.join(filtered)

def cache_key(user_id: int, text: str, intent: str, session_id: int = None) -> str:
    normalized = normalize_semantic_text(text)
    raw = f"{user_id}:{normalized}:{intent}"
    if session_id and intent in (INTENTS.SOCRATIC_COACH, INTENTS.SIMPLIFY, INTENTS.DEEPEN):
        raw = f"s{session_id}:{raw}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:32]
    return f"knowza_v1_{digest}"

def get_cache_config(intent: str) -> dict:
    configs = {
        INTENTS.EXPLAIN_SIMPLE: {'enabled': True, 'ttl': 86400},
        INTENTS.EXPLAIN_DEEP: {'enabled': True, 'ttl': 21600},
        INTENTS.TEST_GEN: {'enabled': False, 'ttl': 0},
        INTENTS.SOCRATIC_COACH: {'enabled': False, 'ttl': 0},
        INTENTS.SIMPLIFY: {'enabled': True, 'ttl': 14400},
        INTENTS.DEEPEN: {'enabled': True, 'ttl': 14400},
    }
    return configs.get(intent, {'enabled': True, 'ttl': 14400})

def get_cached_response(key: str):
    try:
        return django_cache.get(key)
    except Exception:
        return None

def set_cached_response(key: str, response: str, ttl: int):
    try:
        django_cache.set(key, response, timeout=ttl)
    except Exception:
        pass
