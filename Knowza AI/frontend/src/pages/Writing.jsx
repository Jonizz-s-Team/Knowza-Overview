import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/Seo';
import apiService from '../../data/apiService';
import { toast } from 'sonner';

const KnowzaAIWriting = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [activeTask, setActiveTask] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [essayText, setEssayText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiService.getWritingHistory();
      if (res) {
        setHistory(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Defaulting to task_2 for now
      const res = await apiService.generateWritingTask(6.0, 'task_2');
      if (res && res.id) {
        setActiveTask(res);
        setEssayText('');
        setEvaluation(null);
      } else {
        toast.error("Vazifa yaratishda xatolik");
      }
    } catch (e) {
      console.error(e);
      toast.error("Tizimda xatolik yuz berdi");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (essayText.trim().length < 50) {
      toast.error("Kamida 50 ta so'z yozing!");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiService.submitWritingTask(activeTask.id, essayText, 0);
      if (res && res.evaluation) {
        setEvaluation(res.evaluation);
        toast.success("Essay tekshirildi!");
        fetchHistory(); // Refresh history
      }
    } catch (e) {
      console.error(e);
      toast.error("Tekshirishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeTask) {
    return (
      <>
        <Seo title={t('Writing Task — Knowza AI')} />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen">
          <button 
            onClick={() => { setActiveTask(null); setEvaluation(null); }}
            className="flex items-center gap-2 text-[#747686] hover:text-[#1c1b1b] transition-colors mb-6 font-semibold w-fit"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t("Ortga qaytish")}
          </button>

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs mb-8">
            <h2 className="text-[20px] font-bold text-[#1c1b1b] mb-4">
              IELTS Writing {activeTask.task_type === 'task_1' ? 'Task 1' : 'Task 2'}
            </h2>
            <div className="p-4 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1] text-[#444654] font-medium leading-relaxed whitespace-pre-wrap">
              {activeTask.prompt_text}
            </div>
          </div>

          {!evaluation ? (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs flex flex-col gap-4">
              <h3 className="text-[18px] font-bold text-[#1c1b1b]">{t("Sizning Essayingiz")}</h3>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Shu yerga yozing..."
                className="w-full h-[400px] p-4 rounded-2xl border border-[#c4c5d7] focus:border-[#274ed5] focus:ring-2 focus:ring-[#274ed5] outline-none transition-all resize-none text-[15px] text-[#1c1b1b]"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[#747686] font-medium text-[14px]">
                  {essayText.trim().split(/\s+/).filter(w => w.length > 0).length} so'z
                </span>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-[#274ed5] text-white font-bold hover:bg-[#1f42ba] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">send</span>
                  )}
                  {isSubmitting ? t("Tekshirilmoqda...") : t("Tekshirishga Yuborish")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs flex flex-col gap-6">
              <h3 className="text-[24px] font-black text-[#1c1b1b] text-center border-b border-[#e5e2e1] pb-4">
                Natija: {evaluation.overall_band} Band
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#f0f4ff] p-4 rounded-2xl text-center">
                  <p className="text-[#747686] text-[12px] font-bold mb-1">Task Achievement</p>
                  <p className="text-[18px] font-black text-[#274ed5]">{evaluation.task_achievement_band}</p>
                </div>
                <div className="bg-[#f0f4ff] p-4 rounded-2xl text-center">
                  <p className="text-[#747686] text-[12px] font-bold mb-1">Coherence</p>
                  <p className="text-[18px] font-black text-[#274ed5]">{evaluation.coherence_cohesion_band}</p>
                </div>
                <div className="bg-[#f0f4ff] p-4 rounded-2xl text-center">
                  <p className="text-[#747686] text-[12px] font-bold mb-1">Lexical Resource</p>
                  <p className="text-[18px] font-black text-[#274ed5]">{evaluation.lexical_resource_band}</p>
                </div>
                <div className="bg-[#f0f4ff] p-4 rounded-2xl text-center">
                  <p className="text-[#747686] text-[12px] font-bold mb-1">Grammar</p>
                  <p className="text-[18px] font-black text-[#274ed5]">{evaluation.grammatical_range_accuracy_band}</p>
                </div>
              </div>

              <div className="mt-4 p-5 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1]">
                <h4 className="font-bold text-[#1c1b1b] mb-2">Umumiy Fikr (Feedback)</h4>
                <p className="text-[#444654] font-medium leading-relaxed whitespace-pre-wrap">{evaluation.detailed_feedback}</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  const averageBand = history.length > 0 
    ? (history.reduce((acc, task) => acc + (task.submission?.evaluation?.overall_band || 0), 0) / history.filter(t => t.submission?.evaluation).length || 0).toFixed(1)
    : '—';

  return (
    <>
      <Seo
        title={t('IELTS Writing — Knowza AI')}
        description={t("Knowza AI orqali IELTS Writing insholar yozing va sun'iy intellekt orqali to'liq baholating.")}
      />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-[#1c1b1b] tracking-tight leading-tight mb-2">
              {t("IELTS Writing")}
            </h1>
            <p className="text-[#747686] text-[15px] font-medium leading-relaxed max-w-2xl">
              {t("Essay yozing, sun'iy intellekt orqali IELTS standartlarida tekshirtiring va xatolaringizni tahlil qiling.")}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          
          {/* Left Column: Writing Tasks List / Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">edit_document</span>
                {t("Writing Vazifalari")}
              </h3>
              
              {loadingHistory ? (
                <div className="flex justify-center p-8"><span className="material-symbols-outlined animate-spin text-[#274ed5]">refresh</span></div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-[#747686] mb-4 opacity-50">history_edu</span>
                  <p className="text-[16px] text-[#747686] font-medium max-w-sm">
                    {t("Hozircha writing vazifalari mavjud emas.")}
                  </p>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="mt-6 px-6 py-3 rounded-xl bg-[#274ed5] text-white font-bold text-[15px] hover:bg-[#1f42ba] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                  >
                    {isGenerating ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">add</span>}
                    {isGenerating ? t("Yaratilmoqda...") : t("Yangi essay yozish")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-[#274ed5] text-[#274ed5] font-bold text-[15px] hover:bg-[#f0f4ff] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    {isGenerating ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">add</span>}
                    {isGenerating ? t("Yaratilmoqda...") : t("Yangi essay yozish")}
                  </button>

                  {history.map(item => (
                    <div key={item.id} className="p-4 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-[#c4c5d7] transition-all cursor-pointer" onClick={() => { setActiveTask(item); setEvaluation(item.submission?.evaluation || null); setEssayText(item.submission?.essay_text || ''); }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-[#e5e2e1] text-[#444654] px-2 py-0.5 rounded-lg text-[12px] font-bold uppercase">{item.task_type}</span>
                          <span className="text-[#747686] text-[13px]">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#1c1b1b] font-medium text-[14px] line-clamp-2">{item.prompt_text}</p>
                      </div>
                      {item.submission?.evaluation ? (
                        <div className="shrink-0 text-center bg-[#f0f4ff] px-4 py-2 rounded-xl">
                          <p className="text-[#747686] text-[11px] font-bold uppercase">Natija</p>
                          <p className="text-[#274ed5] font-black text-[18px]">{item.submission.evaluation.overall_band}</p>
                        </div>
                      ) : (
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-xl text-[12px] font-bold shrink-0">Bajarilmagan</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stats / Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2e1] shadow-xs">
              <h3 className="text-[18px] font-bold text-[#1c1b1b] mb-4">{t("Sizning Natijangiz")}</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center p-4 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1]">
                  <span className="text-[#747686] font-medium text-[14px]">{t("O'rtacha Ball")}</span>
                  <span className="text-[20px] font-black text-[#1c1b1b]">{averageBand}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1]">
                  <span className="text-[#747686] font-medium text-[14px]">{t("Yozilgan Essaylar")}</span>
                  <span className="text-[20px] font-black text-[#1c1b1b]">{history.filter(t => t.submission).length} / {history.length}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default KnowzaAIWriting;
