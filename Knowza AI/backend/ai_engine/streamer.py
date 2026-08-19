import json
import time
from django.http import StreamingHttpResponse
from . import utils as ai_utils

def stream_ai_response(prompt, system_instruction=None, temperature=0.7, user=None):
    """
    Wraps the AI generator into a Server-Sent Events (SSE) stream with role-based auth.
    """
    def event_generator():
        try:
            for chunk in ai_utils.stream_ai(prompt, system_instruction, temperature, user=user):
                # Standard SSE handling for multi-line chunks
                for line in chunk.splitlines():
                    yield f"data: {line}\n"
                # Send empty line to end the event block
                yield "\n"
                time.sleep(0.01)
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"

    response = StreamingHttpResponse(event_generator(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable buffering for Nginx
    return response

def stream_test_generation(text, instructions=None, complexity='medium', count=10):
    """
    Experimental: Stream test questions one by one.
    Note: Requires specific prompt engineering to yield valid JSON fragments.
    """
    # For now, we use a simple text stream as JSON streaming is complex
    prompt = f"Berilgan matndan {count} ta test yarating. Har bir savoldan keyin '---' belgisini qo'ying. MATN: {text}"
    return stream_ai_response(prompt, system_instruction=ai_utils.EducationalGuard.get_system_context("test_gen"))
