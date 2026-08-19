from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class Skill:
    name: str
    name_uz: str
    weight: float
    topics: Tuple[str, ...]


@dataclass(frozen=True)
class Section:
    name: str
    name_uz: str
    weight: float
    daily_ratio: float
    skills: Tuple[Skill, ...]


@dataclass(frozen=True)
class BandDescriptor:
    label: str
    min_score: float
    max_score: float
    description: str
    description_uz: str
    level: str


@dataclass(frozen=True)
class ExamConfig:
    exam_type: str
    display_name: str
    display_name_uz: str
    min_score: float
    max_score: float
    score_step: float
    median_score: float
    base_hours_per_unit: float
    difficulty_exponent: float
    sections: Tuple[Section, ...]
    bands: Tuple[BandDescriptor, ...]
    total_questions: int
    exam_duration_minutes: int


IELTS_LISTENING_SKILLS = (
    Skill("Main Idea Comprehension", "Asosiy g'oyani tushunish", 0.25,
          ("Conversation context", "Speaker attitude", "Main purpose identification")),
    Skill("Detail Extraction", "Tafsilotlarni ajratib olish", 0.30,
          ("Names and dates", "Numbers and prices", "Addresses and locations", "Sequences")),
    Skill("Speaker Intent", "So'zlovchi maqsadini anglash", 0.20,
          ("Opinion recognition", "Agreement/disagreement", "Suggestion identification")),
    Skill("Keyword Synonyms", "Kalit so'z sinonimlarini payqash", 0.25,
          ("Paraphrasing detection", "Synonym matching", "Contextual word meaning")),
)

IELTS_READING_SKILLS = (
    Skill("Main Idea", "Asosiy g'oyani aniqlash", 0.20,
          ("Central theme", "Author purpose", "Main argument")),
    Skill("Detail Understanding", "Tafsilotlarni tushunish", 0.25,
          ("Specific information", "Facts and evidence", "Supporting details")),
    Skill("Skimming and Scanning", "Skimming va Scanning", 0.20,
          ("Quick overview reading", "Keyword location", "Section identification")),
    Skill("Inference", "Xulosa chiqarish", 0.15,
          ("Logical deduction", "Implied meaning", "Author stance")),
    Skill("Vocabulary in Context", "Kontekstdagi lug'at", 0.20,
          ("Word meaning from context", "Academic vocabulary", "Collocations")),
)

IELTS_WRITING_SKILLS = (
    Skill("Task Achievement", "Topshiriq bajarilishi", 0.25,
          ("Task 1 data description", "Task 2 argument development", "Word count adherence")),
    Skill("Coherence and Cohesion", "Izchillik va bog'lanish", 0.25,
          ("Paragraph organization", "Linking words", "Logical flow")),
    Skill("Lexical Resource", "Lug'at boyligi", 0.25,
          ("Academic vocabulary", "Collocations", "Paraphrasing ability")),
    Skill("Grammatical Range", "Grammatik xilma-xillik", 0.25,
          ("Complex sentences", "Tense accuracy", "Conditional structures", "Relative clauses")),
)

IELTS_SPEAKING_SKILLS = (
    Skill("Fluency and Coherence", "Ravonlik va izchillik", 0.25,
          ("Continuous speech", "Self-correction", "Topic development")),
    Skill("Lexical Resource", "Lug'at boyligi", 0.25,
          ("Idiomatic expressions", "Topic-specific vocabulary", "Paraphrasing")),
    Skill("Grammatical Range", "Grammatik xilma-xillik", 0.25,
          ("Complex structures", "Conditional forms", "Modal verbs")),
    Skill("Pronunciation", "Talaffuz", 0.25,
          ("Stress patterns", "Intonation", "Connected speech", "Individual sounds")),
)

IELTS_CONFIG = ExamConfig(
    exam_type="IELTS",
    display_name="IELTS (International English Language Testing System)",
    display_name_uz="IELTS — Xalqaro ingliz tili bilim tizimi",
    min_score=0.0,
    max_score=9.0,
    score_step=0.5,
    median_score=6.0,
    base_hours_per_unit=120.0,
    difficulty_exponent=2.2,
    sections=(
        Section("Listening", "Tinglash", 0.25, 0.20, IELTS_LISTENING_SKILLS),
        Section("Reading", "O'qish", 0.25, 0.25, IELTS_READING_SKILLS),
        Section("Writing", "Yozish", 0.25, 0.30, IELTS_WRITING_SKILLS),
        Section("Speaking", "Gapirish", 0.25, 0.25, IELTS_SPEAKING_SKILLS),
    ),
    bands=(
        BandDescriptor("Non-user", 0.0, 1.0, "No assessable ability", "Baholab bo'lmaydigan daraja", "zero"),
        BandDescriptor("Intermittent", 1.0, 2.0, "Great difficulty understanding", "Tushunishda katta qiyinchilik", "zero"),
        BandDescriptor("Extremely Limited", 2.0, 3.0, "Only general meaning conveyed", "Faqat umumiy ma'no tushuniladi", "zero"),
        BandDescriptor("Limited", 3.0, 3.5, "Basic competence limited to familiar situations", "Tanish holatlardagina cheklangan", "beginner"),
        BandDescriptor("Limited User", 3.5, 4.5, "Frequent problems in understanding and expression", "Tushunish va ifodalashda tez-tez muammolar", "beginner"),
        BandDescriptor("Modest User", 4.5, 5.0, "Partial command, copes with overall meaning", "Qisman nazorat, umumiy ma'noni tushunadi", "elementary"),
        BandDescriptor("Competent User", 5.0, 6.0, "Generally effective but inaccuracies occur", "Umuman samarali, lekin noaniqliklar mavjud", "intermediate"),
        BandDescriptor("Good User", 6.0, 7.0, "Operational command with occasional errors", "Operatsion nazorat, vaqti-vaqti bilan xatolar", "upper_intermediate"),
        BandDescriptor("Very Good User", 7.0, 8.0, "Full operational command, rare errors", "To'liq operatsion nazorat, kam xatolar", "advanced"),
        BandDescriptor("Expert User", 8.0, 9.0, "Full command, rare unsystematic inaccuracies", "To'liq nazorat, juda kam noaniqliklar", "expert"),
        BandDescriptor("Expert", 9.0, 9.0, "Fully operational command", "Mukammal nazorat", "expert"),
    ),
    total_questions=80,
    exam_duration_minutes=170,
)


SAT_RW_SKILLS = (
    Skill("Central Ideas", "Asosiy g'oyalar", 0.20,
          ("Main idea identification", "Author purpose", "Summary skills")),
    Skill("Vocabulary in Context", "Kontekstdagi lug'at", 0.15,
          ("Word meaning", "Connotation", "Precise word choice")),
    Skill("Evidence Analysis", "Dalillarni tahlil qilish", 0.15,
          ("Supporting evidence", "Rhetorical synthesis", "Data interpretation")),
    Skill("Grammar and Punctuation", "Grammatika va punktuatsiya", 0.25,
          ("Subject-verb agreement", "Pronoun clarity", "Comma usage", "Semicolons", "Apostrophes")),
    Skill("Text Structure", "Matn tuzilishi", 0.25,
          ("Transitions", "Paragraph organization", "Logical sequencing", "Rhetorical purpose")),
)

SAT_MATH_SKILLS = (
    Skill("Algebra", "Algebra", 0.35,
          ("Linear equations", "Systems of equations", "Inequalities", "Linear functions", "Polynomial operations")),
    Skill("Advanced Math", "Murakkab matematika", 0.25,
          ("Quadratic equations", "Exponential functions", "Rational expressions", "Factoring")),
    Skill("Problem Solving & Data Analysis", "Masala yechish va data tahlili", 0.25,
          ("Statistics", "Probability", "Percentages", "Ratios", "Graphs and tables")),
    Skill("Geometry & Trigonometry", "Geometriya va Trigonometriya", 0.15,
          ("Triangles", "Circles", "Volume and area", "Trigonometric ratios", "Coordinate geometry")),
)

SAT_CONFIG = ExamConfig(
    exam_type="SAT",
    display_name="SAT (Scholastic Assessment Test)",
    display_name_uz="SAT — Akademik baholash testi",
    min_score=400,
    max_score=1600,
    score_step=10,
    median_score=1050,
    base_hours_per_unit=0.18,
    difficulty_exponent=1.6,
    sections=(
        Section("Reading and Writing", "O'qish va Yozish", 0.5, 0.45, SAT_RW_SKILLS),
        Section("Math", "Matematika", 0.5, 0.55, SAT_MATH_SKILLS),
    ),
    bands=(
        BandDescriptor("Below Average", 400, 800, "Significant skill gaps", "Jiddiy bilim bo'shliqlari", "beginner"),
        BandDescriptor("Below Average", 800, 1000, "Foundational understanding with gaps", "Asosiy tushunchalar, bo'shliqlar bilan", "elementary"),
        BandDescriptor("Average", 1000, 1200, "Adequate skills for many colleges", "Ko'p universitetlar uchun yetarli", "intermediate"),
        BandDescriptor("Above Average", 1200, 1400, "Strong skills, competitive applications", "Kuchli ko'nikmalar, raqobatbardosh", "upper_intermediate"),
        BandDescriptor("Excellent", 1400, 1530, "Very strong, top-tier competitive", "Juda kuchli, eng yaxshilar qatorida", "advanced"),
        BandDescriptor("Outstanding", 1530, 1600, "Near-perfect, elite-level mastery", "Deyarli mukammal, eng yuqori daraja", "expert"),
    ),
    total_questions=98,
    exam_duration_minutes=134,
)


MS_MAJOR_SKILLS = (
    Skill("Closed-ended Tests", "Yopiq testlar", 0.35,
          ("Multiple choice", "Single answer", "Quick problem solving")),
    Skill("Short Open-ended", "Qisqa ochiq testlar", 0.40,
          ("Numerical answers", "One-word answers", "Short calculations")),
    Skill("Detailed Open-ended", "Batafsil ochiq testlar", 0.25,
          ("Step-by-step solutions", "Proof writing", "Extended calculations")),
)

MS_MANDATORY_SKILLS = (
    Skill("Closed-ended Tests", "Yopiq testlar", 0.40,
          ("Multiple choice", "Matching", "True/False")),
    Skill("Open-ended", "Ochiq testlar", 0.35,
          ("Short answers", "Definitions", "Explanations")),
    Skill("Written Assignment", "Yozma topshiriq", 0.25,
          ("Text analysis", "Creative writing", "Essay/summary")),
)

MS_CONFIG = ExamConfig(
    exam_type="MS",
    display_name="Milliy Sertifikat (National Certificate of Uzbekistan)",
    display_name_uz="Milliy Sertifikat — O'zbekiston milliy sertifikati",
    min_score=0,
    max_score=100,
    score_step=1,
    median_score=50,
    base_hours_per_unit=2.0,
    difficulty_exponent=1.4,
    sections=(
        Section("Asosiy Fan (Major)", "Asosiy Fan", 0.70, 0.65, MS_MAJOR_SKILLS),
        Section("Majburiy Fanlar (Mandatory)", "Majburiy Fanlar", 0.30, 0.35, MS_MANDATORY_SKILLS),
    ),
    bands=(
        BandDescriptor("Below Threshold", 0, 46, "Below certification threshold", "Sertifikat chegarasidan past", "beginner"),
        BandDescriptor("C", 46, 50, "Minimum certification", "Minimal sertifikat", "elementary"),
        BandDescriptor("C+", 50, 55, "Basic certification", "Asosiy sertifikat", "elementary"),
        BandDescriptor("B", 55, 60, "Moderate certification", "O'rtacha sertifikat", "intermediate"),
        BandDescriptor("B+", 60, 65, "Good certification — teacher salary bonus eligible", "Yaxshi sertifikat — ustama maosh uchun yaroqli", "upper_intermediate"),
        BandDescriptor("A", 65, 70, "Excellent — maximum university score", "A'lo — universitetga maksimal ball", "advanced"),
        BandDescriptor("A+", 70, 100, "Outstanding — maximum university score", "Eng yuqori — universitetga maksimal ball", "expert"),
    ),
    total_questions=45,
    exam_duration_minutes=180,
)


IELTS_HOURS_MATRIX: Dict[str, Dict[str, float]] = {
    "3.0": {"4.0": 100, "4.5": 150, "5.0": 250, "5.5": 350, "6.0": 500, "6.5": 700, "7.0": 950, "7.5": 1250, "8.0": 1600, "8.5": 2000, "9.0": 2500},
    "3.5": {"4.0": 50,  "4.5": 100, "5.0": 200, "5.5": 300, "6.0": 450, "6.5": 650, "7.0": 900, "7.5": 1200, "8.0": 1550, "8.5": 1950, "9.0": 2450},
    "4.0": {"4.5": 80,  "5.0": 150, "5.5": 250, "6.0": 400, "6.5": 600, "7.0": 850, "7.5": 1150, "8.0": 1500, "8.5": 1900, "9.0": 2400},
    "4.5": {"5.0": 100, "5.5": 200, "6.0": 350, "6.5": 550, "7.0": 800, "7.5": 1100, "8.0": 1450, "8.5": 1850, "9.0": 2350},
    "5.0": {"5.5": 120, "6.0": 270, "6.5": 470, "7.0": 720, "7.5": 1020, "8.0": 1370, "8.5": 1770, "9.0": 2270},
    "5.5": {"6.0": 150, "6.5": 350, "7.0": 600, "7.5": 900, "8.0": 1250, "8.5": 1650, "9.0": 2150},
    "6.0": {"6.5": 200, "7.0": 450, "7.5": 750, "8.0": 1100, "8.5": 1500, "9.0": 2000},
    "6.5": {"7.0": 250, "7.5": 550, "8.0": 900, "8.5": 1300, "9.0": 1800},
    "7.0": {"7.5": 300, "8.0": 650, "8.5": 1050, "9.0": 1550},
    "7.5": {"8.0": 350, "8.5": 750, "9.0": 1250},
    "8.0": {"8.5": 400, "9.0": 900},
    "8.5": {"9.0": 500},
}


MS_SUBJECTS = {
    "Matematika": {
        "topics": (
            "Sonlar nazariyasi", "Algebraik ifodalar", "Tenglamalar va tengsizliklar",
            "Funksiyalar va grafiklar", "Geometriya asoslari", "Trigonometriya",
            "Kombinatorika va ehtimollik", "Ketma-ketliklar", "Limitlar",
            "Hosilalar", "Integrallar", "Stereometriya",
        ),
        "closed_ratio": 0.44,
        "open_short_ratio": 0.51,
        "open_detailed_ratio": 0.05,
    },
    "Ona tili va adabiyot": {
        "topics": (
            "Fonetika", "Leksikologiya", "Morfologiya",
            "Sintaksis", "Imlo qoidalari", "Tinish belgilari",
            "Adabiy turlar va janrlar", "Matn tahlili", "Esse yozish",
            "Ijodiy yozish", "Adabiy asarlar tahlili", "So'z san'ati",
        ),
        "closed_ratio": 0.71,
        "open_short_ratio": 0.22,
        "open_detailed_ratio": 0.07,
    },
    "Biologiya": {
        "topics": (
            "Sitologiya", "Genetika", "Anatomiya",
            "Botanika", "Zoologiya", "Evolyutsiya nazariyasi",
            "Ekologiya", "Mikrobiologiya", "Fiziologiya",
            "Gistologiya", "Biokimyo", "Biofizika",
        ),
        "closed_ratio": 0.50,
        "open_short_ratio": 0.40,
        "open_detailed_ratio": 0.10,
    },
    "Kimyo": {
        "topics": (
            "Atom tuzilishi", "Kimyoviy bog'lanishlar", "Noorganik kimyo",
            "Organik kimyo", "Oksidlanish-qaytarilish", "Elektrolitik dissotsiatsiya",
            "Tezlik va muvozanat", "Miqdoriy hisoblashlar", "Eritmalar kimyosi",
            "Kimyoviy termodinamika", "Polimer kimyosi", "Amaliy kimyo",
        ),
        "closed_ratio": 0.45,
        "open_short_ratio": 0.40,
        "open_detailed_ratio": 0.15,
    },
    "Fizika": {
        "topics": (
            "Mexanika", "Termodinamika", "Elektrostatika",
            "Magnit maydoni", "Optika", "Atom fizikasi",
            "Yadro fizikasi", "Tebranishlar va to'lqinlar", "O'zgaruvchan tok",
            "Kvant fizikasi", "Nisbiylik nazariyasi", "Zamonaviy fizika",
        ),
        "closed_ratio": 0.45,
        "open_short_ratio": 0.45,
        "open_detailed_ratio": 0.10,
    },
    "Tarix": {
        "topics": (
            "Qadimgi dunyo tarixi", "O'rta asrlar tarixi", "Yangi davr tarixi",
            "Eng yangi davr tarixi", "O'zbekiston qadimgi tarixi", "O'zbekiston o'rta asrlar tarixi",
            "O'zbekiston yangi va eng yangi tarixi", "Mustaqillik tarixi",
            "Xaritalar bilan ishlash", "Kronologik tartiblash", "Vizual testlar",
            "Tarixiy hujjatlar tahlili",
        ),
        "closed_ratio": 0.55,
        "open_short_ratio": 0.35,
        "open_detailed_ratio": 0.10,
    },
    "Geografiya": {
        "topics": (
            "Fizik geografiya", "Iqtisodiy geografiya", "Xaritashunoslik",
            "Iqlim va ob-havo", "Litosfera", "Gidrosfera",
            "Biosfera", "O'zbekiston geografiyasi", "Dunyo mamlakatlari geografiyasi",
            "Demografiya", "Tabiiy resurslar", "Ekologik geografiya",
        ),
        "closed_ratio": 0.50,
        "open_short_ratio": 0.40,
        "open_detailed_ratio": 0.10,
    },
}


class ExamRegistry:
    _CONFIGS: Dict[str, ExamConfig] = {
        "IELTS": IELTS_CONFIG,
        "SAT": SAT_CONFIG,
        "MS": MS_CONFIG,
    }

    @classmethod
    def get(cls, exam_type: str) -> ExamConfig:
        key = cls._normalize_exam_type(exam_type)
        config = cls._CONFIGS.get(key)
        if not config:
            raise ValueError(f"Unknown exam type: {exam_type}")
        return config

    @classmethod
    def detect(cls, goal_name: str) -> str:
        goal = str(goal_name).upper()
        if "IELTS" in goal:
            return "IELTS"
        if "SAT" in goal:
            return "SAT"
        if any(kw in goal for kw in ("MILLIY", "DTM", "SERTIFIKAT", "MS", "CEFR", "OTM", "GRANT", "MATEMATIKA", "FIZIKA", "ONA TILI", "TARIX", "KIMYO", "BIOLOGIYA")):
            return "MS"
        return "IELTS"

    @classmethod
    def list_exams(cls) -> List[str]:
        return list(cls._CONFIGS.keys())

    @classmethod
    def get_band(cls, exam_type: str, score: float) -> Optional[BandDescriptor]:
        config = cls.get(exam_type)
        for band in config.bands:
            if band.min_score <= score < band.max_score:
                return band
            if score == config.max_score and band.max_score == config.max_score:
                return band
        return None

    @classmethod
    def get_ielts_hours(cls, current: float, target: float) -> Optional[float]:
        current_key = f"{current:.1f}"
        target_key = f"{target:.1f}"
        if current_key not in IELTS_HOURS_MATRIX:
            nearest = min(IELTS_HOURS_MATRIX.keys(), key=lambda k: abs(float(k) - current))
            current_key = nearest
        row = IELTS_HOURS_MATRIX.get(current_key, {})
        return row.get(target_key)

    @classmethod
    def get_ms_subject_config(cls, subject_name: str) -> Optional[Dict]:
        for key, config in MS_SUBJECTS.items():
            if key.lower() in subject_name.lower() or subject_name.lower() in key.lower():
                return {"name": key, **config}
        return None

    @classmethod
    def snap_score(cls, exam_type: str, raw_score: float) -> float:
        config = cls.get(exam_type)
        score = max(config.min_score, min(raw_score, config.max_score))
        step = config.score_step
        return round(round(score / step) * step, 1)

    @classmethod
    def validate_scores(cls, exam_type: str, current: float, target: float) -> Tuple[float, float]:
        config = cls.get(exam_type)
        current = max(config.min_score, min(current, config.max_score))
        target = max(config.min_score, min(target, config.max_score))
        if current >= target:
            raise ValueError(
                f"Current score ({current}) must be lower than target ({target})"
            )
        return cls.snap_score(exam_type, current), cls.snap_score(exam_type, target)

    @staticmethod
    def _normalize_exam_type(exam_type: str) -> str:
        mapping = {
            "IELTS": "IELTS", "ielts": "IELTS",
            "SAT": "SAT", "sat": "SAT",
            "MS": "MS", "ms": "MS",
            "MILLIY": "MS", "DTM": "MS", "SERTIFIKAT": "MS",
            "milliy sertifikat": "MS",
        }
        return mapping.get(exam_type, mapping.get(exam_type.upper(), exam_type.upper()))
