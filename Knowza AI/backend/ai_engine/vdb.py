import hashlib
import math
from django.core.cache import cache

def get_embedding(text):
    """Generates a vector embedding for the given text using Gemini."""
    from . import utils
    from .brain.keys_manager import keys_manager
    if not utils.genai:
        return None
    
    gemini_key = keys_manager.get_key('gemini')
    if not gemini_key or not gemini_key.startswith('AIza'):
        return None
    
    try:
        utils.genai.configure(api_key=gemini_key)
        result = utils.genai.embed_content(
            model="models/embedding-001",
            content=text[:5000],
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        return None

def cosine_similarity(v1, v2):
    """Calculates similarity between two vectors without numpy."""
    if v1 is None or v2 is None or len(v1) != len(v2): 
        return 0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0 or mag2 == 0: return 0
    return dot_product / (mag1 * mag2)

def _get_prompt_hash(prompt: str, language: str = 'en') -> str:
    """Computes MD5 hash for fast exact prompt matching in cache."""
    return hashlib.md5(f"{language}:{prompt.strip()}".encode('utf-8')).hexdigest()


def get_semantic_cache(prompt, language='en', threshold=0.88):
    """Checks semantic cache with fast hash fallback and DB vector search."""
    if not prompt:
        return None

    prompt_hash = _get_prompt_hash(prompt, language)
    cache_key = f"sem_cache:{prompt_hash}"
    fast_cached = cache.get(cache_key)
    if fast_cached and len(fast_cached) > 500:
        return fast_cached

    from ..models import GlobalResearchCache
    emb = get_embedding(prompt)
    if not emb:
        return None

    caches = GlobalResearchCache.objects.filter(language=language).only('topic_embedding', 'content', 'created_at').order_by('-created_at')[:200]
    for c in caches:
        if c.topic_embedding and c.content and len(c.content) > 500:
            sim = cosine_similarity(emb, c.topic_embedding)
            if sim >= threshold:
                cache.set(cache_key, c.content, timeout=86400)
                return c.content
    return None


def save_semantic_cache(prompt, response, language='en'):
    """Saves response to fast Django cache, DB vector store, and global RAG knowledge base."""
    if not prompt or not response:
        return

    prompt_hash = _get_prompt_hash(prompt, language)
    cache_key = f"sem_cache:{prompt_hash}"
    cache.set(cache_key, response, timeout=86400)

    from ..models import GlobalResearchCache
    emb = get_embedding(prompt)
    if not emb:
        return

    GlobalResearchCache.objects.create(
        topic=prompt,
        topic_embedding=emb,
        content=response,
        language=language
    )

    # Automatically index research summary into AIKnowledge for global cross-user RAG retrieval
    try:
        from .knowledge import add_to_knowledge
        summary_text = f"PAST RESEARCH KNOWLEDGE ('{prompt}'):\n{response[:1500]}"
        add_to_knowledge(summary_text, metadata={'topic': prompt, 'type': 'global_research'})
    except Exception as e:
        print(f"RAG indexing error: {e}")
