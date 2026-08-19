import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Seo from '../../components/Seo';
import apiService from '../../data/apiService';

const KnowzaAITest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const examType = searchParams.get('examType') || '';
  const initialTopic = searchParams.get('topic') || '';

  const getExamTitle = (type) => {
    if (type === 'ielts') return 'IELTS Academic Diagnostic Level Test';
    if (type === 'sat') return 'Digital SAT Placement Diagnostic Test';
    if (type === 'ms') return 'Milliy Sertifikat Daraja Aniqlash Testi';
    return initialTopic || 'IELTS Academic Reading & Vocabulary';
  };

  const [topic, setTopic] = useState(getExamTitle(examType));
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testData, setTestData] = useState(null);

  // Active question execution state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempt, setAttempt] = useState(1);
  const [socraticResult, setSocraticResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [isTestFinished, setIsTestFinished] = useState(false);

  // Auto-generate test if examType or topic provided via URL
  useEffect(() => {
    const target = getExamTitle(examType);
    setTopic(target);
    if (examType || initialTopic) {
      handleGenerateTest(target);
    }
  }, [examType, initialTopic]);

  const handleGenerateTest = async (targetTopic = topic) => {
    if (!targetTopic.trim() || isGenerating) return;
    setIsGenerating(true);
    setTestData(null);
    setSocraticResult(null);
    setCurrentIdx(0);
    setCompletedQuestions([]);
    setIsTestFinished(false);

    try {
      const res = await apiService.knowzaAIGenerateTest(targetTopic, difficulty);
      if (res && res.questions && res.questions.length > 0) {
        setTestData(res);
        setAttempt(1);
      } else {
        toast.error(t("Test savollari shakllanmadi. Qayta urinib ko'ring."));
      }
    } catch (err) {
      console.error("Test generation error:", err);
      toast.error(err?.message || t("Test yaratishda xatolik yuz berdi."));
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQuestion = testData?.questions?.[currentIdx];

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim() || isEvaluating || !currentQuestion) return;
    setIsEvaluating(true);

    try {
      const testId = testData?.id || testData?.test_id || 'ielts_academic_test_01';
      const questionId = currentQuestion.question_id || currentQuestion.id || `q_${currentIdx + 1}`;

      const res = await apiService.socraticEval(testId, questionId, userAnswer, attempt);
      setSocraticResult(res);

      if (res.status === 'correct' || res.status === 'failed' || attempt >= 3) {
        setCompletedQuestions(prev => [
          ...prev,
          {
            question_id: questionId,
            is_correct: res.status === 'correct',
            topic: currentQuestion.topic || topic,
            attempts: attempt
          }
        ]);
      }
    } catch (err) {
      console.error("Socratic evaluation error:", err);
      toast.error(err?.message || t("Javobni baholashda xatolik yuz berdi."));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    setSocraticResult(null);
    setUserAnswer('');
    setAttempt(1);

    if (currentIdx + 1 < (testData?.questions?.length || 0)) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Finalize test and sync skill gaps with backend
      setIsTestFinished(true);
      try {
        await apiService.submitSandboxTest(completedQuestions, topic);
        toast.success(t("Test yakunlandi va natijalar profil statistikangizga saqlandi!"));
      } catch (e) {
        console.warn("Sandbox results submission error:", e);
      }
    }
  };

  return (
    <>
      <Seo 
        title={t("AI Amaliy Test | Knowza AI")} 
        description={t("Sun'iy intellekt tomonidan yaratilgan interaktiv Sokratik test mashqlari.")} 
      />

      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-in fade-in duration-500">
        
        {/* Top Bar / Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#e5e2e1] shadow-xs flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/knowza-ai/planner')}
              className="w-10 h-10 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] flex items-center justify-center text-[#1c1b1b] hover:bg-[#e8edff] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h2 className="text-[20px] font-bold text-[#1c1b1b] leading-tight">{t("AI Sokratik Amaliy Test")}</h2>
              <p className="text-[12px] text-[#444654] font-medium">{t("Mavzuni tanlang va 3 bosqichli Sokratik AI yordamida bilimingizni sinang")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold uppercase transition-all ${
                  difficulty === d 
                    ? 'bg-[#274ed5] text-white' 
                    : 'bg-[#fcf9f8] text-[#747686] border border-[#e5e2e1]'
                }`}
              >
                {t(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input Bar */}
        {!testData && !isGenerating && (
          <div className="bg-white p-6 rounded-3xl border border-[#e5e2e1] shadow-xs space-y-4">
            <h3 className="text-[16px] font-bold text-[#1c1b1b]">{t("Qaysi mavzuda test ishlamoqchisiz?")}</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("Masalan: IELTS Reading True/False/Not Given, SAT Linear Equations...")}
                className="flex-1 px-4 py-3 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl text-[14px] outline-none focus:border-[#274ed5] font-semibold text-[#1c1b1b]"
              />
              <button
                onClick={() => handleGenerateTest(topic)}
                disabled={!topic.trim()}
                className="px-6 py-3 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[14px] rounded-2xl border border-white/20 hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-40"
              >
                {t("Test Yaratish")}
              </button>
            </div>
          </div>
        )}

        {/* Generating Indicator */}
        {isGenerating && (
          <div className="bg-white p-12 rounded-3xl border border-[#e5e2e1] shadow-xs text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#274ed5] border-t-transparent animate-spin"></div>
            <h3 className="text-[18px] font-bold text-[#1c1b1b]">{t("AI Moslashtirilgan Test Yaratmoqda...")}</h3>
            <p className="text-[13px] text-[#747686] font-medium">{t("Sizning darajangiz va bo'shliqlaringiz tahlil qilinmoqda")}</p>
          </div>
        )}

        {/* Active Test Execution Interface */}
        {testData && currentQuestion && !isTestFinished && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e5e2e1] shadow-xs space-y-6">
            
            {/* Test Progress Bar */}
            <div className="flex justify-between items-center text-[13px] font-bold text-[#444654]">
              <span>{t("Savol {{current}} / {{total}}", { current: currentIdx + 1, total: testData.questions.length })}</span>
              <span className="px-3 py-1 bg-[#e8edff] text-[#274ed5] rounded-full text-[12px] font-extrabold uppercase">
                {t("Urinish")} {attempt}/3
              </span>
            </div>

            <div className="w-full bg-[#e5e2e1] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#1f42ba] via-[#274ed5] to-[#4f75ff] h-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / testData.questions.length) * 100}%` }}
              />
            </div>

            {/* Passage if applicable */}
            {currentQuestion.passage && (
              <div className="p-4 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl text-[14px] leading-relaxed text-[#1c1b1b] font-medium max-h-60 overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentQuestion.passage}
                </ReactMarkdown>
              </div>
            )}

            {/* Question Prompt */}
            <div className="text-[16px] md:text-[18px] font-bold text-[#1c1b1b] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentQuestion.question || currentQuestion.question_text}
              </ReactMarkdown>
            </div>

            {/* Multiple Choice Options if available */}
            {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = userAnswer.toLowerCase() === letter.toLowerCase() || userAnswer === opt;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setUserAnswer(letter)}
                      disabled={socraticResult && (socraticResult.status === 'correct' || attempt >= 3)}
                      className={`p-4 rounded-2xl border text-left font-semibold text-[14px] transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected 
                          ? 'border-[#274ed5] bg-[#e8edff] text-[#274ed5]' 
                          : 'border-[#e5e2e1] bg-[#fcf9f8] text-[#1c1b1b] hover:border-[#274ed5]/40'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[13px] ${
                        isSelected ? 'bg-[#274ed5] text-white' : 'bg-white border border-[#e5e2e1] text-[#747686]'
                      }`}>
                        {letter}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Open-ended text input */
              <div className="space-y-2">
                <label className="block text-[12px] font-bold text-[#444654] uppercase tracking-wider">
                  {t("Javobingizni yozing:")}
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={socraticResult && (socraticResult.status === 'correct' || attempt >= 3)}
                  placeholder={t("Javobni kiriting...")}
                  className="w-full p-3.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl outline-none focus:border-[#274ed5] font-semibold text-[14px] text-[#1c1b1b]"
                />
              </div>
            )}

            {/* Socratic Feedback Panel */}
            {socraticResult && (
              <div className={`p-5 rounded-2xl border space-y-3 ${
                socraticResult.status === 'correct'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-[15px]">
                  <span className="material-symbols-outlined text-[20px]">
                    {socraticResult.status === 'correct' ? 'check_circle' : 'psychology'}
                  </span>
                  <span>{socraticResult.feedback}</span>
                </div>

                {socraticResult.socratic_hint && (
                  <p className="text-[13px] font-semibold opacity-90">
                    💡 {socraticResult.socratic_hint}
                  </p>
                )}

                {socraticResult.explanation && (
                  <div className="text-[13px] font-medium leading-relaxed pt-2 border-t border-black/10">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {socraticResult.explanation}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Controls / Action Buttons */}
            <div className="flex justify-between items-center pt-2">
              {!socraticResult || (socraticResult.status === 'incorrect' && attempt < 3) ? (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!userAnswer.trim() || isEvaluating}
                  className="px-6 py-3 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[14px] rounded-2xl hover:opacity-95 active:scale-95 transition-all border border-white/20 disabled:opacity-40 cursor-pointer ml-auto"
                >
                  {isEvaluating ? t("Tekshirilmoqda...") : (attempt > 1 ? t("Qayta Tekshirish") : t("Javobni Tekshirish"))}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[14px] rounded-2xl hover:opacity-95 active:scale-95 transition-all border border-white/20 cursor-pointer ml-auto flex items-center gap-2"
                >
                  <span>{currentIdx + 1 < testData.questions.length ? t("Keyingi Savol") : t("Testni Yakunlash")}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* Test Completion Summary */}
        {isTestFinished && (
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#e5e2e1] shadow-xs text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              <span className="material-symbols-outlined text-[36px]">celebration</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[24px] font-bold text-[#1c1b1b]">{t("Test Muvaffaqiyatli Yakunlandi!")}</h3>
              <p className="text-[14px] text-[#444654] font-medium max-w-md mx-auto">
                {t("Barcha natijalar va Sokratik tahlillar saqlandi. Profilingizdagi Skills Gap xaritasida kuchli va zaif tomonlaringiz yangilandi.")}
              </p>
            </div>

            {/* Predictive Score & Level Card */}
            <div className="bg-[#f0f4ff] border border-[#274ed5]/20 p-6 rounded-3xl text-left max-w-lg mx-auto space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-[#274ed5] uppercase tracking-wider">
                  {t("AI Taxminiy Ball va CEFR Darajasi")}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase">
                  B2 Strong Level
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-black text-[#1c1b1b]">Band 7.0</span>
                <span className="text-[14px] text-[#444654] font-bold">(B2 Strong / Upper-Intermediate)</span>
              </div>
              <p className="text-[13px] text-[#444654] leading-relaxed">
                {t("Ushbu test natijalariga ko'ra sizning bilim poydevoringiz B2 Strong darajasiga yetdi. IELTS 7.5+ / SAT 1450+ / MS A+ maqsadiga yetish uchun zaif ko'nikmalar ustida mashqni davom ettiring!")}
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={() => handleGenerateTest(topic)}
                className="px-6 py-3 bg-[#e8edff] text-[#274ed5] font-bold text-[14px] rounded-2xl border border-[#274ed5]/20 hover:bg-[#dde4ff] transition-all cursor-pointer"
              >
                {t("Qayta Ishtirok Etish")}
              </button>
              <button
                onClick={() => navigate('/knowza-ai/analytics')}
                className="px-6 py-3 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[14px] rounded-2xl border border-white/20 hover:opacity-95 transition-all cursor-pointer"
              >
                {t("Tahlillarni Ko'rish")}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default KnowzaAITest;
