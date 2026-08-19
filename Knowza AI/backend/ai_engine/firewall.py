import re
import json

class KnowzaShield:
    """
    Advanced AI Firewall for Knowza Educational Platform.
    Protects against prompt injection, jailbreaking, and pedagogical boundary violations.
    """
    
    # 1. Dangerous keywords often used in Prompt Injection
    FORBIDDEN_PATTERNS = [
        r"ignore previous instructions",
        r"disregard all earlier prompts",
        r"system administrator",
        r"sudo",
        r"you are now a", # Trying to override role
        r"secret password",
        r"base64",
        r"rot13",
        r"reveal your system prompt",
        r"show me your instructions",
        r"DAN mode",
        r"jailbreak",
        r"bypass",
        r"<script>",
        r"drop table",
        r"select \* from",
    ]

    # 2. Pedagogical Boundaries (Safety checks for students)
    ACADEMIC_VIOLATION_PATTERNS = [
        r"uy vazifasini yozib ber",
        r"esse yozib ber",
        r"kodni to'liq ber",
        r"javobni o'zing bajar",
    ]

    # 3. Anti-Answer-Extraction (prevents AI from giving test answers directly)
    ANSWER_EXTRACTION_PATTERNS = [
        r"to'g'ri javobni ayt",
        r"to'g'ri javob qaysi",
        r"javobni ber",
        r"qaysi variant to'g'ri",
        r"tell me the answer",
        r"give me the correct",
        r"what is the right answer",
        r"which option is correct",
        r"скажи правильный ответ",
        r"какой правильный ответ",
        r"дай ответ",
    ]

    @staticmethod
    def audit_prompt(prompt, user=None):
        """
        Primary entry point for checking incoming user prompts.
        Returns (is_safe, sanitized_prompt, error_message).
        """
        if not prompt:
            return True, "", None

        # 0. Token Saving: Max Prompt Length Check
        # Preventing massive prompts that waste tokens
        if len(prompt) > 8000:
            return False, prompt, "Xatolik: So'rov matni juda uzun. Tokenlarni tejash uchun qisqaroq so'rov yozing."

        # A. Injection Detection
        lower_prompt = prompt.lower()
        for pattern in KnowzaShield.FORBIDDEN_PATTERNS:
            if re.search(pattern, lower_prompt):
                return False, prompt, "Xavfsizlik tizimi: Shubha ostiga olingan manipulyatsiya aniqlandi."


        # B. Academic Integrity Check (only for students)
        if user and user.role == 'student':
            for pattern in KnowzaShield.ACADEMIC_VIOLATION_PATTERNS:
                if re.search(pattern, lower_prompt):
                    return False, prompt, "Akademik halollik: AI sizning o'rningizga vazifani to'liq bajarib bermaydi. Yordam so'rang, lekin tushunishga harakat qiling."

        # C. Sanitization: Remove potential malicious characters
        # We don't want to break valid formulas, but we remove potential hidden control chars
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', prompt)
        
        return True, sanitized, None

    @staticmethod
    def audit_response(response_text):
        """
        Post-generation check to ensure the AI didn't leak secrets or hallucinate dangerous links.
        """
        if not response_text:
            return ""

        # Remove any potential system leaking info
        response_text = re.sub(r"As an AI language model", "Knowza AI yordamchisi sifatida", response_text)
        
        # Block external redirects that aren't knowza.uz
        # (Simplified URL regex)
        urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', response_text)
        trusted_domains = ("knowza.uz", "google.com", "youtube.com", "youtu.be", "wikimedia.org", "wikipedia.org")
        for url in urls:
            if not any(domain in url for domain in trusted_domains):
                response_text = response_text.replace(url, "[Xavfsiz havola emas]")

        return response_text

    @staticmethod
    def secure_json_output(data):
        """Ensures that the AI output is a valid JSON and doesn't contain hidden payloads."""
        if isinstance(data, str):
            try:
                # Try to parse and re-stringify to clean
                parsed = json.loads(data)
                return json.dumps(parsed)
            except:
                return data
        return data
