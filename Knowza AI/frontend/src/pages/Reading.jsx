import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/Seo';
import apiService from '../../data/apiService';
import { toast } from 'sonner';

const KnowzaAIReading = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [activePassage, setActivePassage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiService.getReadingHistory();
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
      const res = await apiService.generateReadingPassage('General Science', 'intermediate');
      if (res && res.id) {
        setActivePassage(res);
        setAnswers({});
        setAttemptResult(null);
      } else {
        toast.error("Matn yaratishda xatolik");
      }
    } catch (e) {
      console.error(e);
      toast.error("Tizimda xatolik yuz berdi");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      toast.error("Kamida bitta savolga javob bering!");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiService.submitReadingAttempt(activePassage.id, answers, 0);
      if (res && res.id) {
        setAttemptResult(res);
        toast.success("Javoblar tekshirildi!");
        fetchHistory(); // Refresh history
      }
    } catch (e) {
      console.error(e);
      toast.error("Tekshirishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId, val) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  if (activePassage) {
    return (
      <>
        <Seo title={t('Reading Task — Knowza AI')} />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen max-h-screen overflow-hidden">
          <button 
            onClick={() => { setActivePassage(null); setAttemptResult(null); }}
            className="flex items-center gap-2 text-[#747686] hover:text-[#1c1b1b] transition-colors mb-4 font-semibold w-fit shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t("Ortga qaytish")}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0 flex-1 pb-4">
            {/* Left: Reading Passage */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs overflow-y-auto flex flex-col h-full custom-scrollbar">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#e5e2e1] text-[#444654] px-2 py-0.5 rounded-lg text-[12px] font-bold uppercase">{activePassage.difficulty_level}</span>
                <span className="text-[#747686] text-[13px] font-medium">{activePassage.topic}</span>
              </div>
              <h2 className="text-[24px] font-black text-[#1c1b1b] mb-6 leading-tight">{activePassage.title}</h2>
              <div className="text-[#444654] text-[16px] leading-relaxed whitespace-pre-wrap font-medium">
                {activePassage.content}
              </div>
            </div>

            {/* Right: Questions or Results */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs overflow-y-auto flex flex-col h-full custom-scrollbar">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-6 pb-4 border-b border-[#e5e2e1]">
                {attemptResult ? t("Natijalar") : t("Savollar")}
              </h3>

              {!attemptResult ? (
                <div className="flex flex-col gap-8 flex-1">
                  {activePassage.questions?.map((q, idx) => (
                    <div key={q.id} className="flex flex-col gap-3">
                      <p className="text-[#1c1b1b] font-bold text-[15px]">
                        <span className="text-[#274ed5] mr-2">{idx + 1}.</span>
                        {q.question_text}
                      </p>
                      
                      {q.question_type === 'mcq' && q.options && q.options.length > 0 ? (
                        <div className="flex flex-col gap-2 pl-6">
                          {q.options.map((opt, i) => (
                            <label key={i} className="flex items-start gap-3 cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`q_${q.id}`} 
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                className="mt-1 w-4 h-4 text-[#274ed5] focus:ring-[#274ed5]"
                              />
                              <span className="text-[#444654] text-[15px] font-medium group-hover:text-[#1c1b1b]">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : q.question_type === 'tfng' ? (
                        <div className="flex gap-4 pl-6">
                          {['True', 'False', 'Not Given'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`q_${q.id}`} 
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                className="w-4 h-4 text-[#274ed5] focus:ring-[#274ed5]"
                              />
                              <span className="text-[#444654] text-[14px] font-bold group-hover:text-[#1c1b1b]">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-6">
                          <input 
                            type="text" 
                            placeholder="Javobingizni yozing..."
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full md:w-1/2 px-4 py-2 rounded-xl border border-[#c4c5d7] focus:border-[#274ed5] outline-none text-[15px] font-medium"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="mt-auto pt-6">
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-[#274ed5] text-white font-bold hover:bg-[#1f42ba] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      {isSubmitting ? (
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                      ) : (
                        <span className="material-symbols-outlined">done_all</span>
                      )}
                      {isSubmitting ? t("Tekshirilmoqda...") : t("Javoblarni Tekshirish")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="bg-[#f0f4ff] p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[#747686] text-[13px] font-bold uppercase mb-1">To'g'ri Javoblar</p>
                      <p className="text-[28px] font-black text-[#274ed5]">
                        {Object.keys(attemptResult.answers).filter(k => {
                          const q = activePassage.questions.find(x => x.id == k);
                          return q && String(q.correct_answer).toLowerCase() === String(attemptResult.answers[k]).toLowerCase();
                        }).length} / {activePassage.questions.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#747686] text-[13px] font-bold uppercase mb-1">Taxminiy Band</p>
                      <p className="text-[28px] font-black text-[#1c1b1b]">{attemptResult.band_equivalent}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="font-bold text-[#1c1b1b] text-[16px]">Batafsil Tahlil</h4>
                    {activePassage.questions?.map((q, idx) => {
                      const userAns = attemptResult.answers[q.id];
                      const isCorrect = String(q.correct_answer).toLowerCase() === String(userAns).toLowerCase();
                      return (
                        <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-[14px] font-bold text-[#1c1b1b] mb-2">{idx + 1}. {q.question_text}</p>
                          <div className="flex flex-col gap-1 text-[13px] font-medium">
                            <p className="text-[#747686]">Sizning javobingiz: <span className={isCorrect ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>{userAns || 'Belgilanmadi'}</span></p>
                            {!isCorrect && (
                              <p className="text-[#747686]">To'g'ri javob: <span className="text-green-700 font-bold">{q.correct_answer}</span></p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </>
    );
  }

  const averageBand = history.length > 0 
    ? (history.reduce((acc, p) => acc + (p.attempt?.band_equivalent || 0), 0) / history.filter(p => p.attempt).length || 0).toFixed(1)
    : '—';

  return (
    <>
      <Seo
        title={t('IELTS Reading — Knowza AI')}
        description={t("Knowza AI orqali IELTS Reading mashqlarini bajaring va ko'nikmalaringizni oshiring.")}
      />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-[#1c1b1b] tracking-tight leading-tight mb-2">
              {t("IELTS Reading")}
            </h1>
            <p className="text-[#747686] text-[15px] font-medium leading-relaxed max-w-2xl">
              {t("IELTS uslubidagi reading matnlarini o'qing, savollarga javob bering va darajangizni bilib oling.")}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          
          {/* Left Column: Reading Tasks List / Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">menu_book</span>
                {t("Reading Matnlari")}
              </h3>
              
              {loadingHistory ? (
                <div className="flex justify-center p-8"><span className="material-symbols-outlined animate-spin text-[#274ed5]">refresh</span></div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-[#747686] mb-4 opacity-50">import_contacts</span>
                  <p className="text-[16px] text-[#747686] font-medium max-w-sm">
                    {t("Hozircha reading matnlari mavjud emas.")}
                  </p>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="mt-6 px-6 py-3 rounded-xl bg-[#274ed5] text-white font-bold text-[15px] hover:bg-[#1f42ba] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                  >
                    {isGenerating ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">add</span>}
                    {isGenerating ? t("Matn yuklanmoqda...") : t("Yangi matn yuklash")}
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
                    {isGenerating ? t("Matn yuklanmoqda...") : t("Yangi matn yuklash")}
                  </button>

                  {history.map(item => (
                    <div key={item.id} className="p-4 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-[#c4c5d7] transition-all cursor-pointer" onClick={() => { setActivePassage(item); setAttemptResult(item.attempt || null); setAnswers(item.attempt?.answers || {}); }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-[#e5e2e1] text-[#444654] px-2 py-0.5 rounded-lg text-[12px] font-bold uppercase">{item.difficulty_level}</span>
                          <span className="text-[#747686] text-[13px]">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#1c1b1b] font-bold text-[15px] line-clamp-1">{item.title}</p>
                      </div>
                      {item.attempt ? (
                        <div className="shrink-0 text-center bg-[#f0f4ff] px-4 py-2 rounded-xl border border-[#d6e0ff]">
                          <p className="text-[#747686] text-[11px] font-bold uppercase">Natija</p>
                          <p className="text-[#274ed5] font-black text-[18px]">{item.attempt.band_equivalent}</p>
                        </div>
                      ) : (
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-xl text-[12px] font-bold shrink-0 border border-orange-200">Bajarilmagan</span>
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
                  <span className="text-[#747686] font-medium text-[14px]">{t("O'rtacha Band")}</span>
                  <span className="text-[20px] font-black text-[#1c1b1b]">{averageBand}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#fcf9f8] rounded-2xl border border-[#e5e2e1]">
                  <span className="text-[#747686] font-medium text-[14px]">{t("Bajarilgan Matnlar")}</span>
                  <span className="text-[20px] font-black text-[#1c1b1b]">{history.filter(t => t.attempt).length} / {history.length}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default KnowzaAIReading;
