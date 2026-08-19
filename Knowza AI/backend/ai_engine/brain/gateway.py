import time
import os
import logging
from ..firewall import KnowzaShield
from .keys_manager import keys_manager

logger = logging.getLogger(__name__)

# High-quality routing for Knowza AI. OpenAI and Gemini produce long, detailed research articles.
PROVIDER_ORDER = ['openai', 'gemini', 'groq', 'claude']

def _call_openai(messages, api_key, max_tokens, temperature, timeout):
    try:
        from openai import OpenAI
    except ImportError:
        return None, "OpenAI library not installed"
    try:
        client = OpenAI(api_key=api_key, timeout=timeout)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content, None
    except Exception as e:
        return None, str(e)

def _stream_openai(messages, api_key, max_tokens, temperature):
    try:
        from openai import OpenAI
    except ImportError:
        yield "ERROR: OpenAI library not installed"
        return
    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )
        for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        yield f"ERROR: {str(e)}"

def _call_claude(messages, api_key, max_tokens, temperature, timeout):
    try:
        from anthropic import Anthropic
    except ImportError:
        return None, "Anthropic library not installed"
    try:
        client = Anthropic(api_key=api_key)
        
        system_msg = ""
        claude_msgs = []
        for m in messages:
            if m['role'] == 'system':
                system_msg = m['content']
            else:
                claude_msgs.append(m)
                
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_msg,
            messages=claude_msgs
        )
        return response.content[0].text, None
    except Exception as e:
        return None, str(e)

def _stream_claude(messages, api_key, max_tokens, temperature):
    try:
        from anthropic import Anthropic
    except ImportError:
        yield "ERROR: Anthropic library not installed"
        return
    try:
        client = Anthropic(api_key=api_key)
        
        system_msg = ""
        claude_msgs = []
        for m in messages:
            if m['role'] == 'system':
                system_msg = m['content']
            else:
                claude_msgs.append(m)
                
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_msg,
            messages=claude_msgs
        ) as stream:
            for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"ERROR: {str(e)}"

def _call_gemini(messages, api_key, max_tokens, temperature, timeout):
    try:
        import google.generativeai as genai
    except ImportError:
        return None, "Google AI library is not installed"
    try:
        genai.configure(api_key=api_key)
        system_instruction = None
        user_parts = []
        for msg in messages:
            if msg['role'] == 'system':
                system_instruction = msg['content']
            else:
                user_parts.append(msg['content'])
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_instruction,
        )
        full_prompt = '\n\n'.join(user_parts)
        response = model.generate_content(
            full_prompt,
            generation_config={
                'temperature': temperature,
                'max_output_tokens': max_tokens,
            },
        )
        return response.text, None
    except Exception as e:
        return None, str(e)

def _stream_gemini(messages, api_key, max_tokens, temperature):
    try:
        import google.generativeai as genai
    except ImportError:
        yield "ERROR: Google AI library is not installed"
        return
    try:
        genai.configure(api_key=api_key)
        system_instruction = None
        user_parts = []
        for msg in messages:
            if msg['role'] == 'system':
                system_instruction = msg['content']
            else:
                user_parts.append(msg['content'])
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_instruction,
        )
        full_prompt = '\n\n'.join(user_parts)
        response = model.generate_content(
            full_prompt,
            stream=True,
            generation_config={
                'temperature': temperature,
                'max_output_tokens': max_tokens,
            },
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"ERROR: {str(e)}"

def _call_groq(messages, api_key, max_tokens, temperature, timeout):
    try:
        from groq import Groq
    except ImportError:
        return None, "Groq library is not installed"
    try:
        client = Groq(api_key=api_key)
        groq_messages = []
        for msg in messages:
            groq_messages.append({
                'role': msg['role'] if msg['role'] != 'system' else 'system',
                'content': msg['content'],
            })
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=groq_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content, None
    except Exception as e:
        return None, str(e)

def _stream_groq(messages, api_key, max_tokens, temperature):
    try:
        from groq import Groq
    except ImportError:
        yield "ERROR: Groq library is not installed"
        return
    try:
        client = Groq(api_key=api_key)
        groq_messages = [
            {'role': msg['role'] if msg['role'] != 'system' else 'system',
            'content': msg['content']} for msg in messages
        ]
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=groq_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        yield f"ERROR: {str(e)}"

CALLERS = {
    'openai': _call_openai,
    'claude': _call_claude,
    'gemini': _call_gemini,
    'groq': _call_groq,
}

STREAMERS = {
    'openai': _stream_openai,
    'claude': _stream_claude,
    'gemini': _stream_gemini,
    'groq': _stream_groq,
}

def call_llm(
    messages: list,
    max_tokens: int,
    temperature: float,
    timeout: int,
    user=None,
) -> tuple:
    user_content = messages[-1].get('content', '') if messages else ''
    is_safe, sanitized, error_msg = KnowzaShield.audit_prompt(user_content, user=user)
    if not is_safe:
        return None, error_msg, {'security_violation': True}

    if messages:
        messages[-1]['content'] = sanitized

    start_time = time.time()
    
    # Failover loop across multiple providers
    for provider in PROVIDER_ORDER:
        api_key = keys_manager.get_key(provider)
        if not api_key:
            continue
            
        caller = CALLERS.get(provider)
        if caller:
            result, error = caller(messages, api_key, max_tokens, temperature, timeout)
            if result:
                latency = (time.time() - start_time) * 1000
                result = KnowzaShield.audit_response(result)
                return result, None, {
                    'provider': provider,
                    'latency_ms': latency,
                    'prompt_tokens': sum(len(m.get('content', '')) // 4 for m in messages),
                    'completion_tokens': len(result) // 4,
                }
            elif error and '429' in str(error):
                logger.warning(f"{provider} hit rate limit (429). Rotating key.")
                keys_manager.rotate_on_error(provider)
                # Try the next provider for failover immediately
            else:
                logger.error(f"{provider} failed: {error}")

    return None, "All AI providers failed or no API keys available.", {}

def stream_llm(
    messages: list,
    max_tokens: int,
    temperature: float,
    user=None,
):
    for provider in PROVIDER_ORDER:
        api_key = keys_manager.get_key(provider)
        if not api_key:
            continue
            
        streamer = STREAMERS.get(provider)
        if streamer:
            try:
                generator = streamer(messages, api_key, max_tokens, temperature)
                first_chunk = next(generator)
                
                if isinstance(first_chunk, str) and first_chunk.startswith("ERROR:"):
                    logger.warning(f"{provider} stream failed: {first_chunk}. Falling back to next provider.")
                    keys_manager.rotate_on_error(provider)
                    continue # Try next provider!
                
                yield first_chunk
                yield from generator
                return # success
                
            except StopIteration:
                return # empty stream
            except Exception as e:
                logger.error(f"{provider} stream exception: {str(e)}. Falling back to next provider.")
                keys_manager.rotate_on_error(provider)
                continue # Try next provider

    yield "ERROR: Barcha AI tarmoqlari band yoki limit tugagan. Iltimos, birozdan keyin urinib ko'ring."
