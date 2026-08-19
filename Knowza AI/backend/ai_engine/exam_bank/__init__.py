"""
Exam Bank - Professional quality sample exam questions for IELTS, SAT, and Milliy Sertifikat.

This module provides:
1. Few-shot examples for AI test generation (teaches AI the exact format)
2. Stable reference data for consistent test quality
3. Section/domain/difficulty-aware question sampling
"""
import json
import os
import random
from typing import List, Dict, Optional

_BANK_DIR = os.path.dirname(__file__)
_CACHE = {}


def _load_bank(filename: str) -> list:
    """Load and cache a JSON exam bank file."""
    if filename in _CACHE:
        return _CACHE[filename]
    filepath = os.path.join(_BANK_DIR, filename)
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    _CACHE[filename] = data
    return data


def get_sat_examples(
    domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    section_type: Optional[str] = None,
    count: int = 5
) -> List[Dict]:
    """
    Get SAT example questions filtered by domain/difficulty/type.
    Used as few-shot examples in AI prompts.
    """
    bank = _load_bank('sat_examples.json')
    filtered = bank

    if section_type:
        st = section_type.lower()
        filtered = [q for q in filtered if q.get('type', '').lower().startswith(st[:4])]

    if domain:
        d = domain.lower()
        filtered = [q for q in filtered if d in q.get('domain', '').lower()]

    if difficulty:
        diff = difficulty.lower()
        filtered = [q for q in filtered if q.get('difficulty', '').lower() == diff]

    if len(filtered) > count:
        filtered = random.sample(filtered, count)
    
    return filtered


def get_ielts_examples(
    section: Optional[str] = None,
    question_type: Optional[str] = None,
    band_level: Optional[str] = None,
    count: int = 5
) -> List[Dict]:
    """
    Get IELTS example questions filtered by section/type/band.
    Used as few-shot examples in AI prompts.
    """
    bank = _load_bank('ielts_examples.json')
    filtered = bank

    if section:
        s = section.lower()
        filtered = [q for q in filtered if q.get('section', '').lower() == s]

    if question_type:
        qt = question_type.lower()
        filtered = [q for q in filtered if qt in q.get('question_type', '').lower()]

    if band_level:
        filtered = [q for q in filtered if band_level in q.get('band_level', '')]

    if len(filtered) > count:
        filtered = random.sample(filtered, count)
    
    return filtered


def get_ms_examples(
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    count: int = 5
) -> List[Dict]:
    """
    Get Milliy Sertifikat / DTM example questions filtered by subject/difficulty.
    Used as few-shot examples in AI prompts.
    """
    bank = _load_bank('ms_examples.json')
    filtered = bank

    if subject:
        sub = subject.lower()
        filtered = [q for q in filtered if sub in q.get('subject', '').lower()]

    if difficulty:
        diff = difficulty.lower()
        filtered = [q for q in filtered if q.get('difficulty', '').lower() == diff]

    if len(filtered) > count:
        filtered = random.sample(filtered, count)
    
    return filtered or bank[:count]


def get_exam_bank_summary(exam_type: str) -> str:
    """
    Get a text summary of available exam bank content for a given exam type.
    Useful for prompt context injection.
    """
    if exam_type.lower() == 'sat':
        bank = _load_bank('sat_examples.json')
        if not bank:
            return "SAT exam bank not available."
        
        domains = {}
        for q in bank:
            d = q.get('domain', 'Other')
            t = q.get('type', 'Other')
            key = f"{t} > {d}"
            domains[key] = domains.get(key, 0) + 1
        
        summary = "SAT Exam Bank Contents:\n"
        for key, count in sorted(domains.items()):
            summary += f"  - {key}: {count} questions\n"
        return summary

    elif exam_type.lower() == 'ielts':
        bank = _load_bank('ielts_examples.json')
        if not bank:
            return "IELTS exam bank not available."
        
        sections = {}
        for q in bank:
            s = q.get('section', 'Other')
            qt = q.get('question_type', 'General')
            key = f"{s} > {qt}"
            sections[key] = sections.get(key, 0) + 1
        
        summary = "IELTS Exam Bank Contents:\n"
        for key, count in sorted(sections.items()):
            summary += f"  - {key}: {count} questions\n"
        return summary

    elif exam_type.lower() in ('ms', 'milliy', 'milliy sertifikat', 'dtm'):
        bank = _load_bank('ms_examples.json')
        if not bank:
            return "Milliy Sertifikat exam bank not available."
        
        subjects = {}
        for q in bank:
            s = q.get('subject', 'General')
            subjects[s] = subjects.get(s, 0) + 1
        
        summary = "Milliy Sertifikat Exam Bank Contents:\n"
        for key, count in sorted(subjects.items()):
            summary += f"  - {key}: {count} questions\n"
        return summary
    
    return ""


def format_examples_for_prompt(examples: list, max_examples: int = 3) -> str:
    """
    Format exam bank examples into a string suitable for prompt injection
    as few-shot examples.
    """
    if not examples:
        return ""
    
    selected = examples[:max_examples]
    
    output = "# FEW-SHOT EXAMPLES (use EXACTLY this format and quality level):\n"
    output += "```json\n"
    output += json.dumps(selected, ensure_ascii=False, indent=2)
    output += "\n```\n"
    output += "\nIMPORTANT: Your generated questions MUST match this exact JSON structure "
    output += "and be AT LEAST as detailed and professional as these examples. "
    output += "Do NOT use generic placeholder text — every question must be substantive and realistic.\n"
    
    return output
