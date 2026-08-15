import json
import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import F, Q
from api.models import FlashCard, FlashCardDeck
from api.ai_engine.cognitive_pedagogy import SpacedRepetitionScheduler
from api.ai_engine.utils import call_ai
from pydantic import BaseModel
from typing import List

logger = logging.getLogger(__name__)

class CardGenModel(BaseModel):
    front: str
    back: str
    hint: str
    example_sentence: str

class CardsListModel(BaseModel):
    cards: List[CardGenModel]

def review_card(card_id: int, quality: int):
    """
    Apply SM-2 algorithm to update card's EF, interval, next_review_date based on quality (0-5).
    Quality 0-2 = reset to start, 3-5 = advance interval.
    Uses SpacedRepetitionScheduler.calculate_next_review().
    """
    card = FlashCard.objects.get(id=card_id)
    
    # Map quality to failure_count and success_count for the scheduler
    if quality < 3:
        # Failure
        success_count = 0
        failure_count = max(1, 3 - quality)
        card.repetition_count = 0
    else:
        # Success
        success_count = card.repetition_count + 1
        failure_count = 0
        card.repetition_count += 1
        
    interval, ef = SpacedRepetitionScheduler.calculate_next_review(
        failure_count=failure_count,
        success_count=success_count,
        last_ease_factor=card.easiness_factor
    )
    
    card.interval_days = interval
    card.easiness_factor = ef
    card.last_quality = quality
    card.last_reviewed_at = timezone.now()
    card.next_review_date = timezone.now().date() + timedelta(days=interval)
    
    # Check if mastered (interval > 21 days and EF > 2.3)
    if card.interval_days > 21 and card.easiness_factor > 2.3:
        card.is_mastered = True
    else:
        card.is_mastered = False
        
    card.save()
    
    # Update deck mastery
    update_deck_mastery(card.deck_id)
    
    return card

def get_due_cards(user, deck_id=None, limit=20):
    """
    Get cards due for review.
    - If deck_id is given: return ALL cards in that deck (so user can review full deck)
    - Otherwise: return only cards due today across all decks
    """
    if deck_id:
        # Return all cards in the specified deck for full-deck review
        cards = FlashCard.objects.filter(
            deck__user=user, deck_id=deck_id
        ).order_by('next_review_date', 'easiness_factor')[:limit]
    else:
        today = timezone.now().date()
        # Due today OR never reviewed (next_review_date is today or null)
        query = Q(deck__user=user) & (
            Q(next_review_date__lte=today) | Q(next_review_date__isnull=True)
        )
        cards = FlashCard.objects.filter(query).order_by('next_review_date', 'easiness_factor')[:limit]
    return cards

def normalize_card(raw):
    """
    Normalize a card dict regardless of what field names the AI used.
    Maps common aliases -> canonical: front, back, hint, example_sentence
    """
    if not isinstance(raw, dict):
        return None
    
    # front
    front = raw.get('front') or raw.get('word') or raw.get('term') or raw.get('question') or ''
    if isinstance(front, dict):
        front = ' / '.join(str(v) for v in front.values())
    
    # back
    back = (
        raw.get('back') or raw.get('ozbekcha_tarjimasi') or raw.get('translation') or
        raw.get('answer') or raw.get('definition') or raw.get('tarjima') or
        raw.get('meaning') or raw.get('formula') or ''
    )
    if isinstance(back, dict):
        back = ' / '.join(str(v) for v in back.values())
    
    # hint
    hint = raw.get('hint') or raw.get('maslahat') or raw.get('tip') or raw.get('note') or ''
    if isinstance(hint, dict):
        hint = ' / '.join(str(v) for v in hint.values())
    
    # example_sentence
    example_sentence = (
        raw.get('example_sentence') or raw.get('example') or raw.get('misol') or
        raw.get('sentence') or raw.get('misol_gap') or ''
    )
    if isinstance(example_sentence, dict):
        example_sentence = ' / '.join(str(v) for v in example_sentence.values())
    
    if not front and not back:
        return None
    
    return {
        'front': str(front).strip(),
        'back': str(back).strip(),
        'hint': str(hint).strip(),
        'example_sentence': str(example_sentence).strip(),
    }


def generate_cards_for_topic(user, exam_type: str, topic: str, deck_type: str = 'vocabulary', count: int = 10):
    """
    Use AI to generate flashcards.
    Returns list of normalized dicts with keys: front, back, hint, example_sentence
    """
    # Build strict prompt that specifies EXACT JSON field names
    system_instruction = (
        "Sen aqlli flashcard generatorisan. "
        "FAQAT quyidagi qat'iy JSON formatida javob ber, BOSHQA HECH NARSA YO'Q:\n"
        "{\n"
        '  "cards": [\n'
        "    {\n"
        '      "front": "inglizcha so\'z yoki tushuncha",\n'
        '      "back": "o\'zbekcha tarjimasi yoki ta\'rif",\n'
        '      "hint": "qisqa maslahat yoki eslatma",\n'
        '      "example_sentence": "misolda ishlatilgan gap"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "MUHIM: Faqat 'front', 'back', 'hint', 'example_sentence' maydonlarini ishlatgin. "
        "Boshqa maydon nomlarini ISHLATMA. JSON formatini buzmаgin."
    )

    if exam_type.lower() in ['ielts', 'foundation']:
        context = f"IELTS Academy darsi uchun '{topic}' mavzusida {count} ta lug'at kartochkasi yaratgin. front=inglizcha so'z, back=o'zbekcha tarjima, hint=qisqa eslatma, example_sentence=inglizcha misol gap."
    elif exam_type.lower() == 'sat':
        if deck_type.lower() == 'formula':
            context = f"SAT Math uchun '{topic}' mavzusida {count} ta formula kartochkasi yaratgin. front=formula nomi, back=formula ifodasi, hint=eslatma, example_sentence=misol."
        else:
            context = f"SAT uchun '{topic}' mavzusida {count} ta lug'at kartochkasi yaratgin. front=inglizcha so'z, back=o'zbekcha tarjima, hint=qisqa eslatma, example_sentence=inglizcha misol gap."
    else:
        context = f"'{topic}' mavzusida {count} ta kartochka yaratgin. front=tushuncha/savol, back=ta'rif/javob, hint=eslatma, example_sentence=misol."

    result = call_ai(
        prompt=context,
        system_instruction=system_instruction,
        user=user,
        feature="card_gen",
        pydantic_model=None,  # Don't validate with pydantic — we do it manually
    )

    cards = []

    # Try to extract cards from result
    raw_list = None

    if isinstance(result, dict):
        raw_list = result.get('cards')
    elif isinstance(result, str):
        # Try to parse raw JSON string
        try:
            import json as _json
            parsed = _json.loads(result)
            if isinstance(parsed, dict):
                raw_list = parsed.get('cards')
            elif isinstance(parsed, list):
                raw_list = parsed
        except Exception:
            pass

    if raw_list:
        for raw in raw_list:
            normalized = normalize_card(raw)
            if normalized:
                cards.append(normalized)

    if not cards:
        if 'sat' in exam_type.lower():
            cards = [
                {"front": "Quadratic Formula", "back": "x = (-b ± √(b² - 4ac)) / (2a)", "hint": "Tenglamaning ildizlarini topish formulasi", "example_sentence": "Use the quadratic formula to solve ax² + bx + c = 0."},
                {"front": "Sentence Equivalence", "back": "Ma'nodosh so'zlarni topish", "hint": "Kontekstual ma'no", "example_sentence": "Choose two options that complete the sentence equivalently."},
                {"front": "Pragmatic", "back": "Amaliy, real voqelikka asoslangan", "hint": "Practical approach", "example_sentence": "She took a pragmatic approach to solving the problem."},
                {"front": "Meticulous", "back": "Juda sinchkov, qunt bilan ishlaydigan", "hint": "Extremely careful", "example_sentence": "He was meticulous about keeping his records clean."},
                {"front": "Hypothesis", "back": "Gipoteza, taxminiy ilmiy nazariya", "hint": "Proposed explanation", "example_sentence": "The scientific hypothesis was tested through experiments."}
            ]
        elif 'milliy' in exam_type.lower() or 'ms' in exam_type.lower():
            cards = [
                {"front": "Tenglamalar sistemasi", "back": "Ikki yoki undan ortiq o'zgaruvchili tenglamalar majmuasi", "hint": "O'rniga qo'yish yoki qo'shish usuli", "example_sentence": "Tenglamalar sistemasini yechishda o'zgaruvchilardan birini yo'qotamiz."},
                {"front": "Akkusativ kelshik", "back": "Tushum kelishigi (-ni qo'shimchasi)", "hint": "Kimni? Nimani? savollari", "example_sentence": "Kitobni o'qidim gapida kitobni tushum kelishigida."},
                {"front": "Fonetik tahlil", "back": "Unli va undosh tovushlar tavsifi", "hint": "Jarangli va jarangsiz undoshlar", "example_sentence": "So'zning fonetik tahlili uning tovush tarkibini ko'rsatadi."},
                {"front": "Sintez va Analiz", "back": "Tahlil qilish va umumlashtirish usuli", "hint": "Mantiqiy fikrlash usuli", "example_sentence": "Muammoni hal qilishda analiz va sintez muhimdir."},
                {"front": "Morfema", "back": "So'zning eng kichik ma'noli qismi (o'zak yoki qo'shimcha)", "hint": "O'zak va qo'shimchalar", "example_sentence": "O'zak morfema so'zning asosiy ma'nosini tashuvchi qismidir."}
            ]
        else:
            cards = [
                {"front": "Substantial", "back": "Salmoqli, katta miqdordagi, muhim", "hint": "Considerable amount", "example_sentence": "There was a substantial increase in population last year."},
                {"front": "Plausible", "back": "Ishonchli, mantiqan to'g'ri ko'ringan", "hint": "Reasonable or probable", "example_sentence": "His explanation sounded plausible to the committee."},
                {"front": "Mitigate", "back": "Yumshatmoq, ta'sirini kamaytirmoq", "hint": "Make less severe", "example_sentence": "Measures were taken to mitigate the effects of climate change."},
                {"front": "Comprehensive", "back": "Har tomonlama, to'liq, qamrovli", "hint": "Complete and thorough", "example_sentence": "The report provides a comprehensive study of the issue."},
                {"front": "Crucial", "back": "Juda muhim, hal qiluvchi ahamiyatga ega", "hint": "Extremely important", "example_sentence": "Good communication is crucial for business success."}
            ]

    return cards

def create_deck_with_cards(user, exam_type: str, title: str, topic: str, deck_type: str, cards_data: list):
    """
    Create a new deck and bulk-create cards.
    Always normalizes card fields through normalize_card to handle any AI output format.
    """
    deck = FlashCardDeck.objects.create(
        user=user,
        exam_type=exam_type,
        title=title,
        title_uz=title,
        deck_type=deck_type,
        subject=topic,
        card_count=len(cards_data),
        is_ai_generated=True
    )

    flashcards = []
    for data in cards_data:
        # Normalize to canonical keys regardless of AI output format
        if isinstance(data, dict):
            normalized = normalize_card(data) or data
        else:
            # Pydantic model or object
            normalized = {
                'front': getattr(data, 'front', ''),
                'back': getattr(data, 'back', ''),
                'hint': getattr(data, 'hint', ''),
                'example_sentence': getattr(data, 'example_sentence', ''),
            }

        front = str(normalized.get('front', '') or '').strip()
        back = str(normalized.get('back', '') or '').strip()
        hint = str(normalized.get('hint', '') or '').strip()
        example_sentence = str(normalized.get('example_sentence', '') or '').strip()

        if not front and not back:
            continue  # skip empty cards

        flashcards.append(FlashCard(
            deck=deck,
            front=front,
            back=back,
            hint=hint,
            example_sentence=example_sentence,
            topic=topic
        ))

    if flashcards:
        FlashCard.objects.bulk_create(flashcards)

    # Update deck card_count to actual created count
    deck.card_count = len(flashcards)
    deck.save(update_fields=['card_count'])

    # Update deck mastery and card_count properly
    update_deck_mastery(deck.id)

    return deck

def update_deck_mastery(deck_id: int):
    """
    Recalculate deck mastery_percent based on card states 
    (cards with interval > 21 days and EF > 2.3 = mastered).
    """
    deck = FlashCardDeck.objects.get(id=deck_id)
    total_cards = deck.cards.count()
    if total_cards == 0:
        deck.mastery_percent = 0.0
        deck.card_count = 0
        deck.save()
        return deck
        
    # A card is mastered if interval > 21 days and EF > 2.3
    mastered_count = deck.cards.filter(interval_days__gt=21, easiness_factor__gt=2.3).count()
    
    mastery_percent = (mastered_count / total_cards) * 100.0
    deck.mastery_percent = round(mastery_percent, 2)
    deck.card_count = total_cards
    deck.save()
    
    return deck

def get_deck_stats(deck_id: int):
    """
    Return stats: total cards, mastered, learning, new, due today.
    """
    deck = FlashCardDeck.objects.get(id=deck_id)
    cards = deck.cards.all()
    total_cards = cards.count()
    
    mastered = cards.filter(interval_days__gt=21, easiness_factor__gt=2.3).count()
    new = cards.filter(repetition_count=0, interval_days=0).count()
    learning = total_cards - mastered - new
    
    today = timezone.now().date()
    due_today = cards.filter(next_review_date__lte=today).count()
    
    return {
        'total_cards': total_cards,
        'mastered': mastered,
        'learning': learning,
        'new': new,
        'due_today': due_today,
        'mastery_percent': deck.mastery_percent
    }
