# 🎓 Knowza — Ta'lim Markazlari Uchun Raqamli Ekotizim

[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite-orange.svg)]()
[![Backend](https://img.shields.io/badge/backend-Django%205%20%7C%20DRF-blue.svg)]()
[![Docs](https://img.shields.io/badge/docs-public%20overview-purple.svg)]()

**Knowza** — maktablar, o'quv markazlari, ustozlar va o'quvchilar uchun qurilgan katta EdTech platforma. Bu faqat test yechish sayti emas. Knowza ichida test, guruh, fan, dars jadvali, uyga vazifa, reyting, premium, star, support, analytics va AI yordamchi bitta tizimda ishlaydi.

Bu repository Knowza loyihasini GitHub'da tushuntirish uchun ochiq overview hisoblanadi. Kodning nozik joylari, secret key, parol, real baza sxemasi va private server sozlamalari bu yerda berilmaydi.

## Qisqa Gap

Knowza'ning asosiy g'oyasi oddiy:

> O'quv markazi yoki maktab o'z odamlarini, testlarini, darslarini, natijalarini va to'lovga yaqin jarayonlarini bitta joyda boshqara olishi kerak.

Platforma uchta katta muammoni hal qiladi:

- **Adolatli test**: test vaqti, session, natija va ban faqat browserga ishonib qolmaydi.
- **Tartibli boshqaruv**: admin, sub-admin, teacher va studentlar o'z roliga mos panel ko'radi.
- **Motivatsiya**: o'quvchi faqat ball emas, XP, streak, star, league va profil yutuqlarini ham ko'radi.

## Ecosystem Repository'lar

Knowza ikki katta qismdan iborat:

| Qism | Repository | Vazifa |
|---|---|---|
| Frontend | [Test-App](https://github.com/Jonizz14/Test-App) | React/Vite SPA, sahifalar, dashboardlar, UI, test ishlash oynasi |
| Backend | [Django-Test-App-Backend](https://github.com/Jonizz14/Django-Test-App-Backend) | Django REST API, auth, test session, role permission, analytics, billing, AI endpointlar |
| Overview | Bu repository | GitHub uchun xavfsiz loyiha ta'rifi, changelog, demo flow va pitch materiallar |

## Texnologiyalar

| Layer | Ishlatilgan texnologiyalar |
|---|---|
| Frontend | React 19, Vite, React Router, TanStack Query, Axios |
| UI | Ant Design, MUI, Radix UI, Tailwind CSS, custom CSS |
| Animation | Framer Motion, GSAP, AnimeJS, AOS, Lottie |
| Charts | ECharts, Chart.js |
| Math | KaTeX |
| Localization | i18next: UZ, RU, EN |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| DB | PostgreSQL yoki SQLite local/dev uchun |
| API docs | Swagger va ReDoc |
| Ops | Docker, Gunicorn, media/static yo'llari, cache yo'llari |

## Public-Safe Architecture

```text
Foydalanuvchi browserda ishlaydi
        |
        v
React / Vite frontend
        |
        | REST API + JWT token
        v
Django REST Framework backend
        |
        | role check + service logic + audit log
        v
Database + media storage + optional cache
```

Bu GitHub overview faqat yuqori darajadagi arxitekturani aytadi. Quyidagi narsalar ochilmaydi:

- real `.env` qiymatlari;
- secret key va tokenlar;
- real admin login/parollari;
- production server ichki sozlamalari;
- anti-cheat'ni aylanib o'tishga yordam beradigan exact detal;
- private deployment yoki database credential'lari.

To'liq public-safe texnik izoh: [`docs/SAFE_ARCHITECTURE_UZ.md`](docs/SAFE_ARCHITECTURE_UZ.md).

## Asosiy Modullar

### 1. Multi-role platforma

Knowza har bir odamga o'z roli bo'yicha panel beradi:

- **Head Admin**: butun platforma, adminlar, tariflar, support, business analytics.
- **Admin**: o'z o'quv markazi yoki maktabi ichidagi teacher, student, group, subject, schedule.
- **Sub-admin**: admin bergan filial yoki bo'lim ichida ishlaydi.
- **Teacher**: test, module, savol, homework, class analytics va o'quvchi natijalari.
- **Student**: testlar, natijalar, homework, profile, league, stars, support va AI yordam.
- **Seller / Content Manager**: platformaning monetizatsiya va kontent tomoni uchun yordamchi rollar.

### 2. Test va session engine

Knowza'da test oddiy form emas. Test jarayoni backend session bilan boshqariladi:

- test boshlanganda session yaratiladi;
- vaqt backendda nazorat qilinadi;
- javoblar session davomida saqlanadi;
- yakunda score backendda hisoblanadi;
- attempt tarixi yoziladi;
- XP, star, streak va boshqa effectlar yangilanadi.

Bu model testni ishonchliroq qiladi, chunki browser bitta o'zi “haqiqat manbasi” bo'lib qolmaydi.

### 3. Anti-cheat va ban nazorati

Platforma test vaqtida shubhali holatlarni yozib boradi. Masalan, test oynasidan chiqish yoki focus yo'qolishi kabi holatlar. Bu ma'lumotlar backendga yuboriladi va audit qilinadi.

Public hujjatda aniq ichki threshold va bypass detallar aytilmaydi. Maqsad — tizim qanday himoya yo'nalishida ishlashini tushuntirish, xavfsizlikni zaiflashtirish emas.

### 4. Academic operations

Knowza o'quv markazining kundalik ishlarini ham qamrab oladi:

- institution group / class group;
- subject;
- classroom;
- teacher-class assignment;
- class schedule slot;
- homework;
- homework attachment;
- extra lessons.

Bu sababli loyiha faqat test platforma emas, balki LMS/CRM yo'nalishiga yaqin to'liq tizimdir.

### 5. Analytics va activity logs

Knowza turli rollar uchun dashboardlar beradi:

- student progress;
- teacher rating;
- class rating;
- test analytics;
- head admin business analytics;
- activity logs;
- AI usage logs;
- daily analytics aggregate.

Analytics rahbar va ustozga “kim orqada qolyapti?”, “qaysi guruh sust?”, “qaysi test ko'p ishlanyapti?” kabi savollarga tezroq javob beradi.

### 6. Gamification

Student uchun motivatsiya modullari bor:

- XP;
- streak;
- stars;
- premium profile;
- profile likes/gifts;
- league va ranking;
- classmate/teacher profile sahifalari.

Bu o'quvchini platformaga qayta kirishga va testni oxirigacha ishlashga undaydi.

### 7. Monetizatsiya

Knowza'da monetizatsiya ikki yo'nalishda qurilgan:

- **B2B**: admin tariflari, markaz/maktab uchun planlar, limitlar va tariff requestlar.
- **B2C**: student premium, star package, premium test, profile customization.

Monetizatsiya operatsiyalari alohida history/audit bilan kuzatiladi.

### 8. AI yordamchi layer

Knowza ichida AI bilan bog'liq yo'nalishlar ham bor:

- teacher uchun test generation;
- student consult;
- teacher assistant;
- student/group analysis;
- file processing;
- AI usage limit va usage stats;
- knowledge qo'shish va query qilish yo'llari.

AI qismi public overview'da faqat product darajasida aytiladi. API key, provider secret va private prompt detallar berilmaydi.

## Eng Muhim Feature'lar

- JWT login, register, token refresh, email verification, password reset.
- Knowza ID / display ID bilan user topish va login flow.
- Role-based route guard va dashboardlar.
- Admin/sub-admin/teacher/student boshqaruvi.
- Bulk import: student, teacher, subject, group, classroom, schedule uchun qulay import yo'llari.
- Test builder: draft, publish, savol, option image, question image, module, class group, premium/star price.
- Server-side test session: start, get, update answers, complete, auto-expire.
- Anti-cheat monitoring: violation log, test ban, student ban status.
- Homework calendar va attachmentlar.
- Schedule calendar, classroom va teacher assignment.
- Tariff system: planlar, limitlar, admin request, approval/rejection.
- Student economy: stars, premium, purchase, refund/reverse operation.
- Profile likes/gifts, pinned likes, premium profile sozlamalari.
- League: auto assign, start, stop, clear, group va participant tracking.
- Support ticket va contact message reply flow.
- Site updates/news, public update list.
- Analytics event tracking va dashboard statistikalar.
- AI generate test, consult, assistant, analysis, stream chat.
- UZ/RU/EN localization va public legal pages.
- Performance optimizations: lazy routes, image optimization, caching, N+1 query kamaytirish.

Batafsil feature ro'yxati: [`docs/FEATURES_UZ.md`](docs/FEATURES_UZ.md).

## Changelog

Oxirgi katta ishlar ikki repo tarixidan yig'ildi:

- Frontend: Knowza rebrand, yangi home content, localization kengayishi, session expiry UI, tariff limit UI, schedule/classroom UI, toast system, panel refresh, loading states, business analytics, homework calendar.
- Backend: `/users/me/`, tenant scoping, identifier masking, classroom bulk import, tariff limit logic, threaded email, email notificationlar, performance optimization, cache invalidation, analytics event, classroom/schedule/homework, AI guard va JSON response yaxshilanishlari.

To'liq public changelog: [`docs/CHANGELOG_UZ.md`](docs/CHANGELOG_UZ.md).

## Demo Qanday Ko'rsatiladi

Demo odatda shu tartibda yaxshi chiqadi:

1. Landing page va public sahifalar.
2. Head Admin analytics va tariff control.
3. Admin panel: user, group, subject, classroom, schedule.
4. Teacher panel: test builder, homework, class stats.
5. Student panel: test session, result, profile, league.
6. Swagger/ReDoc orqali API mavjudligini ko'rsatish.

Demo script: [`presentation/DEMO_FLOW.md`](presentation/DEMO_FLOW.md).

## Roadmap

Kelajakda qo'shilishi mumkin bo'lgan yo'nalishlar:

- mobile app;
- parent dashboard;
- attendance va classroom journal;
- payment gateway;
- marketplace;
- certificate generator;
- advanced AI tutor;
- stronger proctoring;
- branch management;
- Telegram/SMS/email notification center.

## Hujjatlar Xarita

| Fayl | Nima uchun kerak |
|---|---|
| [`docs/FEATURES_UZ.md`](docs/FEATURES_UZ.md) | Modul va role bo'yicha katta feature izohi |
| [`docs/CHANGELOG_UZ.md`](docs/CHANGELOG_UZ.md) | Frontend/backend yangiliklari va refactorlar |
| [`docs/SAFE_ARCHITECTURE_UZ.md`](docs/SAFE_ARCHITECTURE_UZ.md) | Xavfsiz, public arxitektura izohi |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Endpoint guruhlari va API map |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Diagramma va tizim qatlamlari |
| [`presentation/DEMO_FLOW.md`](presentation/DEMO_FLOW.md) | Demo ko'rsatish tartibi |
| [`presentation/PITCH_DECK.md`](presentation/PITCH_DECK.md) | Pitch deck matni va story |

## License

Bu overview repository MIT license ostida. Real product deployment, private config va server credential'lar bu public repo ichiga kiritilmaydi.
