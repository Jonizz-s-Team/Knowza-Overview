import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '../../data/apiService';
import Seo from '../../components/Seo';
import { AnalyticsSkeleton } from '../../components/Skeletons';
import { useTranslation } from 'react-i18next';

const KnowzaAIAnalytics = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analyticsStats'],
    queryFn: () => apiService.getAIDashboardStats(),
    refetchInterval: 15000 // Live refresh every 15s
  });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const streak = stats?.streak?.current_streak || 0;
  const targetScore = stats?.profile?.target_score || 'Noma\'lum';
  const gaps = stats?.skill_gaps || [];

  const statCards = [
    {
      label: t('Maqsadli ball'), icon: 'military_tech', iconBg: '#e8edff', iconColor: '#274ed5',
      value: targetScore, unit: '',
      badge: { text: t('Belgilangan maqsad'), icon: 'flag', bg: '#e8f5e9', color: '#2e7d32' },
    },
    {
      label: t('Zaif mavzular'), icon: 'psychology_alt', iconBg: '#fdf5f3', iconColor: '#e04f16',
      value: gaps.length, unit: t('ta'),
      badge: { text: t('Diqqat qaratish kerak'), icon: 'warning', bg: '#ffdad6', color: '#ba1a1a' },
    },
    {
      label: t('Faollik davomiyligi'), icon: 'local_fire_department', iconBg: '#e8f5e9', iconColor: '#2e7d32',
      value: streak, unit: t('kun'),
      badge: { text: t('Ketma-ket'), icon: 'bolt', bg: '#fff8e1', color: '#f57f17' },
    },
  ];

  return (
    <>
      <Seo 
        title={t("Tahlil va xarita | Knowza AI")}
        description={t("O'zlashtirish tahlili va ko'nikmalar xaritasi.")}
        icon="/banner/Knowza-logo-mini.png"
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex flex-col gap-2 mb-2">
          <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">{t("O'zlashtirish tahlili")}</h2>
          <p className="text-[14px] leading-[20px] text-[#444654]">
            {t("Barcha natijalar va bilimlaringizdagi bo'shliqlar (Skills Gap) statistikasi")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5e2e1] flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[14px] font-semibold text-[#444654]">{stat.label}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}>
                <span className="material-symbols-outlined text-[16px]">{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-end gap-3 mt-2">
              <span className="text-[32px] font-black text-[#1c1b1b] leading-none">{stat.value}</span>
              <span className="text-[14px] font-bold text-[#444654] mb-1">{stat.unit}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md w-max mt-2" style={{ backgroundColor: stat.badge.bg, color: stat.badge.color }}>
              <span className="material-symbols-outlined text-[14px]">{stat.badge.icon}</span>
              <span className="text-[12px] font-bold">{stat.badge.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Predictive Score & B2 Strong CEFR Level Banner */}
      <div className="bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] rounded-3xl p-6 md:p-8 text-white shadow-md mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-white/20 text-white font-extrabold text-[12px] px-3 py-1 rounded-full border border-white/30 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              {t("AI Taxminiy Ball & CEFR Level")}
            </span>
            <span className="bg-emerald-400 text-emerald-950 font-black text-[12px] px-3 py-1 rounded-full uppercase tracking-wider">
              B2 STRONG FOUNDATION ⚡
            </span>
          </div>
          <h3 className="text-[22px] md:text-[26px] font-black leading-snug">
            {t("B2 Strong va Yuqori Natijalarga Erishish Dasturi")}
          </h3>
          <p className="text-[14px] text-white/90 leading-relaxed font-medium">
            {t("Knowza AI algoritmik tahlili bo'yicha sizning joriy bilim darajangiz B2 (Upper-Intermediate) darajasida. IELTS 7.5+ / SAT 1450+ / MS A+ ballga erishish uchun muntazam 2 soatlik amaliyot tavsiya etiladi.")}
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => navigate('/knowza-ai/test')}
            className="w-full px-6 py-3.5 bg-white text-[#1f42ba] hover:bg-white/95 active:scale-95 font-bold text-[14px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">quiz</span>
            <span>{t("AI Amaliy Test Topshirish")}</span>
          </button>
          <button
            onClick={() => navigate('/knowza-ai/planner')}
            className="w-full px-6 py-3.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-[14px] rounded-2xl border border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">alt_route</span>
            <span>{t("O'quv Rejasini Ko'rish")}</span>
          </button>
        </div>
      </div>

      {/* Skills Gap Map */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5e2e1] mt-6">
        <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-6">{t("Skills Gap Map (Zaif ko'nikmalar)")}</h3>
        {gaps.length === 0 ? (
          <div className="text-[#747686] text-center py-6">
            {t("Sizda hozircha aniqlangan zaif mavzular yo'q. Testlarni yechishda davom eting!")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gaps.map((gap, i) => (
              <div key={i} className="border border-[#e5e2e1] rounded-2xl p-4 bg-[#fcf9f8] hover:border-[#274ed5]/30 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-[#1c1b1b] text-[16px]">{gap.topic}</h4>
                  <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
                </div>
                <div className="text-[12px] text-[#444654] mb-3">
                  {t("Fan")}: {gap.subject}
                </div>
                <div className="flex justify-between items-center text-[12px] font-bold">
                  <span className="text-[#ba1a1a]">{t("Xatolar")}: {gap.error_count}</span>
                  <button 
                    onClick={() => navigate(`/knowza-ai/lesson?topic=${encodeURIComponent(gap.topic)}`)}
                    className="text-[#274ed5] hover:underline"
                  >
                    {t("O'rganish")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default KnowzaAIAnalytics;
