import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/Seo';
import FUIHeroWithBorders from '../../components/ui/herowith-logos';
import { motion, AnimatePresence } from 'framer-motion';
import { Features } from '../../components/blocks/features-8';
import { Globe } from '../../components/ui/globe';

const KnowzaAIHome = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const lang = i18n.language ? i18n.language.split('-')[0].toUpperCase() : 'UZ';

  const [activeTab, setActiveTab] = useState('tutor');
  const [promptText, setPromptText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1); // 1 = Next/Right, -1 = Prev/Left
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);

  const handleNextSlide = () => {
    setSlideDirection(1);
    setCurrentStepIndex((prev) => (prev === howItWorksSteps.length - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    setSlideDirection(-1);
    setCurrentStepIndex((prev) => (prev === 0 ? howItWorksSteps.length - 1 : prev - 1));
  };

  const handleSelectSlide = (targetIdx) => {
    if (targetIdx === currentStepIndex) return;
    const total = howItWorksSteps.length;
    let diff = targetIdx - currentStepIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    setSlideDirection(diff > 0 ? 1 : -1);
    setCurrentStepIndex(targetIdx);
  };

  const localizedData = {
    UZ: {
      hero: {
        badgeText: "557+ o'quvchilar va talabalar",
        titleStart: "O'rganish Tajribangizni",
        titleEnd: "Bilan Yangi Bosqichga O'tkazing",
        subtitle: "IELTS, SAT va Milliy Sertifikatdan noldan mustahkam baza hamda poydevor quruvchi shaxsiy AI repetitor va avtomatik Roadmap tizimi.",
        primaryBtn: "Bepul boshlash",
        secondaryBtn: "Siz nima olasiz?"
      },
      showcasesTitleBadge: "Imkoniyatlar va Afzalliklar",
      showcasesTitleMain: "Knowza AI Bilan Ta'limda Cheksiz Imkoniyatlar",
      showcases: [
        {
          badge: "1-Ustunlik: Shaxsiy Muloqot",
          title: "24/7 Yonimda Turuvchi Aqlli AI Ustoz",
          desc: "O'quvchi tushunmagan har qanday akademik yoki amaliy savolini berishi mumkin. AI murakkab formulalar va tushunchalarni noldan sodda hayotiy misollar bilan tushuntirib, baza shakllantiradi.",
          points: [
            "Matematik formulalar va masalalarni noldan bosqichma-bosqich yechish",
            "Mavzular bo'yicha tushunchalarni chuqur tahlil qilish va xatolarni ko'rsatish",
            "Har qanday vaqtda bemalol savol berib, bazani mustahkamlash"
          ],
          btn: "AI Ustozni Sinash"
        },
        {
          badge: "2-Ustunlik: Aniq Reja",
          title: "Individual O'quv Yo'li (Roadmap)",
          desc: "Kunlik va haftalik maqsadlaringizga moslashtirilgan avtomatik o'quv rejasi. Tizim siz poydevordan boshlab o'zlashtirishingiz kerak bo'lgan bosqichlarni aniq ko'rsatadi.",
          points: [
            "IELTS, SAT va Milliy Sertifikatdan mustahkam baza va bilimlar poydevorini shakllantirish uchun shaxsiy o'quv grafigi",
            "Kunlik bajarilishi shart bo'lgan poydevor o'quv missiyalari",
            "O'zlashtirish va baza darajasini real vaqt rejimida kuzatish"
          ],
          btn: "Shaxsiy Reja Tuzish"
        },
        {
          badge: "3-Ustunlik: Ilmiy Tahlil",
          title: "Chuqur Ilmiy Izlanish (Deep Research)",
          desc: "Murakkab akademik va ilmiy mavzularni 1 daqiqa ichida chuqur tahlil qilib, tizimlashtirilgan konspektlar va manbalarni tayyorlaydi.",
          points: [
            "Ilmiy va akademik maqolalarni tahlil qilish",
            "Mavzu bo'yicha tayyor konspektlar va qisqacha mazmun shakllantirish",
            "Zaif bilim nuqtalarini avtomatik aniqlash va tuzatish"
          ],
          btn: "Chuqur Izlanishni Sinash"
        },
        {
          badge: "4-Ustunlik: Real-Vaqt Tahlili",
          title: "Smart AI Ekosistemasi va Bilimlar Tahlili",
          desc: "Barcha o'quv faoliyatingiz, yechilgan testlar va zaif ko'nikmalaringiz yagona aqlli dashboardda avtomatik jamlanadi va tahlil qilinadi.",
          points: [
            "Zaif nuqtalarga qaratilgan maxsus topshiriqlar shakllantirish",
            "Kunlik uzluksiz o'rganish seriyasi (Streak counter)",
            "Baza va bilim darajangizning o'sish dinamikasini avtomatik tahlil qilish"
          ],
          btn: "Ekosistemaga Qo'shilish"
        }
      ],
      howItWorksTitle: "Knowza AI Qanday Ishlaydi?",
      howItWorksSteps: [
        {
          stepNumber: "01",
          badge: "1-QADAM: TA'LIM MAQSADINI BELGILASH",
          title: "IELTS, SAT yoki Milliy Sertifikat Yo'nalishini Tanlash",
          description: "O'quvchi IELTS, SAT yoki Milliy Sertifikatdan mustahkam baza va bilimlar poydevorini qurmoqchi bo'lgan yo'nalishini kiritadi.",
          points: [
            "IELTS, SAT va Milliy Sertifikat yo'nalishlaridan mustahkam baza hamda poydevor qurish",
            "Joriy bilim darajasini aniq diagnostika qilish",
            "Mustahkam poydevor yaratish va aniq muddatni belgilash"
          ],
          image: "/banner/knowza_ai_step1.png"
        },
        {
          stepNumber: "02",
          badge: "2-QADAM: SHAXSIY REJA SHAKLLANTIRISH",
          title: "Avtomatik Individual O'quv Yo'li (Roadmap)",
          description: "Knowza AI o'quvchining kuchli va zaif nuqtalaridan kelib chiqib, kunlik o'quv missiyalari hamda intellektual Roadmap shakllantiradi.",
          points: [
            "Kunlik bajarilishi shart bo'lgan poydevor o'quv missiyalari",
            "Zaif mavzularga yo'naltirilgan intensiv darslar",
            "O'zlashtirish va rivojlanish progress grafigi"
          ],
          image: "/banner/knowza_ai_step2.png"
        },
        {
          stepNumber: "03",
          badge: "3-QADAM: AQLLI USTOZ BILAN MULOQOT",
          title: "24/7 AI Ustoz Bilan Savol-Javob va Yechimlar",
          description: "O'quvchi tushunmagan har qanday matematik yoki ilmiy savolini AI Ustozga beradi va sodda misollar bilan tushunadi.",
          points: [
            "Matematika, Fizika, Kimyo formulalarini bosqichma-bosqich yechish",
            "Matnlarni tekshirish va fundamental xatolarni tuzatish",
            "24/7 istalgan vaqtda uzluksiz savol berish imkoniyati"
          ],
          image: "/banner/knowza_ai_step3.png"
        },
        {
          stepNumber: "04",
          badge: "4-QADAM: REAL-VAQT TAHLILI",
          title: "Zaif Nuqtalar Tahlili va Bilimlar O'sishi",
          description: "Yechilgan testlar va xatolar avtomatik tahlil qilinadi hamda poydevor bilimlaringiz o'sishi avtomatik tahlil va bashorat qilinadi.",
          points: [
            "Zaif ko'nikmalarga qaratilgan maxsus topshiriqlar",
            "Streak counter — kunlik uzluksiz o'rganish seriyasi",
            "Poydevor bilim darajangiz o'sishini avtomatik tahlil qilish"
          ],
          image: "/banner/knowza_ai_step4.png"
        }
      ],
      researchSection: {
        badge: "Ilmiy Tadqiqot & Arxitektura",
        title: "Knowza AI Texnik Tadqiqot Ishi",
        author: "Toshkent — 2026 | Muallif:",
        description: "Muallifimiz tomonidan yaratilgan ushbu ilmiy tadqiqot ishi — EdTech platformalari uchun sun'iy intellektni xavfsiz, samarali va barqaror integratsiya qilish yo'llarini ilmiy asoslab beradi. Ishni o'qib chiqishingizni iltimos qilib so'raymiz.",
        downloadBtn: "Tadqiqot Ishini Yuklab Olish"
      },
      pricingTitleBadge: "Tarif Rejalari",
      pricingTitleMain: "O'zingizga Mos Tarifni Tanlang",
      pricingDesc: "Barcha cheklovlarni olib tashlang va Knowza AI ning to'liq kuchidan foydalaning. Istalgan vaqt bekor qilish mumkin — hech qanday majburiyat yo'q.",
      pricingPlans: [
        {
          months: 1,
          title: "1 Oylik Obuna",
          price: "99 000 UZS",
          monthlyPrice: "99 000 UZS / oy",
          monthlyPriceLabel: "Oylik to'lov",
          desc: "Barcha cheklovlarni olib tashlash va platformadan to'liq foydalanish uchun.",
          recommended: false,
          benefits: ["Haftalik cheklovlarsiz AI izlanishlar", "Birdaniga 3 tagacha o'quv maqsadini tanlash", "O'quv rejasini cheklovlarsiz yangilash", "AI xotirasini boshqarish va personalizatsiya"]
        },
        {
          months: 3,
          title: "3 Oylik Obuna",
          price: "249 000 UZS",
          monthlyPrice: "83 000 UZS / oy",
          monthlyPriceLabel: "Yangi narx",
          desc: "Mustahkam baza va poydevor shakllantirish uchun eng optimal vaqt va narx.",
          recommended: true,
          benefits: ["Haftalik cheklovlarsiz AI izlanishlar", "Birdaniga 3 tagacha o'quv maqsadini tanlash", "O'quv rejasini cheklovlarsiz yangilash", "AI xotirasini boshqarish va personalizatsiya"]
        },
        {
          months: 9,
          title: "9 Oylik Obuna",
          price: "599 000 UZS",
          monthlyPrice: "66 500 UZS / oy",
          monthlyPriceLabel: "Yangi narx",
          desc: "Butun o'quv yili davomida eng arzon narxda barcha Pro imkoniyatlar.",
          recommended: false,
          benefits: ["Haftalik cheklovlarsiz AI izlanishlar", "Birdaniga 3 tagacha o'quv maqsadini tanlash", "O'quv rejasini cheklovlarsiz yangilash", "AI xotirasini boshqarish va personalizatsiya"]
        }
      ],
      pricingBtn: "Boshlash",
      pricingRecommendedBadge: "Tavsiya etiladi",
      faqTitleBadge: "Savol-Javoblar",
      faqTitleMain: "Ko'p Beriladigan Savollar",
      faqs: [
        {
          q: "Knowza AI nima va u oddiy ChatGPT dan nimasi bilan farq qiladi?",
          a: "Knowza AI — ta'lim tizimiga 100% moslashtirilgan sun'iy intellekt ekotizimidir. U nafaqat savollarga javob beradi, balki sizning bilim darajangizni aniqlab, noldan baza va poydevor quruvchi shaxsiy Roadmap tuzadi hamda zaif ko'nikmalaringizni tahlil qiladi."
        },
        {
          q: "AI Ustoz bilan IELTS, SAT va Milliy Sertifikatdan qanday qilib baza qurish mumkin?",
          a: "IELTS (Grammatika, Lug'at, Writing, Speaking), SAT Math/Verbal hamda Milliy Sertifikat yo'nalishlaridan noldan poydevor bilimlarni o'rganishingiz mumkin."
        },
        {
          q: "Shaxsiy Roadmap qanday ishlaydi?",
          a: "Siz o'quv maqsadingiz va bo me'yoringizni kiritasiz. Tizim avtomatik tarzda kunlik va haftalik missiyalarga bo'lingan bosqichma-bosqich poydevor grafik ishlab chiqadi."
        },
        {
          q: "Platformada foydalanish bepulmi?",
          a: "Boshlang'ich funksiyalar va bepul test rejimi barcha foydalanuvchilar uchun ochiq. Yanada chuqurroq izlanishlar va eksklyuziv AI persona imkoniyatlari uchun Pro tarif mavjud."
        }
      ],
      globeSection: {
        badge: "Global Ta'lim Ekotizimi",
        title: "Dunyoning Istalgan Nuqtasidan Knowza AI Bilan O'rganing",
        subtitle: "Chegara va masofalarsiz — dunyoning har bir burchagida uzluksiz ishlovchi intellektual ta'lim platformasi."
      }
    },
    EN: {
      hero: {
        badgeText: "100,000+ students and learners",
        titleStart: "Take Your Learning Experience to the Next Level with",
        titleEnd: "",
        subtitle: "Personal AI tutor and automatic Roadmap system for building a rock-solid base and core foundation in IELTS, SAT, and National Certificate exams.",
        primaryBtn: "Start for free",
        secondaryBtn: "What do you get?"
      },
      showcasesTitleBadge: "Features and Benefits",
      showcasesTitleMain: "Endless Learning Possibilities with Knowza AI",
      showcases: [
        {
          badge: "Advantage 1: Personal Interaction",
          title: "24/7 Smart AI Tutor by Your Side",
          desc: "Students can ask any academic or practical question they don't understand. AI explains complex formulas from scratch using simple real-life examples.",
          points: [
            "Step-by-step solutions for mathematical formulas and problems from scratch",
            "Deeply analyzing subject concepts and pointing out core mistakes",
            "Ability to ask questions seamlessly at any time to strengthen your Base"
          ],
          btn: "Try AI Tutor"
        },
        {
          badge: "Advantage 2: Clear Plan",
          title: "Individual Learning Path (Roadmap)",
          desc: "An automatic learning plan tailored to your goals. The system clearly shows the steps you need to master starting from the foundational core.",
          points: [
            "Personal learning schedule for building a solid base and core foundation in IELTS, SAT, and National Certificate",
            "Mandatory daily foundational learning missions",
            "Real-time tracking of mastery and base knowledge percentage"
          ],
          btn: "Create Personal Plan"
        },
        {
          badge: "Advantage 3: Scientific Analysis",
          title: "Deep Scientific Research",
          desc: "Deeply analyzes complex academic and scientific topics within 1 minute, preparing systematized notes and sources.",
          points: [
            "Analyzing scientific and academic articles",
            "Creating ready-made notes and summaries on the topic",
            "Automatically identifying and correcting weak knowledge points"
          ],
          btn: "Try Deep Research"
        },
        {
          badge: "Advantage 4: Real-Time Analytics",
          title: "Smart AI Ecosystem and Knowledge Analysis",
          desc: "All your learning activities, completed tests, and weak skills are automatically aggregated and analyzed in a single smart dashboard.",
          points: [
            "Generating special tasks focused on weak points",
            "Daily continuous learning streak counter",
            "Automatic tracking and analysis of your core knowledge growth dynamics"
          ],
          btn: "Join the Ecosystem"
        }
      ],
      howItWorksTitle: "How Does Knowza AI Work?",
      howItWorksSteps: [
        {
          stepNumber: "01",
          badge: "STEP 1: SETTING A LEARNING GOAL",
          title: "Choosing IELTS, SAT, or National Certificate Direction",
          description: "The student selects IELTS, SAT, or National Certificate direction to build a strong base and core foundation from scratch.",
          points: [
            "Choosing IELTS, SAT, or National Certificate to build a solid base",
            "Accurate diagnosis of current knowledge level",
            "Creating a strong foundation and setting clear timelines"
          ],
          image: "/banner/knowza_ai_step1.png"
        },
        {
          stepNumber: "02",
          badge: "STEP 2: FORMING A PERSONAL PLAN",
          title: "Automatic Individual Learning Path (Roadmap)",
          description: "Based on the student's strengths and weaknesses, Knowza AI generates daily foundational learning missions and an intelligent Roadmap.",
          points: [
            "Mandatory daily foundational learning missions",
            "Intensive lessons focused on weak topics",
            "Mastery and foundational development progress chart"
          ],
          image: "/banner/knowza_ai_step2.png"
        },
        {
          stepNumber: "03",
          badge: "STEP 3: INTERACTING WITH SMART TUTOR",
          title: "24/7 Q&A and Solutions with AI Tutor",
          description: "The student asks the AI Tutor any mathematical or scientific question they don't understand and gets simple step-by-step explanations.",
          points: [
            "Step-by-step solving of Math, Physics, Chemistry formulas",
            "Checking texts and correcting fundamental errors",
            "24/7 continuous ability to ask questions anytime"
          ],
          image: "/banner/knowza_ai_step3.png"
        },
        {
          stepNumber: "04",
          badge: "STEP 4: REAL-TIME ANALYSIS",
          title: "Weak Points Analysis and Core Knowledge Growth",
          description: "Completed tests and mistakes are automatically analyzed, and your foundational knowledge growth is tracked.",
          points: [
            "Special tasks aimed at weak skills",
            "Streak counter — daily continuous learning series",
            "Automatic analysis of your core knowledge growth"
          ],
          image: "/banner/knowza_ai_step4.png"
        }
      ],
      researchSection: {
        badge: "Scientific Research & Architecture",
        title: "Knowza AI Technical Research Paper",
        author: "Tashkent — 2026 | Author:",
        description: "This scientific research paper created by our author scientifically justifies the ways of safe, effective, and sustainable integration of artificial intelligence for EdTech platforms. We kindly ask you to read the paper.",
        downloadBtn: "Download Research Paper"
      },
      pricingTitleBadge: "Pricing Plans",
      pricingTitleMain: "Choose the Plan That Suits You",
      pricingDesc: "Remove all limits and use the full power of Knowza AI. Cancel anytime — no commitment.",
      pricingPlans: [
        {
          months: 1,
          title: "1 Month Subscription",
          price: "99 000 UZS",
          monthlyPrice: "99 000 UZS / mo",
          monthlyPriceLabel: "Monthly payment",
          desc: "To remove all limits and fully use the platform.",
          recommended: false,
          benefits: ["Unlimited weekly AI research", "Choose up to 3 learning goals at once", "Update learning plan without limits", "Manage and personalize AI memory"]
        },
        {
          months: 3,
          title: "3 Months Subscription",
          price: "249 000 UZS",
          monthlyPrice: "83 000 UZS / mo",
          monthlyPriceLabel: "New price",
          desc: "The most optimal time and price for building a strong base and core foundation.",
          recommended: true,
          benefits: ["Unlimited weekly AI research", "Choose up to 3 learning goals at once", "Update learning plan without limits", "Manage and personalize AI memory"]
        },
        {
          months: 9,
          title: "9 Months Subscription",
          price: "599 000 UZS",
          monthlyPrice: "66 500 UZS / mo",
          monthlyPriceLabel: "New price",
          desc: "All Pro features at the cheapest price for the whole academic year.",
          recommended: false,
          benefits: ["Unlimited weekly AI research", "Choose up to 3 learning goals at once", "Update learning plan without limits", "Manage and personalize AI memory"]
        }
      ],
      pricingBtn: "Get Started",
      pricingRecommendedBadge: "Recommended",
      faqTitleBadge: "Q&A",
      faqTitleMain: "Frequently Asked Questions",
      faqs: [
        {
          q: "What is Knowza AI and how is it different from normal ChatGPT?",
          a: "Knowza AI is an artificial intelligence ecosystem 100% adapted to the education system. It doesn't just answer questions, but determines your knowledge level, creates a personal Roadmap to build a solid base from scratch, and analyzes your weak skills."
        },
        {
          q: "How can I build a solid base in IELTS, SAT, and National Certificate with AI Tutor?",
          a: "You can build a strong foundational base in IELTS (Grammar, Vocabulary, Writing, Speaking), SAT Math/Verbal, and National Certificate subject modules."
        },
        {
          q: "How does the Personal Roadmap work?",
          a: "You enter your learning goal and time. The system automatically develops a step-by-step foundational schedule divided into daily and weekly missions."
        },
        {
          q: "Is it free to use the platform?",
          a: "Basic features and a free test mode are open to all users. A Pro tariff is available for deeper research and exclusive AI persona capabilities."
        }
      ],
      globeSection: {
        badge: "Global Education Ecosystem",
        title: "Learn from Anywhere in the World with Knowza AI",
        subtitle: "No borders, no limits — a seamless intelligent learning platform accessible worldwide."
      }
    },
    RU: {
      hero: {
        badgeText: "100,000+ учеников и студентов",
        titleStart: "Поднимите Свой Опыт Обучения на Новый Уровень с",
        titleEnd: "",
        subtitle: "Персональный ИИ-репетитор и автоматическая система Roadmap для построения прочной базы и фундаментальных знаний по IELTS, SAT и Национальному Сертификату.",
        primaryBtn: "Попробовать бесплатно",
        secondaryBtn: "Что вы получите?"
      },
      showcasesTitleBadge: "Возможности и Преимущества",
      showcasesTitleMain: "Бесконечные Возможности Обучения с Knowza AI",
      showcases: [
        {
          badge: "Преимущество 1: Личное Общение",
          title: "Умный ИИ-наставник 24/7 Всегда Рядом",
          desc: "Ученик может задать любой непонятный академический или практический вопрос. ИИ объясняет сложные формулы и понятия с нуля на простых жизненных примерах.",
          points: [
            "Пошаговое решение математических формул и задач с нуля",
            "Глубокий анализ понятий по предметам и исправление ключевых ошибок",
            "Возможность задавать вопросы в любое время для укрепления базы"
          ],
          btn: "Попробовать ИИ-наставника"
        },
        {
          badge: "Преимущество 2: Четкий План",
          title: "Индивидуальный Путь Обучения (Roadmap)",
          desc: "Автоматический учебный план, адаптированный к вашим целям. Система четко показывает шаги, которые вам нужно освоить, начиная с фундаментальных основ.",
          points: [
            "Персональный график обучения для формирования прочной базы и фундаментальных знаний по IELTS, SAT и Национальному Сертификату",
            "Обязательные ежедневные фундаментальные учебные миссии",
            "Отслеживание процента усвоения базовых знаний в реальном времени"
          ],
          btn: "Создать Личный План"
        },
        {
          badge: "Преимущество 3: Научный Анализ",
          title: "Глубокие Научные Исследования",
          desc: "Глубоко анализирует сложные академические и научные темы за 1 минуту, подготавливая систематизированные конспекты и источники.",
          points: [
            "Анализ научных и академических статей",
            "Создание готовых конспектов и краткого содержания по теме",
            "Автоматическое выявление и исправление слабых мест в знаниях"
          ],
          btn: "Попробовать Глубокий Поиск"
        },
        {
          badge: "Преимущество 4: Анализ в Реальном Времени",
          title: "Умная ИИ-Экосистема и Анализ Знаний",
          desc: "Вся ваша учебная активность, решенные тесты и слабые навыки автоматически собираются и анализируются в единой умной панели управления.",
          points: [
            "Формирование специальных заданий, направленных на слабые места",
            "Счетчик ежедневных непрерывных серий обучения (Streak)",
            "Автоматический анализ динамики роста вашей Базы и уровня знаний"
          ],
          btn: "Присоединиться к Экосистеме"
        }
      ],
      howItWorksTitle: "Как Работает Knowza AI?",
      howItWorksSteps: [
        {
          stepNumber: "01",
          badge: "ШАГ 1: ПОСТАНОВКА ЦЕЛИ ОБУЧЕНИЯ",
          title: "Выбор Направления: IELTS, SAT или Национальный Сертификат",
          description: "Ученик выбирает направление (IELTS, SAT или Национальный Сертификат) для построения прочной базы и фундаментальных знаний с нуля.",
          points: [
            "Выбор IELTS, SAT и Национального Сертификата для построения прочной базы знаний",
            "Точная диагностика текущего уровня знаний",
            "Создание сильного фундамента и установка четких сроков"
          ],
          image: "/banner/knowza_ai_step1.png"
        },
        {
          stepNumber: "02",
          badge: "ШАГ 2: ФОРМИРОВАНИЕ ЛИЧНОГО ПЛАНА",
          title: "Автоматический Индивидуальный Путь (Roadmap)",
          description: "На основе сильных и слабых сторон ученика Knowza AI формирует ежедневные фундаментальные учебные миссии и интеллектуальную Roadmap.",
          points: [
            "Обязательные ежедневные фундаментальные учебные миссии",
            "Интенсивные уроки, ориентированные на слабые темы",
            "График прогресса усвоения и фундаментального развития"
          ],
          image: "/banner/knowza_ai_step2.png"
        },
        {
          stepNumber: "03",
          badge: "ШАГ 3: ОБЩЕНИЕ С УМНЫМ НАСТАВНИКОМ",
          title: "Вопросы и Ответы с ИИ-Наставником 24/7",
          description: "Ученик задает ИИ-наставнику любой непонятный математический или научный вопрос и получает пошаговые объяснения на простых примерах.",
          points: [
            "Пошаговое решение формул по Математике, Физике, Химии",
            "Проверка текстов и исправление фундаментальных ошибок",
            "Возможность задавать вопросы непрерывно 24/7 в любое время"
          ],
          image: "/banner/knowza_ai_step3.png"
        },
        {
          stepNumber: "04",
          badge: "ШАГ 4: АНАЛИЗ В РЕАЛЬНОМ ВРЕМЕНИ",
          title: "Анализ Слабых Мест и Роста Фундаментальных Знаний",
          description: "Решенные тесты и ошибки автоматически анализируются, и отслеживается рост вашего уровня фундаментальных знаний.",
          points: [
            "Специальные задания, направленные на слабые навыки",
            "Счетчик серий (Streak) — ежедневное непрерывное обучение",
            "Автоматический анализ роста вашего уровня фундаментальных знаний"
          ],
          image: "/banner/knowza_ai_step4.png"
        }
      ],
      researchSection: {
        badge: "Научные Исследования и Архитектура",
        title: "Техническая Исследовательская Работа Knowza AI",
        author: "Ташкент — 2026 | Автор:",
        description: "Данная научно-исследовательская работа, созданная нашим автором, научно обосновывает пути безопасной, эффективной и устойчивой интеграции искусственного интеллекта для платформ EdTech. Просим вас ознакомиться с работой.",
        downloadBtn: "Скачать Исследовательскую Работу"
      },
      pricingTitleBadge: "Тарифные Планы",
      pricingTitleMain: "Выберите Подходящий Вам Тариф",
      pricingDesc: "Снимите все ограничения и используйте полную мощь Knowza AI. Отменить можно в любое время — без обязательств.",
      pricingPlans: [
        {
          months: 1,
          title: "Подписка на 1 Месяц",
          price: "99 000 UZS",
          monthlyPrice: "99 000 UZS / мес",
          monthlyPriceLabel: "Ежемесячный платеж",
          desc: "Для снятия всех ограничений и полного использования платформы.",
          recommended: false,
          benefits: ["Еженедельные исследования ИИ без ограничений", "Выбор до 3 учебных целей одновременно", "Обновление учебного плана без ограничений", "Управление и персонализация памяти ИИ"]
        },
        {
          months: 3,
          title: "Подписка на 3 Месяца",
          price: "249 000 UZS",
          monthlyPrice: "83 000 UZS / мес",
          monthlyPriceLabel: "Новая цена",
          desc: "Оптимальное время и цена для построения прочной базы и фундаментальных знаний.",
          recommended: true,
          benefits: ["Еженедельные исследования ИИ без ограничений", "Выбор до 3 учебных целей одновременно", "Обновление учебного плана без ограничений", "Управление и персонализация памяти ИИ"]
        },
        {
          months: 9,
          title: "Подписка на 9 Месяцев",
          price: "599 000 UZS",
          monthlyPrice: "66 500 UZS / мес",
          monthlyPriceLabel: "Новая цена",
          desc: "Все функции Pro по самой низкой цене на весь учебный год.",
          recommended: false,
          benefits: ["Еженедельные исследования ИИ без ограничений", "Выбор до 3 учебных целей одновременно", "Обновление учебного плана без ограничений", "Управление и персонализация памяти ИИ"]
        }
      ],
      pricingBtn: "Начать",
      pricingRecommendedBadge: "Рекомендуется",
      faqTitleBadge: "Вопросы и Ответы",
      faqTitleMain: "Часто Задаваемые Вопросы",
      faqs: [
        {
          q: "Что такое Knowza AI и чем он отличается от обычного ChatGPT?",
          a: "Knowza AI — это экосистема искусственного интеллекта, на 100% адаптированная к системе образования. Он не просто отвечает на вопросы, но определяет ваш уровень знаний, создает персональную Roadmap для построения базы и фундаментальных знаний с нуля и анализирует ваши слабые навыки."
        },
        {
          q: "Как построить базу знаний по IELTS, SAT и Национальному Сертификату с ИИ-Наставником?",
          a: "Вы можете построить фундаментальную базу знаний по IELTS (Grammar, Vocabulary, Writing, Speaking), SAT Math/Verbal и модулям Национального Сертификата."
        },
        {
          q: "Как работает Персональная Roadmap?",
          a: "Вы вводите свою учебную цель и свободное время. Система автоматически разрабатывает пошаговый график фундаментальных знаний, разделенный на ежедневные и еженедельные миссии."
        },
        {
          q: "Бесплатно ли использование платформы?",
          a: "Базовые функции и бесплатный тестовый режим открыты для всех пользователей. Тариф Pro доступен для более глубоких исследований и эксклюзивных возможностей ИИ-персонажа."
        }
      ],
      globeSection: {
        badge: "Глобальная Экосистема",
        title: "Учитесь из Любой Точки Мира с Knowza AI",
        subtitle: "Без границ и расстояний — интеллектуальная образовательная платформа, доступная в любой точке земного шара."
      }
    }
  };

  const cData = localizedData[lang] || localizedData['UZ'];
  const howItWorksSteps = cData.howItWorksSteps;
  const faqs = cData.faqs;

  useEffect(() => {
    const triggerAos = () => {
      const elements = document.querySelectorAll('.aos-blur');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.95) {
          el.classList.add('aos-active');
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-active');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 50px 0px' }
    );

    const elements = document.querySelectorAll('.aos-blur');
    elements.forEach((el) => observer.observe(el));

    // Automatically activate visible AOS elements right after loader finishes
    const timer1 = setTimeout(triggerAos, 150);
    const timer2 = setTimeout(triggerAos, 800);
    const timer3 = setTimeout(triggerAos, 1500);

    window.addEventListener('load', triggerAos);

    document.body.style.backgroundColor = '#e8edff';
    document.documentElement.style.backgroundColor = '#e8edff';

    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('load', triggerAos);
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  const handleStartClick = () => {
    if (isAuthenticated) {
      navigate('/knowza-ai/dashboard');
    } else {
      navigate('/knowza-ai/onboarding');
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#e8edff] text-[#1c1b1b] font-['Plus_Jakarta_Sans',sans-serif] antialiased pt-0">
      <style>{`
        .aos-blur {
          opacity: 0;
          filter: blur(14px);
          transform: translateY(36px);
          transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
                      filter 0.85s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, filter, transform;
        }
        .aos-blur.aos-active {
          opacity: 1;
          filter: blur(0px);
          transform: translateY(0);
        }
      `}</style>

      <Seo 
        title="Knowza AI — AI Tutor for IELTS, SAT & National Certificate"
        description="AI-powered personal tutor for IELTS, SAT, and National Certificate preparation. Get personalized study roadmaps, practice, progress tracking, and smarter learning with Knowza AI."
        image="/banner/knowza_ai_weblink.png"
        icon="/banner/Knowza-logo-mini.png"
      />

      {/* ─── HERO SECTION WITH BLUE THEME BORDERS & LOGOS ─── */}
      <div className="aos-blur">
        <FUIHeroWithBorders 
          badgeText={cData.hero.badgeText}
          title={
            <span>
              {cData.hero.titleStart}{" "}
              <span className="bg-gradient-to-r from-[#1f42ba] via-[#274ed5] to-[#3b82f6] text-transparent bg-clip-text drop-shadow-sm inline-block">
                Knowza AI
              </span>{" "}
              {cData.hero.titleEnd}
            </span>
          }
          subtitle={cData.hero.subtitle}
          primaryBtnText={cData.hero.primaryBtn}
          secondaryBtnText={cData.hero.secondaryBtn}
          onPrimaryClick={handleStartClick}
          onSecondaryClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* ─── WHAT THE CLIENT GETS (DETAILED FEATURE SHOWCASES) ─── */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-20 scroll-mt-24">
        
        {/* Section Main Title */}
        <div className="text-center max-w-3xl mx-auto mb-6 aos-blur">
          <span className="px-4 py-1.5 rounded-full bg-[#e8edff] text-[#274ed5] text-[13px] font-extrabold uppercase tracking-wider">
            {cData.showcasesTitleBadge}
          </span>
          <h2 className="text-[28px] sm:text-[38px] font-extrabold text-[#1c1b1b] mt-4 leading-tight tracking-normal">
            {cData.showcasesTitleMain}
          </h2>
        </div>

        {/* Showcases */}
        {cData.showcases.map((showcase, idx) => {
          const isReversed = idx % 2 !== 0;
          const imageSrc = [
            "/banner/knowza_ai_tutor.png",
            "/banner/knowza_ai_roadmap.png",
            "/banner/knowza_ai_research.png",
            "/banner/knowza_ai_hero.png"
          ][idx];

          return (
            <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center aos-blur">
              <div className={`lg:col-span-6 text-left ${isReversed ? 'lg:order-2' : ''}`}>
                <span className="px-3.5 py-1.5 rounded-full bg-[#e8edff] text-[#274ed5] text-[12px] font-bold uppercase tracking-wider">
                  {showcase.badge}
                </span>
                <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[#1c1b1b] mt-4 mb-4 leading-tight tracking-normal">
                  {showcase.title}
                </h2>
                <p className="text-[16px] text-[#444654] font-medium leading-relaxed mb-6">
                  {showcase.desc}
                </p>
                <ul className="space-y-3 font-semibold text-[#1c1b1b] text-[15px] mb-8">
                  {showcase.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#e8edff] text-[#274ed5] flex items-center justify-center font-bold text-[14px]">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-2">
                  <button 
                    onClick={handleStartClick} 
                    className="hero-btn-pill w-full sm:w-auto px-8 py-3.5 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] !text-white font-bold rounded-[14px] !border-none cursor-pointer active:scale-[0.97] transition-all duration-150 shadow-md inline-flex items-center justify-center"
                    style={{ color: '#ffffff !important', borderRadius: '14px' }}
                  >
                    <span className="!text-white font-bold text-[15px]" style={{ color: '#ffffff' }}>{showcase.btn}</span>
                  </button>
                </div>
              </div>

              <div className={`lg:col-span-6 ${isReversed ? 'lg:order-1' : ''}`}>
                <div className="rounded-3xl overflow-hidden border border-[#e5e2e1] shadow-lg bg-white p-3">
                  <img src={imageSrc} alt={`${showcase.title} Showcase`} className="w-full h-auto object-cover rounded-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── SHADCN FEATURES-8 GRID BLOCK ─── */}
      <div className="aos-blur">
        <Features />
      </div>

      {/* ─── 3D COVERFLOW IMAGE SLIDER (KNOWZA AI SHOWCASE) ─── */}
      <section id="demo" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-24 aos-blur">
        <div id="how-it-works" className="scroll-mt-24">
          
          <div className="text-center mb-12 sm:mb-16 aos-blur">
            <h2 className="text-[28px] sm:text-[38px] font-extrabold text-[#1c1b1b] leading-tight tracking-normal">
              {cData.howItWorksTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            <div className="lg:col-span-5 text-left flex flex-col justify-between min-h-[380px] sm:min-h-[400px]">
              
              <div className="min-h-[300px] sm:min-h-[310px] flex flex-col justify-start">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(12px)' }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e8edff] text-[#274ed5] text-[11px] font-bold uppercase tracking-wider mb-3">
                      <span>{howItWorksSteps[currentStepIndex].stepNumber}</span>
                      <span>•</span>
                      <span>{howItWorksSteps[currentStepIndex].badge}</span>
                    </div>

                    <h3 className="text-[24px] sm:text-[30px] font-black text-[#1c1b1b] leading-tight mb-3">
                      {howItWorksSteps[currentStepIndex].title}
                    </h3>

                    <p className="text-[14px] sm:text-[15px] text-[#444654] font-medium leading-relaxed mb-5">
                      {howItWorksSteps[currentStepIndex].description}
                    </p>

                    <ul className="space-y-2.5 font-semibold text-[#1c1b1b] text-[14px]">
                      {howItWorksSteps[currentStepIndex].points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#e8edff] text-[#274ed5] flex items-center justify-center font-bold text-[12px] shrink-0">✓</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-2">
                <button 
                  onClick={handlePrevSlide}
                  className="w-11 h-11 rounded-2xl bg-white border border-[#e5e2e1] flex items-center justify-center text-[#1c1b1b] cursor-pointer active:scale-95 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                </button>
                
                <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#e5e2e1] rounded-2xl">
                  {howItWorksSteps.map((_, idx) => {
                    const isActive = currentStepIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectSlide(idx)}
                        className="relative h-2.5 flex items-center justify-center cursor-pointer p-0 border-0 bg-transparent outline-none"
                        style={{ width: isActive ? '32px' : '10px' }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#e5e2e1] block" />
                        {isActive && (
                          <span
                            className="absolute inset-0 w-8 h-2.5 bg-[#274ed5] rounded-full z-10 block transition-all duration-300"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={handleNextSlide}
                  className="w-12 h-12 rounded-2xl bg-white border border-[#e5e2e1] flex items-center justify-center text-[#1c1b1b] cursor-pointer active:scale-95 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative w-full py-4 flex items-center justify-center min-h-[340px] sm:min-h-[440px]">
                <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[420px] flex items-center justify-center">
                  {howItWorksSteps.map((step, idx) => {
                    const total = howItWorksSteps.length;
                    let offset = idx - currentStepIndex;
                    if (offset > total / 2) offset -= total;
                    if (offset < -total / 2) offset += total;

                    let x = "0%";
                    let scale = 0.65;
                    let opacity = 0;
                    let filter = "blur(12px)";
                    let zIndex = 0;
                    let border = "1px solid transparent";

                    if (offset === 0) {
                      x = "0%";
                      scale = 1;
                      opacity = 1;
                      filter = "blur(0px)";
                      zIndex = 30;
                      border = "2px solid rgba(39, 78, 213, 0.4)";
                    } else if (offset === -1) {
                      x = "-55%";
                      scale = 0.82;
                      opacity = 0.45;
                      filter = "blur(1px)";
                      zIndex = 10;
                      border = "1px solid #e5e2e1";
                    } else if (offset === 1) {
                      x = "55%";
                      scale = 0.82;
                      opacity = 0.45;
                      filter = "blur(1px)";
                      zIndex = 10;
                      border = "1px solid #e5e2e1";
                    }

                    return (
                      <motion.div
                        key={idx}
                        onClick={() => {
                          if (offset !== 0) handleSelectSlide(idx);
                        }}
                        initial={false}
                        animate={{
                          x,
                          scale,
                          opacity,
                          filter,
                          zIndex,
                          border,
                          pointerEvents: offset === 0 || offset === -1 || offset === 1 ? 'auto' : 'none'
                        }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 1, 0.5, 1]
                        }}
                        className="absolute top-0 aspect-square h-full rounded-3xl overflow-hidden bg-white p-2 sm:p-3 shadow-xl cursor-pointer"
                      >
                        <img 
                          src={step.image} 
                          alt={step.title} 
                          className="w-full h-full object-cover rounded-2xl shadow-sm"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── RESEARCH PAPER SECTION ─── */}
      <section id="research" className="py-20 bg-gradient-to-b from-[#f8fafd] to-white border-t border-[#e5e2e1] scroll-mt-24 aos-blur">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">

          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 py-1.5 rounded-full bg-[#274ed5]/10 text-[#274ed5] text-[13px] font-bold tracking-wider uppercase inline-flex items-center gap-2 mb-6"
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            {cData.researchSection.badge}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-[32px] sm:text-[42px] font-black text-[#1c1b1b] mt-2 leading-tight"
          >
            {cData.researchSection.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-[16px] text-gray-600 mt-3 font-medium"
          >
            {cData.researchSection.author} <strong className="text-[#1c1b1b]">Jakhongir Tukhtaev (JJ)</strong>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="text-[16px] text-gray-500 mt-6 leading-relaxed max-w-2xl mx-auto"
          >
            {cData.researchSection.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            <a
              href="/researches/Research_Paper_Jakhongir_Tukhtaev_v1.1.docx"
              download="Research_Paper_Jakhongir_Tukhtaev_v1.1.docx"
              className="hero-btn-pill inline-flex items-center gap-2.5 px-8 h-14 rounded-[14px] bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] !border-none text-white font-bold text-base active:scale-95 transition-transform duration-150 cursor-pointer"
              style={{ borderRadius: '14px' }}
            >
              <span className="material-symbols-outlined text-[22px]">download</span>
              {cData.researchSection.downloadBtn} (979 KB)
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING SECTION ─── */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-[#f0f4ff] to-white border-t border-[#e5e2e1] scroll-mt-24 aos-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 aos-blur">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="px-4 py-1.5 rounded-full bg-[#274ed5]/10 text-[#274ed5] text-[13px] font-bold tracking-wider uppercase inline-flex items-center gap-2 mb-5"
            >
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              {cData.pricingTitleBadge}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-[32px] sm:text-[42px] font-black text-[#1c1b1b] mt-2 leading-tight"
            >
              {cData.pricingTitleMain}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-[16px] text-gray-500 mt-4 leading-relaxed max-w-2xl mx-auto"
            >
              {cData.pricingDesc}
            </motion.p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pt-6">
            {cData.pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: 0.1 * (idx + 1), ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white rounded-3xl p-8 flex flex-col justify-between relative ${
                  plan.recommended
                    ? 'border-2 border-[#274ed5]'
                    : 'border border-[#e5e2e1]'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#1f42ba] to-[#4f75ff] text-white px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap z-10">
                    <span className="material-symbols-outlined text-[13px]">star</span>
                    {cData.pricingRecommendedBadge}
                  </div>
                )}

                <div>
                  <h3 className="text-[18px] font-black text-[#1c1b1b] mb-1.5">{plan.title}</h3>
                  <p className="text-[13px] text-gray-500 font-medium mb-5 min-h-[40px] leading-snug">{plan.desc}</p>

                  <div className="mb-5">
                    <span className="text-[38px] font-black text-[#1c1b1b] leading-none">{plan.price}</span>
                    {plan.months > 1 ? (
                      <p className="text-[13px] font-bold text-emerald-600 mt-1.5">{plan.monthlyPriceLabel}: {plan.monthlyPrice}</p>
                    ) : (
                      <p className="text-[13px] font-semibold text-gray-400 mt-1.5">{plan.monthlyPriceLabel}: {plan.monthlyPrice}</p>
                    )}
                  </div>

                  <div className="h-px bg-[#f0f0f0] my-5" />

                  <ul className="space-y-3 mb-0">
                    {plan.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#274ed5] shrink-0 text-[18px] mt-0.5">check_circle</span>
                        <span className="text-[13px] font-semibold text-[#444654] leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="/knowza-ai/onboarding"
                  className={`hero-btn-pill w-full h-12 rounded-[14px] flex items-center justify-center gap-2 font-bold text-[14px] active:scale-95 transition-transform duration-150 cursor-pointer mt-8 ${
                    plan.recommended
                      ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] !border-none text-white'
                      : 'bg-[#f3f4f6] text-[#1c1b1b] border border-[#e5e2e1] hover:border-[#274ed5]/40'
                  }`}
                  style={{ borderRadius: '14px' }}
                >
                  <span>{cData.pricingBtn}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </a>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faq" className="py-16 bg-white border-t border-[#e5e2e1] scroll-mt-24 aos-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 aos-blur">
            <span className="px-4 py-1 rounded-full bg-[#e8edff] text-[#274ed5] text-[13px] font-bold uppercase">
              {cData.faqTitleBadge}
            </span>
            <h2 className="text-[30px] font-black text-[#1c1b1b] mt-3">{cData.faqTitleMain}</h2>
          </div>

          <div className="space-y-4 aos-blur">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className={`bg-[#f8f9fc] border transition-all duration-300 rounded-2xl p-5 cursor-pointer ${
                    isOpen ? 'border-[#274ed5]/40 shadow-sm bg-white' : 'border-[#e5e2e1] hover:border-[#274ed5]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-bold text-[#1c1b1b]">{faq.q}</h3>
                    <motion.span 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="material-symbols-outlined text-[#274ed5] shrink-0"
                    >
                      keyboard_arrow_down
                    </motion.span>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-[14px] text-[#444654] font-medium mt-3 leading-relaxed border-t border-[#e5e2e1] pt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── GLOBE SECTION ─── */}
      <section id="global" className="pt-16 pb-0 mb-0 bg-gradient-to-b from-white via-[#f0f4ff] to-[#e8edff] border-t border-[#e5e2e1] overflow-hidden aos-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="px-4 py-1.5 rounded-full bg-[#e8edff] text-[#274ed5] text-[13px] font-extrabold uppercase tracking-wider">
            {cData.globeSection?.badge || "Global Ekotizim"}
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-black text-[#1c1b1b] mt-4 leading-tight">
            {cData.globeSection?.title || "Butun Dunyo Bo'ylab Knowza AI Bilan O'rganishadi"}
          </h2>
          <p className="text-[16px] text-gray-500 mt-3 max-w-2xl mx-auto font-medium">
            {cData.globeSection?.subtitle || "O'zbekiston va butun dunyodagi o'quvchilar va talabalarni birlashtiruvchi intellektual ta'lim platformasi."}
          </p>

          <div className="mt-4 sm:mt-6 relative flex h-[210px] sm:h-[320px] md:h-[400px] w-full items-center justify-center overflow-hidden pointer-events-none select-none mb-0 pb-0">
            <Globe className="bottom-[-250px] sm:bottom-[-370px] md:bottom-[-430px] left-1/2 -translate-x-1/2 w-[500px] sm:w-[740px] md:w-[860px] max-w-none" />
          </div>

        </div>
      </section>

      {/* ─── CROSS-NAVIGATION LINKS (SEO internal linking - Visually Hidden) ─── */}
      <section className="sr-only">
        <nav aria-label="SEO Navigation">
          <Link to="/">Knowza Ecosystem</Link>
          <Link to="/knowza-lms">Knowza LMS</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </section>

    </div>
  );
};


export default KnowzaAIHome;
