import os
import json
import logging
from pydantic import BaseModel, ValidationError
import time
logger = logging.getLogger(__name__)
import re
import hashlib
from django.core.cache import cache
from django.conf import settings
from ..models import AIUsageLog

# --- PROVIDER INITIALIZATION ---

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from groq import Groq
except ImportError:
    Groq = None

# Base keys from environment
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
# Compatibility alias
DEFAULT_API_KEY = GOOGLE_API_KEY

def get_all_keys_for_provider(provider_prefix):
    """Fetches all keys like GROQ_API_KEY_1, GROQ_API_KEY_2..."""
    keys = []
    for i in range(1, 11):
        key = os.environ.get(f"{provider_prefix}_API_KEY_{i}")
        if key and key.strip():
            keys.append(key.strip())
    # Fallback to base key if no numbered keys found
    base_key = os.environ.get(f"{provider_prefix}_API_KEY")
    if not keys and base_key and base_key.strip():
        keys.append(base_key.strip())
    return keys

# Pre-load available keys
AVAILABLE_KEYS = {
    'groq': get_all_keys_for_provider('GROQ'),
    'gemini': get_all_keys_for_provider('GEMINI'),
    'openai': get_all_keys_for_provider('OPENAI')
}

# State for round-robin
RR_INDEX = {'groq': 0, 'gemini': 0, 'openai': 0}

def get_next_key(provider):
    keys = AVAILABLE_KEYS.get(provider, [])
    if not keys: return None
    key = keys[RR_INDEX[provider] % len(keys)]
    RR_INDEX[provider] += 1
    return key

# ONLY initialize genai if we have at least one Gemini key
if genai and (AVAILABLE_KEYS['gemini'] or (GOOGLE_API_KEY and GOOGLE_API_KEY.startswith('AIza'))):
    pass
else:
    genai = None

def get_api_key_for_user(user):
    """Legacy function, now just returns groq or gemini keys by preference"""
    key = get_next_key('groq') or get_next_key('gemini') or get_next_key('openai')
    return key or GOOGLE_API_KEY

def extract_text_from_file(file_obj, user=None):
    """Extracts plain text from PDF or DOCX files safely."""
    import pdfplumber
    from docx import Document
    import io
    
    text = ""
    try:
        ext = file_obj.name.split('.')[-1].lower()
        if ext == 'pdf':
            with pdfplumber.open(file_obj) as pdf:
                text = "\n".join([page.extract_text() or "" for page in pdf.pages])
        elif ext in ['docx', 'doc']:
            doc = Document(file_obj)
            text = "\n".join([para.text for para in doc.paragraphs])
        else:
            # Try to read as plain text
            text = file_obj.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"File extraction error: {e}")
        text = f"Error extracting text: {str(e)}"
    
    return text.strip()

# --- SAFETY & GUARDS ---

class EducationalGuard:
    """Security and Role-based context management."""
    @staticmethod
    def get_system_context(role):
        contexts = {
            "teacher": "Siz professional o'qituvchi yordamchisiz. Vazifalaringiz: testlar yaratish, dars rejalari tuzish va o'quvchilar tahlilini qilish. Sizning javoblaringiz doimo akademik, aniq va pedagogik bo'lishi kerak.",
            "student": "Siz shaxsiylashtirilgan repetitorsiz. Foydalanuvchi bilim darajasini va zaif tomonlarini hisobga oling (Adaptive Learning). Xatolar ustida ishlang va motivatsiya bering. Hech qachon o'quvchining o'rniga uy vazifasini to'liq bajarib bermang.",
            "test_gen": "Siz qat'iy akademik test generatorisiz. Ma'lumotlarni faqat JSON formatida qaytaring. Sxema: {'title': '...', 'subject': '...', 'time_limit': 30, 'difficulty': 'medium', 'target_grades': [], 'anti_cheat_enabled': null, 'questions': [{'question': '...', 'options': ['A', 'B', 'C', 'D'], 'correct_answer': '...', 'explanation': '...'}]}. Hech qanday qo'shimcha matn yozmang.",
            "judge": "Siz sifat nazoratchisisiz. AI javobini faktik xatolar, xavfsizlik va pedagogik standartlarga tekshiring."
        }
        return contexts.get(role, "Siz ta'lim platformasi uchun neytral AI yordamchisiz.")

# --- UTILS ---

def compress_text(text):
    """Reduces token noise while preserving meaning."""
    if not text: return ""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s\.\?\!]', '', text)
    return text.strip()

def chunk_text(text, chunk_size=1000):
    """Splits text into manageable chunks for vector embeddings."""
    if not text: return []
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

def extract_json(text):
    """Robust JSON extraction from LLM response."""
    if not text: return {"error": "AI javobi bo'sh"}
    if isinstance(text, dict): return text
    
    try:
        # First try direct parse
        return json.loads(text.strip())
    except:
        # If it has markdown wrappers, strip them
        try:
            cleaned = re.sub(r'^```json\s*', '', text.strip(), flags=re.IGNORECASE)
            cleaned = re.sub(r'```\s*$', '', cleaned.strip(), flags=re.IGNORECASE)
            return json.loads(cleaned)
        except:
            pass

        # Use regex to find the largest block between { and } OR [ and ]
        match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()
            try:
                return json.loads(cleaned)
            except:
                return {"error": f"JSON tahlil qilib bo'lmadi: {text[:50]}..."}
        return {"error": "JSON formati topilmadi"}

# --- CORE AI LOGIC ---

def _execute_provider(provider, prompt, api_key, system_instruction, temperature, user, feature, pydantic_model, schema):
    if provider == 'groq':
        return call_groq(prompt, api_key, system_instruction, temperature, user, feature, schema, pydantic_model)
    elif provider == 'openai':
        return call_openai(prompt, api_key, system_instruction, temperature, user, feature, schema, pydantic_model)
    elif provider == 'gemini':
        return call_gemini_provider(prompt, api_key, system_instruction, temperature, user, feature, 0, schema, pydantic_model)
    return {"error": "Noma'lum provider"}

def call_ai(prompt, system_instruction=None, temperature=0.7, user=None, feature="chat", retry_count=2, schema=None, pydantic_model=None):
    from .firewall import KnowzaShield
    
    # 1. Firewall: Audit Input
    is_safe, sanitized_prompt, error_msg = KnowzaShield.audit_prompt(prompt, user=user)
    if not is_safe:
        return {"error": error_msg, "security_violation": True}

    # Ultra-fast, low-cost Provider Router
    if feature in ["roadmap_gen", "article_gen", "test_gen"]:
        providers_to_try = ['groq', 'gemini', 'openai']
    else:
        providers_to_try = ['groq', 'gemini', 'openai']
        
    last_error = None
    
    for provider in providers_to_try:
        keys = AVAILABLE_KEYS.get(provider, [])
        if not keys and provider == 'gemini' and GOOGLE_API_KEY:
            keys = [GOOGLE_API_KEY]
        if not keys and provider == 'groq' and GOOGLE_API_KEY and GOOGLE_API_KEY.startswith('gsk_'):
            keys = [GOOGLE_API_KEY]
            
        for _ in range(max(1, len(keys))):
            api_key = get_next_key(provider) or GOOGLE_API_KEY
            if not api_key:
                break
                
            try:
                start_time = time.time()
                result = _execute_provider(provider, sanitized_prompt, api_key, system_instruction, temperature, user, feature, pydantic_model, schema)
                
                validation_success = True
                
                # Pydantic Validation & Repair-Retry Loop
                if pydantic_model and not (isinstance(result, dict) and "error" in result):
                    try:
                        if isinstance(result, str):
                            valid_data = pydantic_model.model_validate_json(result)
                        else:
                            valid_data = pydantic_model.model_validate(result)
                        result = valid_data.model_dump()
                    except ValidationError as ve:
                        validation_success = False
                        logger.warning(f"Validation failed for {provider}, attempting repair. Error: {ve}")
                        repair_prompt = f"{sanitized_prompt}\n\n[SYSTEM: Your previous JSON response had validation errors. Please fix them and return correct JSON. Errors:\n{ve.errors()}]"
                        
                        repair_result = _execute_provider(provider, repair_prompt, api_key, system_instruction, temperature, user, feature, pydantic_model, schema)
                        if not (isinstance(repair_result, dict) and "error" in repair_result):
                            try:
                                if isinstance(repair_result, str):
                                    valid_data = pydantic_model.model_validate_json(repair_result)
                                else:
                                    valid_data = pydantic_model.model_validate(repair_result)
                                result = valid_data.model_dump()
                                validation_success = True
                            except ValidationError as ve2:
                                result = {"error": f"JSON validation failed after repair: {str(ve2)}"}
                        else:
                            result = repair_result
                            
                latency = (time.time() - start_time) * 1000
                
                # If result is valid (not an error dictionary), return it
                if not (isinstance(result, dict) and "error" in result):
                    logger.info(json.dumps({
                        "event": "llm_call_success",
                        "provider": provider,
                        "feature": feature,
                        "latency_ms": latency,
                        "validation_success": validation_success
                    }))
                    
                    if isinstance(result, str):
                        result = KnowzaShield.audit_response(result)
                    return result
                else:
                    last_error = result
                    err_str = str(result.get('error', ''))
                    logger.error(f"{provider.upper()} failed: {err_str}")
                    
                    if "insufficient_quota" in err_str or "credit_balance_exhausted" in err_str:
                        # Fail fast if quota is exhausted, retrying won't help
                        break
                    
                    if "429" in err_str:
                        time.sleep(2)
            except Exception as e:
                last_error = {"error": str(e)}
                logger.error(f"{provider.upper()} exception: {e}")

    return last_error or {"error": "Barcha sun'iy intellekt xizmatlari band yoki ishlamayapti."}


def call_groq(prompt, api_key, system_instruction=None, temperature=0.7, user=None, feature="chat", schema=None, pydantic_model=None):
    if not Groq:
        return {"error": "Groq kutubxonasi o'rnatilmagan"}
    
    from . import knowledge, vdb
    clean_prompt = compress_text(prompt)
    context = knowledge.get_knowledge_context(clean_prompt)
    full_prompt = f"{context}\n{clean_prompt}" if context else clean_prompt

    # Semantic Cache
    cached = vdb.get_semantic_cache(full_prompt)
    if cached: return cached

    client = Groq(api_key=api_key)
    
    # Intelligent Model Tiering:
    # The reviewed bank supplies questions; routine student feedback must use
    # the inexpensive fast tier. Reserve the larger model for genuinely deep
    # content work so the 280,000 UZS learner plan remains viable.
    if feature not in ["roadmap_gen", "article_gen", "deep_review"]:
        model_name = "llama-3.1-8b-instant"
    else:
        model_name = "llama-3.3-70b-versatile"
    
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": full_prompt})
    
    start_time = time.time()
    try:
        if pydantic_model:
            response_format_config = {"type": "json_object"}
        else:
            response_format_config = {"type": "json_object"} if feature == "test_gen" else None
            
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=4096,
            response_format=response_format_config
        )
        
        res_text = response.choices[0].message.content
        latency = (time.time() - start_time) * 1000
        
        # Log usage
        if user:
            p_tok = response.usage.prompt_tokens
            c_tok = response.usage.completion_tokens
            AIUsageLog.objects.create(
                user=user, feature_name=f"groq_{feature}",
                prompt_tokens=p_tok, completion_tokens=c_tok,
                total_tokens=p_tok + c_tok, latency_ms=latency
            )
            
        result = extract_json(res_text) if "{" in res_text and "}" in res_text else res_text
        vdb.save_semantic_cache(full_prompt, result)
        return result
    except Exception as e:
        if user:
            AIUsageLog.objects.create(user=user, feature_name=f"groq_{feature}", status='failed', error_message=str(e))
        return {"error": str(e)}

def call_openai(prompt, api_key, system_instruction=None, temperature=0.7, user=None, feature="chat", schema=None, pydantic_model=None):
    try:
        from openai import OpenAI
    except ImportError:
        return {"error": "OpenAI kutubxonasi o'rnatilmagan"}
    
    from . import knowledge, vdb
    clean_prompt = compress_text(prompt)
    context = knowledge.get_knowledge_context(clean_prompt)
    full_prompt = f"{context}\n{clean_prompt}" if context else clean_prompt

    # Semantic Cache
    cached = vdb.get_semantic_cache(full_prompt)
    if cached: return cached

    client = OpenAI(api_key=api_key, max_retries=0)
    model_name = "gpt-4o-mini"
    
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": full_prompt})
    
    start_time = time.time()
    try:
        if pydantic_model:
            try:
                response = client.beta.chat.completions.parse(
                    model=model_name,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=4096,
                    response_format=pydantic_model
                )
            except AttributeError:
                # Fallback if old openai library version
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=4096,
                    response_format={"type": "json_object"}
                )
        else:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=4096,
                response_format={"type": "json_object"} if feature == "test_gen" else None
            )
        
        res_text = response.choices[0].message.content
        latency = (time.time() - start_time) * 1000
        
        # Log usage
        if user:
            p_tok = response.usage.prompt_tokens
            c_tok = response.usage.completion_tokens
            AIUsageLog.objects.create(
                user=user, feature_name=f"openai_{feature}",
                prompt_tokens=p_tok, completion_tokens=c_tok,
                total_tokens=p_tok + c_tok, latency_ms=latency
            )
            
        result = extract_json(res_text) if "{" in res_text and "}" in res_text else res_text
        vdb.save_semantic_cache(full_prompt, result)
        return result
    except Exception as e:
        if user:
            AIUsageLog.objects.create(user=user, feature_name=f"openai_{feature}", status='failed', error_message=str(e))
        return {"error": str(e)}

def call_gemini_provider(prompt, api_key, system_instruction=None, temperature=0.7, user=None, feature="chat", retry_count=2, schema=None, pydantic_model=None):
    if not genai:
        return {"error": "Google AI kutubxonasi o'rnatilmagan"}
        
    from . import knowledge, vdb
    clean_prompt = compress_text(prompt)
    context = knowledge.get_knowledge_context(clean_prompt)
    full_prompt = f"{context}\n{clean_prompt}" if context else clean_prompt

    cached = vdb.get_semantic_cache(full_prompt)
    if cached: return cached

    start_time = time.time()
    for attempt in range(retry_count + 1):
        try:
            genai.configure(api_key=api_key)
            model_config = {"temperature": temperature}
            if pydantic_model:
                model_config["response_mime_type"] = "application/json"
            elif schema:
                model_config["response_schema"] = schema
            if feature in ["test_gen", "analytics"]:
                model_config["response_mime_type"] = "application/json"

            # Use gemini-2.0-flash for maximum reliability and speed
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(full_prompt, generation_config=model_config)
            
            res_text = response.text
            latency = (time.time() - start_time) * 1000
            
            if user:
                p_tok = len(full_prompt) // 4
                c_tok = len(res_text) // 4
                AIUsageLog.objects.create(
                    user=user, feature_name=f"gemini_{feature}",
                    prompt_tokens=p_tok, completion_tokens=c_tok,
                    total_tokens=p_tok + c_tok, latency_ms=latency
                )

            result = extract_json(res_text) if "{" in res_text and "}" in res_text else res_text
            vdb.save_semantic_cache(full_prompt, result)
            return result
        except Exception as e:
            if attempt < retry_count:
                time.sleep(1)
                continue
            if user:
                AIUsageLog.objects.create(user=user, feature_name=f"gemini_{feature}", status='failed', error_message=str(e))
            return {"error": str(e)}

# --- ALIAS FOR COMPATIBILITY ---
def call_gemini_legacy(prompt, system_instruction=None, temperature=0.7, user=None, feature="chat", retry_count=2):
    return call_ai(prompt, system_instruction, temperature, user, feature, retry_count)

# --- REPLACEMENT OF OLD HELPER ---
def call_gemini_orig(prompt, system_instruction=None, temperature=0.7, user=None, feature="chat", retry_count=2):
    return call_ai(prompt, system_instruction, temperature, user, feature, retry_count)

# Re-defining common helpers to use the new router
def generate_test_pro(text, instructions=None, complexity='medium', count=10, user=None):
    if not text: return {"error": "Matn yo'q"}
    prompt = f"""
    Quyidagi matndan aynan {count} ta {complexity} darajadagi test yarating.
    
    KO'RSATMALAR:
    {instructions}
    
    TALABLAR:
    1. Savollar soni: {count} ta (Aynan shu miqdorda bo'lishi shart).
    2. Daraja: {complexity}.
    3. JSON qaytaring: title, subject, time_limit, difficulty, target_grades (massiv), anti_cheat_enabled va questions (massiv).
    4. questions ichida har bir savolda: question, options (4 ta), correct_answer, explanation bo'lishi shart.
    
    MATN:
    {text}
    """
    return call_ai(prompt, system_instruction=EducationalGuard.get_system_context("test_gen"), user=user, feature="test_gen")

def student_explain_topic(topic, history="", user=None):
    prompt = f"Tarix: {history}\nMavzu: {topic}\nIltimos, sodda tushuntiring."
    return call_ai(prompt, system_instruction=EducationalGuard.get_system_context("student"), user=user, feature="student_chat")

def analyze_performance(data, role='student', user=None):
    """
    Analyzes student/teacher statistics and returns structured pedagogical insights.
    Enforces JSON structure and handles empty/zero data cases to avoid hallucinations.
    """
    security_context = "Siz xavfsiz ta'lim AI yordamchisiz. FAQAT taqdim etilgan statistikadan foydalaning. Hech qachon shaxsiy ma'lumotlarni so'ramang va tashqi URL-larni bermang."
    
    summary = data.get('summary', data.get('stats', data))
    category = data.get('category', data.get('cardTitle', 'Umumiy Tahlil'))
    diagram_data = data.get('stats', data.get('data', [])) if isinstance(data.get('stats', data.get('data', [])), (list, dict)) else []
    
    # Get student name from context or user object
    name = data.get('studentName')
    if not name and user:
        name = getattr(user, 'name', None) or getattr(user, 'username', 'O\'quvchi')
    if not name:
        name = 'O\'quvchi'

    schema = {
        "type": "object",
        "properties": {
            "strengths": {"type": "string"},
            "weaknesses": {"type": "string"},
            "recommendations": {"type": "string"},
            "score": {"type": "integer"}
        },
        "required": ["strengths", "weaknesses", "recommendations", "score"]
    }

    prompt = f"""
    Siz professional pedagogik tahlilchisiz. 
    Vazifangiz: [{name}] ismli o'quvchining [{category}] bo'yicha ko'rsatkichlarini CHUQUR va SHAXSIY tahlil qilish.
    
    TAHLIL TALABLARI (QAT'IY):
    1. Agarda barcha raqamlar 0 bo'lsa yoki diagramma bo'sh bo'lsa, JSON ichidagi matnlarda "{name} hali testlar ishlanmagan" deb yozing.
    2. SHAXSIY TAHLIL: O'quvchining xatolari ustida ishlash uchun aniq sabablarni ko'rsating. Shunchaki raqamlarni qaytarmang.
    3. MOTIVATSIYA: O'quvchiga ismi bilan murojaat qilib, uni ruhlantiradigan va xatolarini to'g'rilashga undaydigan professional pedagogik tavsiyalar bering.
    4. JAVOB USLUBI: Har bir bo'lim (strengths, weaknesses, recommendations) kamida 3-4 ta to'liq jumlalardan iborat bo'lishi shart. Qisqa javoblar TAQIQLANADI.
    5. TAVSIYALAR: O'quvchi uchun shaxsiylashtirilgan o'quv rejasini (aynan qaysi mavzularni o'qish kerakligi bilan) batafsil yozing.
    
    DIQQAT: Kalit so'zlarni (strengths, weaknesses, recommendations, score) O'zbekchaga tarjima qilmang! Faqat qiymatlarni O'zbekcha yozing.
    Javobni O'zbek tilida, iliq va professional pedagog tilida bering. 
    
    DIAGRAMMA NOMI: {category}
    
    ASOSIY STATISTIKA (SUMMARY):
    {json.dumps(summary)}
    
    DIAGRAMMA MA'LUMOTLARI (RAW DATA):
    {json.dumps(diagram_data)}

    QO'SHIMCHA KONTEKST (Fanlar va Harakatlar):
    {json.dumps(data.get('subjectPerformance', []))} | {json.dumps(data.get('recentActivities', []))}
    """
    
    # Fast approach: we use EducationalGuard and call_ai with Gemini Flash
    system_instruction = f"{EducationalGuard.get_system_context(role)} | {security_context}"
    return call_ai(prompt, system_instruction=system_instruction, user=user, feature="analytics", schema=schema)

def analyze_group_performance(data, user=None):
    """
    Enterprise-grade analysis for entire classes or groups.
    Computes collective strengths, pedagogical risks, and institutional recommendations.
    """
    security_context = "Siz guruh/sinf tahlilchisisiz. Ma'lumotlarni o'quvchilar o'rtasida o'zaro solishtiring."
    
    category = data.get('cardTitle', data.get('category', 'Guruh Umumiy Tahlili'))
    summary = data.get('summary', {})
    specific_data = data.get('data', [])

    schema = {
        "type": "object",
        "properties": {
            "strengths": {"type": "string"},
            "weaknesses": {"type": "string"},
            "recommendations": {"type": "string"},
            "score": {"type": "integer"}
        },
        "required": ["strengths", "weaknesses", "recommendations", "score"]
    }

    prompt = f"""
    Siz professional guruh tahlilchisiz (Pedagogik-Analitik). 
    Vazifangiz: Guruhning [{category}] bo'yicha ko'rsatkichlarini CHUQUR va MAZMUNLI tahlil qilish.
    
    TAHLIL TALABLARI (QAT'IY):
    1. Agarda barcha raqamlar 0 bo'lsa yoki ma'lumot bo'lmasa, "Guruh hali faollik ko'rsatmadi" deb yozing.
    2. CHUQUR TAHLIL: Shunchaki natijalarni sanab o'tmang. Ma'lumotlar orasidagi bog'liqlikni, guruhning o'sish yoki pasayish sabablarini tahlil qiling.
    3. KUCHLI VA ZAIF TOMONLAR: Har bir tomonni kamida 2-3 ta to'liq jumla bilan, pedagogik nuqtai nazardan tushuntiring.
    4. METODIK TAVSIYALAR: O'qituvchi uchun aynan qaysi mavzularga urg'u berish, qanday o'qitish metodikasini (masalan: interaktiv, vizual, individual) qo'llash bo'yicha aniq dars rejasi kabi batafsil maslahatlar bering.
    5. JAVOB USLUBI: Bir so'zli yoki qisqa javoblar TAQIQLANADI. Har bir bo'lim mazmunli va professional tilda bo'lishi shart.
    
    JSON FORMATI:
    - strengths (kamida 30-50 ta so'z), 
    - weaknesses (kamida 30-50 ta so'z), 
    - recommendations (batafsil metodik reja), 
    - score (0-100).

    DIQQAT: Javobni O'zbek tilida professional pedagog tilida bering. Faqat real ma'lumotlarga tayaning.
    
    GURUH MA'LUMOTLARI:
    {json.dumps(summary, indent=2, ensure_ascii=False)}

    TAHLIL UCHUN MA'LUMOTLAR ([{category}]):
    {json.dumps(specific_data, indent=2, ensure_ascii=False)}

    GURUH MEMORY (XOTIRA):
    {data.get('historical_context', 'Yangi guruh tahlili')}
    """
    
    return call_ai(prompt, system_instruction=f"{EducationalGuard.get_system_context('teacher')} | {security_context}", user=user, feature="analytics")



# Backwards compatibility with files that import call_gemini
call_gemini = call_ai

def _stream_groq(prompt, api_key, system_instruction=None, temperature=0.7, user=None, feature="chat"):
    if not Groq:
        raise Exception("Groq kutubxonasi o'rnatilmagan")
    client = Groq(api_key=api_key)
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    model_name = "llama-3.1-8b-instant" if feature in ["test_coach", "test_help", "quick_hint"] else "llama-3.3-70b-versatile"

    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
        temperature=temperature,
        stream=True
    )
    for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            yield content

def _stream_gemini(prompt, api_key, system_instruction=None, temperature=0.7, user=None):
    if not genai:
        raise Exception("Google AI kutubxonasi o'rnatilmagan")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_instruction)
    response = model.generate_content(prompt, stream=True, generation_config={"temperature": temperature})
    for chunk in response:
        if chunk.text:
            yield chunk.text

def stream_ai(prompt, system_instruction=None, temperature=0.7, user=None, feature="chat"):
    """Router for streaming AI responses with usage logging and fallback."""
    api_key = get_api_key_for_user(user)
    if not api_key:
        yield "ERROR: API key topilmadi"
        return

    if user:
        AIUsageLog.objects.create(
            user=user, 
            feature_name=f"stream_{feature}",
            prompt_tokens=len(prompt) // 4,
            total_tokens=len(prompt) // 4,
            status='streaming'
        )

    try:
        if api_key.startswith('gsk_'):
            try:
                for chunk in _stream_groq(prompt, api_key, system_instruction, temperature, user, feature=feature):
                    yield chunk
            except Exception as e:
                print(f"Groq stream error: {e}. Falling back to Gemini.")
                fallback_key = os.environ.get("GEMINI_API_KEY")
                if fallback_key:
                    for chunk in _stream_gemini(prompt, fallback_key, system_instruction, temperature, user):
                        yield chunk
                else:
                    yield f"ERROR: Groq failed: {str(e)}"
        else:
            try:
                for chunk in _stream_gemini(prompt, api_key, system_instruction, temperature, user):
                    yield chunk
            except Exception as e:
                print(f"Gemini stream error: {e}. Falling back to Groq.")
                fallback_key = os.environ.get("GROQ_API_KEY")
                if fallback_key:
                    for chunk in _stream_groq(prompt, fallback_key, system_instruction, temperature, user, feature=feature):
                        yield chunk
                else:
                    yield f"ERROR: Gemini failed: {str(e)}"
    except Exception as final_e:
        yield f"data: ERROR: {str(final_e)}\n\n"

# Maintain the old function names just in case they were directly imported somewhere
stream_groq = _stream_groq
stream_gemini = _stream_gemini
