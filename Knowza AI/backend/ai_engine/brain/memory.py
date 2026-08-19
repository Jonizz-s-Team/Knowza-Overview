import math
from .constants import QUERY_STOPWORDS

def _query_terms(text: str, max_terms: int = 15) -> list:
    if not text:
        return []
    words = text.lower().split()
    terms = [w for w in words if len(w) > 2 and w not in QUERY_STOPWORDS]
    return terms[:max_terms]

def _relevance_score(query_terms: list, message_content: str) -> float:
    if not query_terms or not message_content:
        return 0.0
    content_lower = message_content.lower()
    first_300 = content_lower[:300]
    score = 0.0
    for term in query_terms:
        count = content_lower.count(term)
        if count > 0:
            score += 1.0 + math.log1p(count)
            if term in first_300:
                score += 1.0
    return score

def select_history(
    history: list,
    current_query: str,
    history_limit: int,
    history_char_limit: int,
    is_simple: bool = False,
) -> list:
    if not history:
        return []

    def _truncate(msg):
        content = msg.get('content', '')
        if len(content) > history_char_limit:
            content = content[:history_char_limit] + '...'
        return {'role': msg.get('role', 'user'), 'content': content}

    if is_simple or len(history) <= history_limit:
        return [_truncate(m) for m in history[-history_limit:]]

    recent_count = max(history_limit // 2, 2)
    recent = history[-recent_count:]
    older = history[:-recent_count]
    query_terms = _query_terms(current_query)
    remaining_slots = history_limit - recent_count

    if not query_terms or remaining_slots <= 0:
        return [_truncate(m) for m in recent]

    scored = []
    for i, msg in enumerate(older):
        content = msg.get('content', '')
        score = _relevance_score(query_terms, content)
        scored.append((score, i, msg))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_relevant = [item[2] for item in scored[:remaining_slots]]
    combined = top_relevant + recent
    
    all_history = list(history)
    ordered = sorted(combined, key=lambda m: all_history.index(m) if m in all_history else 0)

    return [_truncate(m) for m in ordered]

import threading
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

def update_user_summary_task(user_id):
    try:
        from ...models import User, AIChatHistory
        from .gateway import call_llm
        
        user = User.objects.get(id=user_id)
        
        # Get last 20 messages
        history = AIChatHistory.objects.filter(user=user).order_by('-created_at')[:20]
        history = reversed(history)
        
        chat_text = "\n".join([f"{h.role}: {h.content}" for h in history])
        
        profile_data = (
            f"Age: {user.age}\n"
            f"Level: {user.current_level}\n"
            f"Bio: {user.bio}\n"
            f"Interests: {user.interests}\n"
            f"Goals: {user.target_goals}\n"
            f"Current Summary: {user.ai_memory_summary}"
        )
        
        system_prompt = (
            "You are an AI tasked with analyzing a user's profile and chat history "
            "to create or update a concise long-term memory summary about them.\n"
            "This summary will be injected into future AI prompts to help the AI remember the user.\n"
            "Keep it under 3 paragraphs. Focus on their learning style, goals, interests, "
            "and any specific preferences they've mentioned in chats.\n"
            "Write the summary in the third person (e.g. 'The user is a...')."
        )
        
        user_prompt = f"PROFILE DATA:\n{profile_data}\n\nRECENT CHATS:\n{chat_text}\n\nPlease output the new updated summary."
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ]
        
        response_text, error, metadata = call_llm(
            messages=messages,
            max_tokens=500,
            temperature=0.3,
            timeout=15,
            user=user
        )
        
        if response_text and not error:
            user.ai_memory_summary = response_text.strip()
            user.save(update_fields=['ai_memory_summary'])
            logger.info(f"Successfully updated AI memory summary for user {user_id}")
        else:
            logger.error(f"Failed to update AI memory summary for user {user_id}: {error}")
            
    except Exception as e:
        logger.error(f"Error in update_user_summary_task: {str(e)}")


import concurrent.futures

# Max 5 ta ishchi yuzlab userlar birdaniga kelsa ham serverni qotib qolishidan himoya qiladi.
# Ortiqcha so'rovlar navbatda (queue) kutib turadi va server RAM/CPU siga nagruzka tushirmaydi.
_summary_executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

def async_update_user_summary(user_id):
    """
    Spawns a background task to generate a new AI memory summary for the user.
    Uses a bounded ThreadPoolExecutor to prevent blocking or overloading the server.
    """
    _summary_executor.submit(update_user_summary_task, user_id)
