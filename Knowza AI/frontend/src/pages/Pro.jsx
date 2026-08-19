import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Seo from '../../components/Seo';
import { useTranslation } from 'react-i18next';

const KnowzaAIPro = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pricingCardBenefits = [
    "Haftalik cheklovlarsiz AI izlanishlar",
    "Birdaniga 3 tagacha o'quv maqsadini tanlash",
    "O'quv rejasini cheklovlarsiz yangilash",
    "AI xotirasini boshqarish va personalizatsiya"
  ];

  const features = [
    {
      icon: 'psychology',
      title: 'AI Personalizatsiya & Xotira',
      desc: 'AI sizning o\'rganish uslubingizni eslab qoladi va siz uning xotirasini to\'liq boshqara olasiz.',
      color: 'bg-gradient-to-br from-[#1f42ba] to-[#274ed5]'
    },
    {
      icon: 'search',
      title: 'Cheklovlarsiz Izlanishlar',
      desc: 'Haftasiga atigi 3 ta izlanish o\'rniga, xohlagancha yangi mavzular bo\'yicha ma\'lumot o\'rganasiz.',
      color: 'bg-gradient-to-br from-purple-600 to-indigo-600'
    },
    {
      icon: 'refresh',
      title: 'Cheksiz Reja Yangilash',
      desc: 'O\'quv rejangizni 3 marta emas, balki maqsadlaringiz o\'zgarishiga qarab istalgancha yangilang.',
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600'
    },
    {
      icon: 'track_changes',
      title: 'Ko\'p Maqsadli O\'rganish',
      desc: 'Faqatgina bitta emas, birdaniga 3 ta turli xil o\'quv maqsadini (masalan: IELTS, SAT) tanlang.',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600'
    },
    {
      icon: 'picture_as_pdf',
      title: 'Cheksiz PDF Yuklash',
      desc: 'Barcha yaratilgan darsliklar va tahlillarni PDF formatida yuklab oling va oflayn o\'qing.',
      color: 'bg-gradient-to-br from-rose-500 to-red-600'
    },
    {
      icon: 'quiz',
      title: 'Real Mock Testlar',
      desc: 'IELTS, SAT va MS bo\'yicha haqiqiy imtihon savollari va qiyinchilik darajasida bilimingizni sinang.',
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600'
    },
    {
      icon: 'error_outline',
      title: 'Xatolarni Eslab Qolish',
      desc: 'Tizim siz ko\'p xato qiladigan mavzularni tahlil qiladi va faqat shu bo\'yicha kuchaytirilgan darslar beradi.',
      color: 'bg-gradient-to-br from-indigo-500 to-purple-700'
    },
    {
      icon: 'forum',
      title: 'Socratic Mentor',
      desc: 'Har qanday tushunarsiz joyni Socratic Mentor orqali so\'rab, 24/7 zudlik bilan javob oling.',
      color: 'bg-gradient-to-br from-pink-500 to-rose-600'
    }
  ];

  const pricingPlans = [
    {
      months: 1,
      title: "1 Oylik Obuna",
      price: "99 000 UZS",
      monthlyPrice: "99 000 UZS / oy",
      desc: "Barcha cheklovlarni olib tashlash va platformadan to'liq foydalanish uchun.",
      benefits: [...pricingCardBenefits],
      recommended: false
    },
    {
      months: 3,
      title: "3 Oylik Obuna",
      price: "249 000 UZS",
      monthlyPrice: "83 000 UZS / oy",
      desc: "Imtihonlarga jiddiy tayyorgarlik ko'rish uchun eng optimal vaqt va narx.",
      benefits: [...pricingCardBenefits],
      recommended: true
    },
    {
      months: 9,
      title: "9 Oylik Obuna",
      price: "599 000 UZS",
      monthlyPrice: "66 500 UZS / oy",
      desc: "Butun o'quv yili davomida eng arzon narxda barcha Pro imkoniyatlar.",
      benefits: [...pricingCardBenefits],
      recommended: false
    }
  ];

  return (
    <>
      <Seo 
        title={t("Pro Tarif | Knowza AI")}
        description={t("Brooo, Knowza AI Pro tarifiga o'ting va barcha cheklovlarni olib tashlang.")}
        icon="/banner/Knowza-logo-mini.png"
      />

      <div className="relative min-h-screen w-full bg-[#F5F6FA]">
        <style>{`
          @keyframes floatOrb1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(15px, 12px) scale(1.1); }
          }
          @keyframes floatOrb2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(-15px, -10px) scale(1.05); }
          }
          .pro-orb-1 { animation: floatOrb1 18s ease-in-out infinite; }
          .pro-orb-2 { animation: floatOrb2 22s ease-in-out infinite; }
        `}</style>

        {/* Dynamic Ambient Glow Orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#274ed5]/10 blur-[120px] pro-orb-1"></div>
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f75ff]/10 blur-[120px] pro-orb-2"></div>
        </div>

        <div className="max-w-7xl mx-auto w-full py-10 md:py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
          
          {/* Header Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-4 py-1.5 rounded-full bg-[#274ed5]/10 text-[#274ed5] text-[13px] font-bold tracking-wider uppercase inline-flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              {t("Pro tarif imkoniyatlari")}
            </span>
            <h1 className="text-[32px] sm:text-[44px] font-black tracking-tight text-[#274ed5] leading-tight mb-4">
              {t("Brooo, Pro tarifiga o'ting!")}
            </h1>
            <p className="text-[16px] text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              {t("Platformaning barcha sun'iy intellekt xususiyatlaridan cheklovlarsiz foydalaning va o'zlashtirish tezligingizni oshiring. Barcha berilgan va'dalar — aniq va sof natijalar.")}
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-20">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx}
                className={`bg-white rounded-3xl p-8 flex flex-col justify-between relative min-h-[530px] transition-all duration-300 ${
                  plan.recommended 
                    ? 'border-2 border-[#274ed5] shadow-xl ring-4 ring-[#274ed5]/10' 
                    : 'border border-[#e5e2e1] shadow-xs hover:border-[#274ed5]/40 hover:shadow-md'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#1f42ba] to-[#4f75ff] text-white px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shadow-md z-10">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {t("Tavsiya etiladi")}
                  </div>
                )}
                
                <div>
                  <h3 className="text-[20px] font-black text-[#1c1b1b] mb-1.5">{t(plan.title)}</h3>
                  <p className="text-[13px] text-gray-500 font-medium mb-6 min-h-[38px] leading-snug">{t(plan.desc)}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[38px] font-black text-[#1c1b1b] leading-none">{t(plan.price)}</span>
                    </div>
                    {plan.months > 1 && (
                      <p className="text-[13px] font-bold text-emerald-600 mt-2">{t("Yangi narx: ")}{t(plan.monthlyPrice)}</p>
                    )}
                    {plan.months === 1 && (
                      <p className="text-[13px] font-semibold text-gray-400 mt-2">{t("Oylik to'lov: ")}{t(plan.monthlyPrice)}</p>
                    )}
                  </div>

                  <div className="h-px bg-[#f0f0f0] my-6" />

                  <ul className="space-y-3.5 mb-8">
                    {plan.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#274ed5] shrink-0 text-[18px] mt-0.5">check_circle</span>
                        <span className="text-[13px] font-semibold text-[#444654] leading-snug">{t(benefit)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-[14px] active:scale-95 transition-all duration-150 cursor-pointer mt-auto ${
                    plan.recommended 
                      ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white shadow-md hover:opacity-95' 
                      : 'bg-[#f0f4ff] text-[#274ed5] hover:bg-[#e8edff] border border-[#274ed5]/20'
                  }`}
                >
                  <span>{t("Boshlash")}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="w-full mb-12 max-w-6xl mx-auto">
            <h2 className="text-[28px] font-black text-[#1c1b1b] mb-8 text-center">{t("Nima uchun bu sizga foydali?")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-6 rounded-3xl border border-[#e5e2e1] shadow-xs flex flex-col justify-between hover:border-[#274ed5]/40 transition-colors"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center text-white mb-4 shadow-xs`}>
                      <span className="material-symbols-outlined text-[24px]">{f.icon}</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#1c1b1b] mb-2">{t(f.title)}</h3>
                    <p className="text-[13px] font-medium text-gray-500 leading-relaxed">{t(f.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Modal */}
          {isModalOpen && createPortal(
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#e5e2e1] relative shadow-2xl animate-fade-in">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-[#747686] hover:text-[#1c1b1b] transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#e8edff] flex items-center justify-center mx-auto mb-4 border border-[#274ed5]/20 shadow-xs">
                    <span className="material-symbols-outlined text-[#274ed5] text-[32px]">payments</span>
                  </div>
                  <h3 className="text-[22px] font-black text-[#1c1b1b]">{t("Tarifni faollashtirish")}</h3>
                  <p className="text-[13px] text-gray-500 font-semibold mt-1">{t("Sizga qulay bo'lgan ulanish usulini tanlang")}</p>
                </div>

                <div className="space-y-3.5 mb-6">
                  <a 
                    href="https://t.me/jonizz_devvvv" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[#f0f4ff] hover:bg-[#e8edff] border border-[#274ed5]/20 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#0088cc] text-[24px]">send</span>
                      <div className="text-left">
                        <p className="text-[15px] font-bold text-[#1c1b1b]">{t("Telegram orqali")}</p>
                        <p className="text-[12px] text-gray-500 font-medium">{t("Tezkor va to'g'ridan-to'g'ri yordam")}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                  </a>

                  <div className="p-4 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl text-left">
                    <p className="text-[15px] font-bold text-[#1c1b1b] mb-1">{t("Karta orqali to'lov")}</p>
                    <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
                      {t("Hozirda to'g'ridan-to'g'ri karta to'lovlari tayyorlanmoqda. Ungacha bemalol Telegram orqali yozib, tizimga ulanishingiz mumkin.")}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full h-11 text-[14px] bg-[#f0f2f5] text-[#1c1b1b] hover:bg-[#e5e8ec] font-bold rounded-2xl transition-colors"
                >
                  {t("Orqaga")}
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </>
  );
};

export default KnowzaAIPro;
