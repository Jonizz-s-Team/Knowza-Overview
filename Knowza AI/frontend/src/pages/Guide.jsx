import React from 'react';
import Seo from '../../components/Seo';
import { useTranslation } from 'react-i18next';

const Guide = () => {
  const { t } = useTranslation();
  const allFeatures = [
    {
      category: t("Asosiy"),
      title: t("Bosh sahifa"),
      desc: t("Platformaning yuragi. Har kungi o'quv jarayonining qisqacha ko'rinishi."),
      details: [
        t("Bugungi kun uchun rejalashtirilgan vazifalar ko'rsatiladi"),
        t("Umumiy o'quv jarayoni va statistikalarni kuzatish imkoni"),
        t("Kunlik motivatsion e'lonlar va yangiliklar")
      ],
      tip: t("Har kuni darsni aynan Bosh sahifadan boshlang va vazifalarga ko'z yugurtirib chiqing."),
      icon: "home",
      color: "#1c1b1b",
      bg: "#f0f2f5"
    },
    {
      category: t("Sun'iy Intellekt"),
      title: t("AI Reja"),
      desc: t("Sizning shaxsiy va to'liq moslashtirilgan o'quv xaritangiz."),
      details: [
        t("Profilingizdagi maqsadga asosan tuzilgan haftalik rejalar"),
        t("Har kuni nima o'qish kerakligi aniq belgilanadi"),
        t("Rejani istalgan vaqt yangilash mumkin (bepul tarifda 3 marta)"),
        t("Orqa fonda tuziladi - kutib o'tirish shart emas")
      ],
      tip: t("Reja og'irlik qilsa, profilingizdan o'quv soatini o'zgartirib qayta tuzib ko'ring."),
      icon: "map",
      color: "#274ed5",
      bg: "#e8edff"
    },
    {
      category: t("Sun'iy Intellekt"),
      title: t("AI Ustoz"),
      desc: t("Siz bilan jonli suhbatlashuvchi aqlli shaxsiy o'qituvchi."),
      details: [
        t("Murakkab teoremalarni sodda tilda tushuntirib beradi"),
        t("Yozgan insholaringizni grammatik xatolarga tekshiradi"),
        t("Testlardagi tushunmagan savollarni qadam-baqadam yechadi"),
        t("IELTS, SAT sirlari va strategiyalarini o'rgatadi")
      ],
      tip: t("\"Menga Kvant Fizikasini 10 yoshli bolaga tushuntirgandek tushuntir\" deb buyruq berib ko'ring."),
      icon: "smart_toy",
      color: "#e91e63",
      bg: "#fce4ec"
    },
    {
      category: t("Sun'iy Intellekt"),
      title: t("AI Izlanish"),
      desc: t("Internetdan tezkor ma'lumot qidirib maqola yozuvchi bot."),
      details: [
        t("Eng so'nggi ma'lumotlarni qidirib, chuqur tahlil qiladi"),
        t("Faktlarga asoslangan taqdimot yoki referat matni tuzadi"),
        t("Jarayon butunlay orqa fonda ishlaydi va o'zi xabar beradi")
      ],
      tip: t("Ilmiy ishlar va mustaqil ishlar uchun ishonchli material qidirishda foydalaning."),
      icon: "auto_awesome",
      color: "#9c27b0",
      bg: "#f3e5f5"
    },
    {
      category: t("Boshqaruv"),
      title: t("Kutubxona"),
      desc: t("Siz saqlagan barcha muhim ma'lumotlar va maqolalar arxivi."),
      details: [
        t("AI Izlanish orqali yozilgan maqolalar avtomatik saqlanadi"),
        t("AI Ustoz bilan bo'lgan muhim suhbatlarni arxivlash mumkin"),
        t("Tezkor qidiruv orqali kerakli ma'lumotni darhol topish")
      ],
      tip: t("Kerakli formulalar va sanalarni unutup qo'ymaslik uchun darhol Kutubxonaga saqlang."),
      icon: "local_library",
      color: "#00bcd4",
      bg: "#e0f7fa"
    },
    {
      category: t("Boshqaruv"),
      title: t("Tahlillar"),
      desc: t("O'zlashtirishingiz va natijalaringiz haqida to'liq statistika."),
      details: [
        t("Topshiriqlarni bajarish foizini grafiklarda ko'rish"),
        t("Platformada umumiy o'tkazgan vaqtingiz hisoboti"),
        t("Qaysi mavzularda oqsab qolayotganingiz tahlili")
      ],
      tip: t("Haftada bir marta O'sish grafigingizni tekshirib, xatolarni tahlil qiling."),
      icon: "leaderboard",
      color: "#4caf50",
      bg: "#e8f5e9"
    },
    {
      category: t("Boshqaruv"),
      title: t("Profil"),
      desc: t("Tizim sizni yaxshiroq tanishi uchun shaxsiy sozlamalar."),
      details: [
        t("Ism, yosh va qiziqishlaringizni kiritish qismi"),
        t("O'quv maqsadini (IELTS, SAT va hk) aniq belgilash"),
        t("AI Ustoz shaxsiyatini o'zgartirish imkoniyati")
      ],
      tip: t("Profilingiz qanchalik aniq bo'lsa, AI shunchalik sizga moslashadi."),
      icon: "person",
      color: "#795548",
      bg: "#efebe9"
    }
  ];

  return (
    <>
      <Seo 
        title={t("Qo'llanma — Knowza AI")}
        description={t("Knowza AI platformasining barcha imkoniyatlari va bo'limlaridan to'g'ri foydalanish bo'yicha batafsil qo'llanma.")}
      />
      <div className="w-full animate-in fade-in duration-500 pb-20">
        
        {/* Profile-like Header Section */}
        <div className="flex flex-col gap-2 mb-6 border-b border-[#e5e2e1] pb-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">{t("Qo'llanma")}</h2>
              <p className="text-[14px] leading-[20px] text-[#444654]">{t("Platformadan foydalanish bo'yicha to'liq yo'riqnoma va maslahatlar")}</p>
            </div>
          </div>
        </div>

        {/* Flat Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {allFeatures.map((item, idx) => (
            <div key={idx} className="flex flex-col border border-[#e5e2e1] rounded-3xl bg-[#fafafa] overflow-hidden transition-all hover:border-[#cfcdcc]">
              
              {/* Card Header */}
              <div className="p-6 md:p-8 bg-white border-b border-[#e5e2e1] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#747686] px-3 py-1 bg-[#f0f2f5] rounded-full">
                    {item.category}
                  </span>
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-[#1c1b1b] mb-1">{item.title}</h3>
                  <p className="text-[#444654] text-[15px] font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>

              {/* Card Body - Details */}
              <div className="p-6 md:p-8 flex-1 flex flex-col gap-6">
                <div className="flex-1">
                  <h4 className="text-[14px] font-bold text-[#1c1b1b] mb-4">{t("Nimalar qila olasiz?")}</h4>
                  <ul className="space-y-3">
                    {item.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#444654] text-[15px] leading-relaxed font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1c1b1b] mt-2.5 shrink-0 opacity-40"></span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer - Tip */}
                <div className="mt-auto pt-6 border-t border-dashed border-[#e5e2e1]">
                  <div className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#ff8f00] text-[20px] mt-0.5 shrink-0">tips_and_updates</span>
                    <p className="text-[14px] text-[#1c1b1b] font-semibold leading-relaxed">
                      {item.tip}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </>
  );
};

export default Guide;
