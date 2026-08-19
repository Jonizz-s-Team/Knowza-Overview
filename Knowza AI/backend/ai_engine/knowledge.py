import json
from ..models import AIKnowledge
from . import vdb as ai_vdb
from . import utils as ai_utils

def add_to_knowledge(text, metadata=None):
    """Stores knowledge chunks directly in PostgreSQL using Django ORM."""
    try:
        chunks = ai_utils.chunk_text(text, chunk_size=1000)
        added_count = 0
        
        for chunk in chunks:
            embedding = ai_vdb.get_embedding(chunk)
            if embedding:
                AIKnowledge.objects.create(
                    content=chunk,
                    embedding=embedding,
                    metadata=metadata or {}
                )
                added_count += 1
        return added_count
    except Exception as e:
        print(f"Enterprise Knowledge Error (Postgres): {e}")
        return 0

def query_knowledge(query_text, top_k=3):
    """Searches PostgreSQL knowledge base using vector similarity logic."""
    try:
        query_emb = ai_vdb.get_embedding(query_text)
        if not query_emb: return []
        
        # We fetch all (or recent) knowledge and calculate similarity
        # For true 1M+ scale, a GIN index or pgvector would be used here
        knowledges = AIKnowledge.objects.all().order_by('-created_at')[:500]
        
        results = []
        for k in knowledges:
            if k.embedding:
                score = ai_vdb.cosine_similarity(query_emb, k.embedding)
                results.append((score, k.content))
        
        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results[:top_k]]
    except Exception as e:
        print(f"Enterprise Query Error (Postgres): {e}")
        return []

def get_knowledge_context(query):
    """Retrieves relevant context formatted for AI prompt."""
    relevant = query_knowledge(query)
    if not relevant:
        return ""
    
    context = "\n--- PROFESSIONAL BAZA MA'LUMOTI (Postgres) ---\n"
    context += "\n".join(relevant)
    context += "\n--------------------------------------------\n"
    return context
