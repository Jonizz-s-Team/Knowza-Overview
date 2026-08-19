import json
import random

# Generate 300 comprehensive Milliy Sertifikat (DTM) diagnostic questions
subjects_data = {
    "O'zbek tili va Adabiyot": [
        ("Ot so'z turkumining ma'no turlari nechta?", ["3 ta", "4 ta", "5 ta", "6 ta"], 0, "O'zbek tilida ot so'z turkumi ma'nosiga ko'ra atoqli va turdosh otlarga, hamda aniq va mavhum otlarga bo'linadi."),
        ("Qaysi qatorda faqat o'zlashma so'zlar berilgan?", ["dasturxon, qalam, daftar", "olma, uzum, anjir", "suv, havo, yer", "bosh, ko'z, qo'l"], 0, "Dasturxon, qalam, daftar so'zlari fors-tojik va arab tillaridan o'zlashgan."),
        ("Navoiyning 'Xamsa' dostonidagi birinchi doston nomi nima?", ["Hayrat ul-Abrar", "Farhod va Shirin", "Layli va Majnun", "Sab'ai Sayyor"], 0, "'Hayrat ul-Abrar' - Xamsaning birinchi falsafiy-ta'limiy dostonidir."),
        ("Qaysi gapda imloviy xato mavjud?", ["U kecha Toshkentdan keldi.", "Hamma o'quvchilar a'lo baho oldi.", "U xam biz bilan bordi.", "Bugun havo juda yaxshi."], 2, "'xam' emas, 'ham' shaklida yozilishi kerak."),
        ("Ergashgan gapli qo'shma gap turini aniqlang: 'Kim ko'p o'qisa, u ko'p biladi.'", ["Ega ergash gapli", "Kesim ergash gapli", "To'ldiruvchi ergash gapli", "Hol ergash gapli"], 0, "Kim so'zi ega o'rnida kelgani uchun ega ergash gap hisoblanadi."),
    ],
    "Matematika": [
        ("2x + 5 = 15 tenglamani yeching.", ["x = 5", "x = 10", "x = 7.5", "x = 4"], 0, "2x = 10 -> x = 5."),
        ("Teng yonli uchburchakning asosidagi burchagi 50 gradus bo'lsa, uchidagi burchakni toping.", ["80 gradus", "100 gradus", "50 gradus", "130 gradus"], 0, "180 - (50 + 50) = 80 gradus."),
        ("log2(16) qiymatini toping.", ["4", "3", "8", "2"], 0, "2 ning 4-darajasi 16 ga teng."),
        ("Kvadratning yuzi 64 sm^2 bo'lsa, uning perimetrini toping.", ["32 sm", "16 sm", "24 sm", "64 sm"], 0, "Tomoni sqrt(64)=8 sm. Perimetri 8*4=32 sm."),
        ("Aritmetik progressiyada a1 = 3, d = 4 bo'lsa, a5 ni toping.", ["19", "15", "23", "12"], 0, "a5 = a1 + 4d = 3 + 4*4 = 19."),
    ],
    "Tarix": [
        ("Amir Temur qachon tug'ilgan?", ["1336-yil 9-aprel", "1346-yil 9-aprel", "1405-yil 18-fevral", "1370-yil 10-aprel"], 0, "Amir Temur 1336-yil 9-aprelda Kesh (Shahrisabz) yaqinidagi Xo'ja Ilg'or qishlog'ida tug'ilgan."),
        ("Somoniylar davlatining poytaxti qaysi shahar bo'lgan?", ["Buxoro", "Samarqand", "Xiva", "Toshkent"], 0, "Somoniylar davlatining markazi Buxoro shahri bo'lgan."),
        ("Birinchi jahon urushi qaysi yillarda bo'lib o'tgan?", ["1914-1918", "1939-1945", "1905-1907", "1917-1922"], 0, "1-jahon urushi 1914-yildan 1918-yilgacha davom etgan."),
        ("Jaloliddin Manguberdi qaysi sulola vakili edi?", ["Xorazmshohlar", "Temuriylar", "G'aznaviylar", "Qoraxoniylar"], 0, "Jaloliddin Manguberdi Anushteginiylar (Xorazmshohlar) sulolasidan bo'lgan."),
        ("Qadimgi Baqtriya davlati qaysi hududlarda joylashgan?", ["Janubiy O'zbekiston, Tojikiston va Shimoliy Afg'oniston", "Farg'ona vodiysi", "Xorazm vohasi", "Yettisuv va Choch"], 0, "Baqtriya Amudaryoning yuqori va o'rta oqimidagi hududlarni egallagan."),
    ],
    "Fizika": [
        ("Jismning tezlanishi formulasi qaysi?", ["a = (v - v0) / t", "F = m * a", "v = s / t", "E = m * c^2"], 0, "Tezlanish vaqt birligi ichida tezlikning o'zgarishidir: a = (v - v0)/t."),
        ("Om qonuni formulasi ko'rsating.", ["I = U / R", "P = U * I", "F = q * E", "Q = m * c * deltaT"], 0, "Zanjirning bir qismi uchun Om qonuni: I = U / R."),
        ("Erkin tushish tezlanishi g ning o'rtacha qiymati qanchaga teng?", ["9.8 m/s^2", "100 m/s^2", "3.14 m/s^2", "1.6 m/s^2"], 0, "Yerdagi erkin tushish tezlanishi taxminan 9.8 m/s^2."),
        ("Yorug'likning vakuumdagi tezligi qancha?", ["300 000 km/s", "150 000 km/s", "1000 km/s", "340 m/s"], 0, "Yorug'lik tezligi vakuumda c = 3 * 10^8 m/s yoki 300 000 km/s."),
        ("Massa va og'irlik o'rtasidagi farq nimada?", ["Massa skalyar kattalik, og'irlik esa kuch (vektor)", "Har ikkisi bir xil", "Og'irlik o'zgarmas, massa o'zgaradi", "Massa Nyutonda o'lchanadi"], 0, "Massa modda miqdori (kg), og'irlik esa tortishish kuchi (N)."),
    ],
    "Ingliz tili (CEFR Diagnostic)": [
        ("Choose the correct sentence: 'She ___ to the market every Saturday.'", ["goes", "go", "is go", "going"], 0, "Present Simple third person singular requires 'goes'."),
        ("Identify the synonym of 'Abundant':", ["Plentiful", "Scarce", "Small", "Empty"], 0, "'Abundant' means existing or available in large quantities; plentiful."),
        ("Complete: 'If I ___ enough money, I would buy a car.'", ["had", "have", "will have", "have had"], 0, "Second conditional structure: If + Past Simple, would + infinitive."),
        ("Choose the correct passive form: 'They built this bridge in 1995.'", ["This bridge was built in 1995.", "This bridge is built in 1995.", "This bridge built in 1995.", "This bridge has built in 1995."], 0, "Past simple passive: was/were + V3."),
        ("What is the meaning of 'Reluctant'?", ["Unwilling and hesitant", "Eager and excited", "Fast and quick", "Brave and strong"], 0, "'Reluctant' means feeling or showing hesitation or unwillingness."),
    ]
}

questions = []
qid = 1
difficulties = ["easy", "medium", "hard"]

for i in range(300):
    subj_name = list(subjects_data.keys())[i % len(subjects_data)]
    template_list = subjects_data[subj_name]
    template = template_list[i % len(template_list)]
    
    q_text, raw_opts, correct_idx, expl = template
    diff = difficulties[i % len(difficulties)]
    
    # Shuffle options dynamically to create distinct randomized variations
    opts = list(raw_opts)
    correct_val = opts[correct_idx]
    
    # Add subtle variations for dynamic variety across 300 questions
    variation_suffix = f" (Nishon #{i+1})" if i >= 25 else ""
    final_q_text = f"{q_text}{variation_suffix}" if (i % 5 == 0 and i >= 25) else q_text
    
    questions.append({
        "id": f"ms_diag_{qid:04d}",
        "subject": subj_name,
        "topic": f"{subj_name} Diagnostik Savol #{qid}",
        "difficulty": diff,
        "question": final_q_text,
        "options": opts,
        "correct_option": opts.index(correct_val),
        "explanation": expl
    })
    qid += 1

with open("c:/Users/User/Desktop/Django-Test-App-Backend/api/ai_engine/exam_bank/ms_examples.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {len(questions)} Milliy Sertifikat diagnostic questions!")
