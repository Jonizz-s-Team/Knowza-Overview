import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../data/apiService';
import { toast } from 'sonner';
import Seo from '../../components/Seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTranslation } from 'react-i18next';
import IeltsListeningPlayer from '../../components/IeltsListeningPlayer';

const KnowzaAILesson = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const rawTopic = searchParams.get('topic') || t('Umumiy darslik');

  // Format clean topic name (remove repetitive colon prefixes if any)
  const cleanTopicName = (raw) => {
    if (!raw) return 'Darslik';
    const parts = raw.split(':').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}: ${parts[1]}`;
    }
    return raw;
  };

  const topic = cleanTopicName(rawTopic);

  const [activeTab, setActiveTab] = useState('theory'); // theory, practice, strategy
  const [aiNotes, setAiNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  const isListeningTopic = rawTopic.toLowerCase().includes('tinglash') || rawTopic.toLowerCase().includes('listening');

  const handleDeepenAI = async () => {
    setIsGenerating(true);
    let temp = '';
    try {
      await apiService.knowzaAIStreamChat(
        t("Iltimos, \"{{topic}}\" mavzusi bo'yicha qo'shimcha murakkab misollar va chuqur strategik tahlil ber.", { topic }),
        sessionId,
        'deepen',
        (chunk) => {
          temp += chunk;
          setAiNotes(temp);
        }
      );
    } catch {
      toast.error(t("Xatolik yuz berdi"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Seo 
        title={t("{{topic}} - Darslik | Knowza AI", { topic })}
        description={t("{{topic}} mavzusida nazariy bilimlarni o'rganing va amaliyot qiling.", { topic })}
        icon="/banner/Knowza-logo-mini.png"
      />

      <div className="flex flex-col gap-6 w-full mx-auto animate-in fade-in duration-500">
        
        {/* Clean Modern Header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-2">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => navigate('/knowza-ai/planner')}
              className="w-10 h-10 rounded-xl border border-[#e5e2e1] bg-white flex items-center justify-center text-[#1c1b1b] hover:bg-[#fcf9f8] transition-all cursor-pointer shrink-0"
              title="Orqaga qaytish"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[24px] md:text-[26px] leading-[32px] font-bold text-[#1c1b1b]">
                  {topic}
                </h2>
                {isListeningTopic && (
                  <span className="text-[11px] font-extrabold uppercase bg-[#f0f4ff] text-[#274ed5] px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">headphones</span>
                    Audio Mashq Mavjud
                  </span>
                )}
              </div>
              <p className="text-[13px] leading-[18px] text-[#747686]">
                {t("Nazariy bilimlarni o'rganing va amaliyot topshiriqlarini yeching")}
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate(`/knowza-ai/test?topic=${encodeURIComponent(rawTopic)}`)}
            className="px-5 py-2.5 rounded-2xl text-white font-bold text-[14px] bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-none"
          >
            <span className="material-symbols-outlined text-[18px]">quiz</span>
            <span>{t("Amaliy Testni Boshlash")}</span>
          </button>
        </div>

        {/* Content Layout Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e5e2e1] pb-0 mb-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('theory')}
            className={`pb-3 px-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'theory' 
                ? 'border-[#274ed5] text-[#274ed5]' 
                : 'border-transparent text-[#747686] hover:text-[#1c1b1b]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>1. Nazariya & Qoidalar</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`pb-3 px-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'practice' 
                ? 'border-[#274ed5] text-[#274ed5]' 
                : 'border-transparent text-[#747686] hover:text-[#1c1b1b]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">headphones</span>
            <span>2. Namunaviy Audio & Mashq</span>
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`pb-3 px-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'strategy' 
                ? 'border-[#274ed5] text-[#274ed5]' 
                : 'border-transparent text-[#747686] hover:text-[#1c1b1b]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            <span>3. Imtihon Strategiyasi</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] space-y-6">
          
          {/* TAB 1: Nazariya va Qoidalar (Pure Theory & Rules) */}
          {activeTab === 'theory' && (
            <div className="space-y-6">
              <div className="bg-[#f0f4ff] p-5 rounded-2xl border border-[#274ed5]/20 flex items-start gap-4">
                <span className="material-symbols-outlined text-[#274ed5] text-[26px] shrink-0 mt-0.5">info</span>
                <div>
                  <h4 className="font-bold text-[16px] text-[#1c1b1b]">{t("Mavzu Maqsadi")}</h4>
                  <p className="text-[14px] text-[#444654] mt-1 leading-relaxed">
                    Ushbu darsda siz <strong>{topic}</strong> bo'yicha asosiy nazariy qoidalar, tezkor yechish usullari hamda eng ko'p uchraydigan tuzoqlarni o'rganasiz.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] space-y-2">
                  <div className="flex items-center gap-2 text-[#274ed5] font-extrabold text-[15px]">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    <span>{t("Kalit So'zlar (Keywords)")}</span>
                  </div>
                  <p className="text-[13px] text-[#444654] leading-relaxed">
                    Savoldagi otlar, sifatlar va sana/raqamlarni belgilang. Audioda ular parafraz qilinishiga (sinonim ishlatilishiga) tayyor turing.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] space-y-2">
                  <div className="flex items-center gap-2 text-[#274ed5] font-extrabold text-[15px]">
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    <span>{t("Sinonim & Parafraz")}</span>
                  </div>
                  <p className="text-[13px] text-[#444654] leading-relaxed">
                    Audioda aytiladigan sinonimlar zanjiri (masalan: <em>big → substantial / considerable</em>, <em>rise → increase</em>).
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e5e2e1] pt-5">
                <h4 className="font-bold text-[17px] text-[#1c1b1b] mb-3">{t("Imtihonda Eng Muhim 3 Ta Qoida:")}</h4>
                <ul className="space-y-3 text-[14px] text-[#444654]">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">1</span>
                    <span><strong>So'z cheklovi (Word limit):</strong> Savol shartida <em>NO MORE THAN TWO WORDS AND/OR A NUMBER</em> bo'lsa, 3 so'z yozish noto'g'ri hisoblanadi.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">2</span>
                    <span><strong>Spelling (Imlo):</strong> Ismlar va ko'cha nomlari harflab aytilishi mumkin (masalan: B-R-O-W-N-E). Bitta harf xato bo'lsa javob olinmaydi.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">3</span>
                    <span><strong>Grammatik Muvofiqlik:</strong> Bo'sh joyga qo'yilgan so'z gap grammatikasiga 100% mos kelishi shart.</span>
                  </li>
                </ul>
              </div>

              {/* Action Banner to Switch to Audio Practice */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#f0f4ff] to-[#e8edff] border border-[#274ed5]/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#274ed5] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">headphones</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-[16px] text-[#1c1b1b]">Nazariyani o'rgandingizmi?</h5>
                    <p className="text-[13px] text-[#444654]">Endi ushbu mavzu bo'yicha real audio va topshiriqlarni bajaring.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="px-5 py-2.5 rounded-xl bg-[#274ed5] text-white font-bold text-[13px] hover:bg-[#1f42ba] transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Namunaviy Audio Mashqqa O'tish</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Namunaviy Audio & Mashq (Pure Audio Simulator) */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#e5e2e1]">
                <div>
                  <h4 className="font-bold text-[18px] text-[#1c1b1b]">Interaktiv Audio Mashq</h4>
                  <p className="text-[13px] text-[#747686]">Audioni tinglang va bo'sh joylarni to'ldiring.</p>
                </div>
              </div>
              <IeltsListeningPlayer topic={topic} />
            </div>
          )}

          {/* TAB 3: Imtihon Strategiyasi */}
          {activeTab === 'strategy' && (
            <div className="space-y-5">
              <h4 className="font-bold text-[18px] text-[#1c1b1b]">{t("Bosqichma-Bosqich Yechish Strategiyasi")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] space-y-2">
                  <span className="text-[11px] font-extrabold text-[#274ed5] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 inline-block">1-QADAM</span>
                  <h5 className="font-bold text-[15px] text-[#1c1b1b]">{t("Savollarni tahlil qilish")}</h5>
                  <p className="text-[13px] text-[#444654] leading-relaxed">
                    Audio boshlanishidan oldin bo'sh joyga qanday so'z (ism, sana, raqam, obyekt) tushishini taxmin qiling.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] space-y-2">
                  <span className="text-[11px] font-extrabold text-[#274ed5] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 inline-block">2-QADAM</span>
                  <h5 className="font-bold text-[15px] text-[#1c1b1b]">{t("Chalg'ituvchilarni ushlash")}</h5>
                  <p className="text-[13px] text-[#444654] leading-relaxed">
                    So'zlovchilar fikrini o'zgartirishi mumkin (masalan: <em>"We'll meet at 4 pm... Oh wait, let's make it 5 pm"</em>). Oxirgi tuzatilgan javobni oling!
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] space-y-2">
                  <span className="text-[11px] font-extrabold text-[#274ed5] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 inline-block">3-QADAM</span>
                  <h5 className="font-bold text-[15px] text-[#1c1b1b]">{t("Imloni tekshirish")}</h5>
                  <p className="text-[13px] text-[#444654] leading-relaxed">
                    Katta-kichik harflar va birlik/ko'plik (-s/-es) qo'shimchalarini qayta ko'rib chiqing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Extra Notes Box */}
          {aiNotes && (
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#f0f4ff] to-[#e8edff] border border-[#274ed5]/30 space-y-4">
              <div className="flex items-center gap-2 text-[#274ed5] font-extrabold text-[15px]">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span>{t("AI Ustoz Qo'shimcha Izohlari:")}</span>
              </div>
              <div className="prose prose-blue max-w-none text-[14px] leading-relaxed text-[#1c1b1b]">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{aiNotes}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="border-t border-[#e5e2e1] pt-6 flex flex-wrap items-center justify-between gap-4">
            <button 
              onClick={handleDeepenAI}
              disabled={isGenerating}
              className="px-5 py-3 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] text-[#1c1b1b] font-bold text-[13px] hover:border-[#274ed5]/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] text-[#274ed5] ${isGenerating ? 'animate-spin' : ''}`}>
                {isGenerating ? 'progress_activity' : 'auto_awesome'}
              </span>
              <span>{isGenerating ? t("AI tahlil qilmoqda...") : t("AI Dan Qo'shimcha Izoh Olish")}</span>
            </button>

            <button 
              onClick={() => navigate(`/knowza-ai/test?topic=${encodeURIComponent(rawTopic)}`)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[14px] hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-none"
            >
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              <span>{t("Amaliy Testni Boshlash")}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default KnowzaAILesson;
