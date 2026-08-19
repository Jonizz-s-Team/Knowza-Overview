from typing import Dict, List, Tuple


IELTS_CURRICULUM = {
    "beginner": {
        "Listening": [
            ("Numbers, dates, and names extraction", "Oddiy shakl to'ldirish (ism, raqam, sana va joy nomlari)"),
            ("Section 1: Social conversation practice", "1-qism: Ijtimoiy suhbat va ma'lumotlarni tasdiqlash"),
            ("Map and diagram labelling strategies", "Oddiy xarita va reja belgilash (Map labelling)"),
            ("Section 2: Monologue comprehension", "2-qism: Monolog va asosiy yo'nalishni tushunish"),
            ("Listening fundamentals: understanding accents", "Aksentlarni tushunish asoslari va sodda audiolar"),
            ("Section 3: Basic academic discussion", "3-qism: Asosiy akademik munozara"),
        ],
        "Reading": [
            ("Scanning for specific information", "Qisqa sodda matnlar va kalit so'zlarni izlash (scanning)"),
            ("True/False/Not Given question strategy", "True/False/Not Given boshlang'ich strategiyasi va qisqa matnlar"),
            ("Sentence completion practice", "Oddiy jumlalarni to'ldirish (Sentence completion)"),
            ("Paraphrasing recognition", "Parafrazni aniqlash va sodda sinonimlar"),
            ("Reading fundamentals: skimming technique", "O'qish asoslari: skimming texnikasi"),
            ("Summary completion strategies", "Xulosa to'ldirish strategiyalari"),
        ],
        "Writing": [
            ("Task 1: Describing trends and changes", "Topshiriq 1: Oddiy bar chart va bitta trendni tasvirlash"),
            ("Task 1: Comparing data", "Topshiriq 1: Pie chart va sodda solishtirish iboralari"),
            ("Common grammar errors in IELTS Writing", "Grammatika va sodda gap tuzilishidagi xatolarni tuzatish"),
            ("Task 2: Essay structure fundamentals", "Topshiriq 2: Esse tuzilishi, kirish va xulosa yozish asoslari"),
            ("Cohesive devices and linking words", "Bog'lovchi vositalar va sodda bog'lovchi so'zlar"),
            ("Task 2: Body paragraph development", "Topshiriq 2: Asosiy paragrafni bosqichma-bosqich rivojlantirish"),
        ],
        "Speaking": [
            ("Part 1: Personal introduction practice", "1-qism: Shaxsiy tanishtiruv va o'zi haqida sodda gapirish"),
            ("Part 1: Talking about hobbies and daily life", "1-qism: Qiziqishlar va kundalik hayot haqida ravon so'zlash"),
            ("Part 2: 1-minute planning strategy", "2-qism: Cue card bilan 1 daqiqalik rejalashtirish strategiyasi"),
            ("Pronunciation: word stress patterns", "Talaffuz: so'z urg'usi va asosiy tovushlarni aniq talaffuz qilish"),
            ("Fluency: reducing pauses and fillers", "Ravonlik: pauzalarni kamaytirish va sodda birikmalar"),
            ("Part 3: Expressing opinions clearly", "3-qism: Fikrlarni sodda va aniq ifodalash"),
        ],
    },
    "intermediate": {
        "Listening": [
            ("Advanced note completion", "Murakkab yozma to'ldirish"),
            ("Matching features and classification", "Xususiyatlarni moslashtirish va tasniflash"),
            ("Understanding implied meaning", "Yashirin ma'noni tushunish"),
            ("Speed listening: academic lectures", "Tezkor tinglash: akademik ma'ruzalar"),
            ("Handling distractors in listening", "Tinglashda chalg'ituvchilarni boshqarish"),
            ("Predicting answers before listening", "Tinglashdan oldin javoblarni bashorat qilish"),
        ],
        "Reading": [
            ("Yes/No/Not Given vs True/False/Not Given", "Y/N/NG va T/F/NG farqlari"),
            ("Matching information across paragraphs", "Paragraflar bo'ylab ma'lumotlarni moslashtirish"),
            ("Complex sentence comprehension", "Murakkab gaplarni tushunish"),
            ("Reading speed optimization", "O'qish tezligini optimallashtirish"),
            ("Academic text analysis", "Akademik matn tahlili"),
            ("Paraphrasing recognition", "Parafrazni aniqlash"),
        ],
        "Writing": [
            ("Task 1: Process diagrams", "Topshiriq 1: Jarayon diagrammalari"),
            ("Task 1: Map comparison", "Topshiriq 1: Xarita taqqoslash"),
            ("Task 2: Discussion essays", "Topshiriq 2: Munozara esselari"),
            ("Task 2: Problem-solution essays", "Topshiriq 2: Muammo-yechim esselari"),
            ("Advanced cohesive devices", "Murakkab bog'lovchi vositalar"),
            ("Error correction workshop", "Xatolarni tuzatish ustaxonasi"),
        ],
        "Speaking": [
            ("Part 2: Extended monologue practice", "2-qism: Kengaytirilgan monolog mashqi"),
            ("Part 3: Abstract discussion skills", "3-qism: Abstrakt munozara ko'nikmalari"),
            ("Using idiomatic expressions naturally", "Idiomatik iboralarni tabiiy ishlatish"),
            ("Pronunciation: connected speech", "Talaffuz: bog'langan nutq"),
            ("Complex grammar in speaking", "Gapirishda murakkab grammatika"),
            ("Mock speaking test simulation", "Mock speaking test simulyatsiyasi"),
        ],
    },
    "advanced": {
        "Listening": [
            ("Band 8+ listening: inference", "Band 8+ tinglash: xulosa chiqarish"),
            ("Speed drill: 1.25x playback", "Tezlik mashqi: 1.25x"),
            ("Accent variation mastery", "Aksent xilma-xilligini o'zlashtirish"),
            ("Perfect score strategy", "Mukammal ball strategiyasi"),
        ],
        "Reading": [
            ("Band 8+ reading: time mastery", "Band 8+ o'qish: vaqt ustasi"),
            ("Critical analysis of arguments", "Argumentlarni tanqidiy tahlil qilish"),
            ("Academic register recognition", "Akademik registrni aniqlash"),
            ("Zero-error target strategy", "Nol-xato maqsad strategiyasi"),
        ],
        "Writing": [
            ("Band 8+ Task 2: sophisticated argumentation", "Band 8+ Topshiriq 2: murakkab argumentatsiya"),
            ("Advanced lexical sophistication", "Murakkab leksik boylik"),
            ("Error-free grammar under pressure", "Bosim ostida xatosiz grammatika"),
            ("Timed writing: 20+40 minute mastery", "Vaqtli yozish: 20+40 daqiqa ustasi"),
        ],
        "Speaking": [
            ("Band 8+ fluency: native-like delivery", "Band 8+ ravonlik: ona tilidek yetkazish"),
            ("Sophisticated vocabulary usage", "Murakkab lug'atdan foydalanish"),
            ("Intonation and emphasis mastery", "Intonatsiya va ta'kid ustasi"),
            ("Full mock speaking exam", "To'liq mock speaking imtihoni"),
        ],
    },
}


SAT_CURRICULUM = {
    "beginner": {
        "Reading and Writing": [
            ("Reading fundamentals: main idea identification", "O'qish asoslari: asosiy g'oyani aniqlash"),
            ("Vocabulary in context strategies", "Kontekstdagi lug'at strategiyalari"),
            ("Grammar basics: subject-verb agreement", "Grammatika asoslari: ega-kesim mosligi"),
            ("Punctuation rules: commas and semicolons", "Tinish belgilari: vergul va nuqtali vergul"),
            ("Transition words and text flow", "O'tish so'zlari va matn oqimi"),
            ("Evidence-based reading", "Dalillarga asoslangan o'qish"),
            ("Rhetorical synthesis introduction", "Ritorik sintez kirish"),
            ("Practice: short passage analysis", "Mashq: qisqa matn tahlili"),
        ],
        "Math": [
            ("Linear equations and inequalities", "Chiziqli tenglamalar va tengsizliklar"),
            ("Systems of equations", "Tenglamalar sistemasi"),
            ("Linear functions and graphs", "Chiziqli funksiyalar va grafiklar"),
            ("Ratios, rates, and percentages", "Nisbatlar, tezliklar va foizlar"),
            ("Mean, median, mode basics", "O'rtacha, median, moda asoslari"),
            ("Basic probability", "Asosiy ehtimollik"),
            ("Desmos calculator introduction", "Desmos kalkulyator kirish"),
            ("Problem-solving strategies", "Masala yechish strategiyalari"),
        ],
    },
    "intermediate": {
        "Reading and Writing": [
            ("Advanced vocabulary and connotation", "Murakkab lug'at va konnotatsiya"),
            ("Complex evidence analysis", "Murakkab dalil tahlili"),
            ("Data interpretation in passages", "Matnlardagi ma'lumotlarni interpretatsiya qilish"),
            ("Advanced grammar: parallel structure", "Murakkab grammatika: parallel tuzilma"),
            ("Rhetorical purpose analysis", "Ritorik maqsad tahlili"),
            ("Timed reading strategies", "Vaqtli o'qish strategiyalari"),
        ],
        "Math": [
            ("Quadratic equations: all methods", "Kvadrat tenglamalar: barcha usullar"),
            ("Exponential functions", "Eksponensial funksiyalar"),
            ("Advanced statistics and probability", "Murakkab statistika va ehtimollik"),
            ("Triangle properties and theorems", "Uchburchak xususiyatlari va teoremalar"),
            ("Circle equations and properties", "Aylana tenglamalari va xususiyatlari"),
            ("Desmos mastery: graph analysis", "Desmos ustasi: grafik tahlili"),
        ],
    },
    "advanced": {
        "Reading and Writing": [
            ("1500+ strategy: zero-error reading", "1500+ strategiya: xatosiz o'qish"),
            ("Speed reading under pressure", "Bosim ostida tez o'qish"),
            ("Trap answer elimination", "Tuzoq javoblarni yo'q qilish"),
            ("Full section simulation", "To'liq bo'lim simulyatsiyasi"),
        ],
        "Math": [
            ("1500+ strategy: advanced problem patterns", "1500+ strategiya: murakkab masala shakllari"),
            ("Trigonometry and coordinate geometry", "Trigonometriya va koordinatalar geometriyasi"),
            ("Complex word problems", "Murakkab matnli masalalar"),
            ("Full math section simulation", "To'liq matematika bo'lim simulyatsiyasi"),
        ],
    },
}


MS_CURRICULUM = {
    "beginner": [
        ("Imtihon formati va qoidalarini o'rganish", "Imtihon formati va qoidalarini o'rganish"),
        ("Yopiq testlar strategiyasi", "Yopiq testlar strategiyasi"),
        ("Qisqa ochiq testlarga tayyorgarlik", "Qisqa ochiq testlarga tayyorgarlik"),
        ("Asosiy mavzularni takrorlash", "Asosiy mavzularni takrorlash"),
        ("Vaqtni boshqarish asoslari", "Vaqtni boshqarish asoslari"),
        ("Mashq testlar bilan ishlash", "Mashq testlar bilan ishlash"),
    ],
    "intermediate": [
        ("Batafsil ochiq testlar texnikasi", "Batafsil ochiq testlar texnikasi"),
        ("Rasch modeli bo'yicha baholash tizimini tushunish", "Rasch modeli bo'yicha baholash tizimini tushunish"),
        ("Murakkab mavzularga chuqur kirish", "Murakkab mavzularga chuqur kirish"),
        ("Vaqt bosimi ostida ishlash", "Vaqt bosimi ostida ishlash"),
        ("B+ darajaga chiqish strategiyasi", "B+ darajaga chiqish strategiyasi"),
        ("To'liq mashq imtihoni", "To'liq mashq imtihoni"),
    ],
    "advanced": [
        ("A+ darajaga chiqish intensiv dasturi", "A+ darajaga chiqish intensiv dasturi"),
        ("Eng murakkab masalalar ustida ishlash", "Eng murakkab masalalar ustida ishlash"),
        ("Batafsil ochiq testlarda maksimal ball olish", "Batafsil ochiq testlarda maksimal ball olish"),
        ("Stressga chidamlilik va imtihon psixologiyasi", "Stressga chidamlilik va imtihon psixologiyasi"),
    ],
}


class CurriculumBank:
    _BANKS = {
        "IELTS": IELTS_CURRICULUM,
        "SAT": SAT_CURRICULUM,
        "MS": MS_CURRICULUM,
    }

    @classmethod
    def get_topics(
        cls,
        exam_type: str,
        level: str,
        section: str = None,
    ) -> List[Tuple[str, str]]:
        bank = cls._BANKS.get(exam_type, {})

        if exam_type == "MS":
            level_data = bank.get(level, bank.get("beginner", []))
            return level_data

        level_data = bank.get(level, bank.get("beginner", {}))
        if not isinstance(level_data, dict):
            return []

        if section:
            return level_data.get(section, [])

        all_topics = []
        for sec_topics in level_data.values():
            all_topics.extend(sec_topics)
        return all_topics

    @classmethod
    def get_level_for_score(cls, exam_type: str, score: float) -> str:
        from .exam_knowledge import ExamRegistry
        band = ExamRegistry.get_band(exam_type, score)
        if not band:
            return "beginner"

        level_map = {
            "zero": "beginner",
            "beginner": "beginner",
            "elementary": "beginner",
            "intermediate": "intermediate",
            "upper_intermediate": "intermediate",
            "advanced": "advanced",
            "expert": "advanced",
        }
        return level_map.get(band.level, "beginner")
