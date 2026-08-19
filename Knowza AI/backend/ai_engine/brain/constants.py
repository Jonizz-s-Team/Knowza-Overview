class INTENTS:
    EXPLAIN_SIMPLE = 'explain_simple'
    EXPLAIN_DEEP = 'explain_deep'
    TEST_GEN = 'test_gen'
    SOCRATIC_COACH = 'socratic_coach'
    SIMPLIFY = 'simplify'
    DEEPEN = 'deepen'
    ARTICLE_GEN = 'article_gen'
    TEST_HELP = 'test_help'
    TEST_FEEDBACK = 'test_feedback'
    TEST_COACH = 'test_coach'
    TEST_REVIEW = 'test_review'
    TEST_REVIEW_DEEP = 'test_review_deep'

DEFAULT_INPUT_LIMIT = 16_000
DEEP_INPUT_LIMIT = 32_000
TEST_GEN_INPUT_LIMIT = 16_000
SOCRATIC_INPUT_LIMIT = 12_000
KNOWLEDGE_SNIPPET_LIMIT = 4000
DEFAULT_SYSTEM_PROMPT_LIMIT = 4000
SIMPLE_SYSTEM_PROMPT_LIMIT = 1500

QUERY_STOPWORDS = frozenset([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'about', 'between', 'but', 'and', 'or', 'not',
    'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my',
    'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'what',
    'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'if', 'then',
    'so', 'than', 'too', 'very', 'just', 'also', 'more', 'some', 'any',
    'each', 'every', 'all', 'both', 'few', 'most', 'other', 'no', 'yes',
    'va', 'yoki', 'bu', 'shu', 'u', 'o', 'bilan', 'uchun', 'da', 'ga',
    'dan', 'ni', 'ning', 'lar', 'emas', 'ham', 'bo\'lsa', 'kerak',
    'mumkin', 'lekin', 'ammo', 'chunki', 'agar', 'qanday', 'nima',
    'kim', 'qayerda', 'qachon', 'hamma', 'har', 'bir',
    'men', 'sen', 'biz', 'siz', 'ular', 'uning', 'mening', 'bizning',
    'и', 'в', 'на', 'не', 'что', 'он', 'она', 'они', 'это', 'как',
    'но', 'или', 'да', 'из', 'за', 'то', 'по', 'к', 'от', 'до',
    'с', 'у', 'о', 'же', 'бы', 'вот', 'уже', 'ну', 'ли', 'мне',
    'его', 'её', 'их', 'мы', 'вы', 'я', 'ты', 'все', 'был', 'была',
    'были', 'быть', 'есть', 'для', 'при', 'так', 'тоже', 'только',
])

INJECTION_KEYWORDS = [
    'ignore previous', 'ignore all instructions', 'forget everything',
    'you are now', 'act as', 'pretend to be', 'new instructions',
    'disregard', 'override', 'bypass', 'jailbreak', 'DAN mode',
    'developer mode', 'god mode', 'sudo mode',
    'oldingi ko\'rsatmalarni unutgin', 'siz endi',
    'игнорируй предыдущие', 'забудь все', 'новые инструкции',
    'ты теперь', 'режим разработчика',
]

COMPLEX_INDICATORS = [
    'explain', 'describe', 'compare', 'analyze', 'solve', 'prove',
    'calculate', 'derive', 'demonstrate', 'step by step',
    'tushuntir', 'taqqosla', 'tahlil', 'yech', 'isbotla', 'hisob',
    'ko\'rsatib ber', 'qadam', 'bosqichma', 'formula', 'misollar',
    'объясни', 'сравни', 'анализ', 'реши', 'докажи', 'вычисли',
    'пошагово', 'формула', 'примеры',
]

DEEP_INDICATORS = [
    'detail', 'in depth', 'comprehensive', 'thoroughly', 'advanced',
    'batafsil', 'chuqur', 'kengaytirilgan', 'to\'liq', 'ilg\'or',
    'подробно', 'глубоко', 'расширенно', 'полностью', 'продвинутый',
]
