from .gateway import call_llm
from .context import _build_system_prompt
import logging

logger = logging.getLogger(__name__)

def verify_and_refine(
    draft_text: str,
    user_query: str,
    context_sources: str,
    budget,
    user=None
) -> str:
    """
    Agentic verification loop.
    Takes a draft response, checks it against the provided context and logic,
    and asks the LLM to refine it.
    """
    
    verifier_system_prompt = (
        "You are Knowza AI's strict Verification Agent. "
        "Your task is to review a draft response against a user's query and provided context/sources. "
        "You must ensure the response is 100% accurate, properly cites the sources (with URLs if available), "
        "and is logically sound. "
        "If you find mistakes, correct them. If claims lack evidence, remove them or add evidence from the context. "
        "Return ONLY the polished, final, perfect response. Do not include meta-commentary like 'I have corrected...'."
    )
    
    user_prompt = f"""
USER QUERY:
{user_query}

SOURCES / CONTEXT:
{context_sources}

DRAFT RESPONSE TO VERIFY:
{draft_text}

Task: Verify the draft. Ensure all facts are supported by the SOURCES. Make the final output extremely clear, professional, and evidence-backed.
"""
    
    messages = [
        {'role': 'system', 'content': verifier_system_prompt},
        {'role': 'user', 'content': user_prompt}
    ]
    
    # We use the same budget output cap, maybe a slightly stricter temperature
    refined_text, error, metadata = call_llm(
        messages=messages,
        max_tokens=budget.output_cap,
        temperature=0.2, # Low temperature for verification
        timeout=budget.timeout,
        user=user
    )
    
    if error or not refined_text:
        logger.error(f"Verification failed: {error}")
        return draft_text # Fallback to draft if verification fails
        
    return refined_text
