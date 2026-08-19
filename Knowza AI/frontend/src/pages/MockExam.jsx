import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import Seo from '../../components/Seo';
import { useTranslation } from 'react-i18next';

const KnowzaAIMockExam = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Screen states: 'select' | 'exam' | 'result'
  const [screenState, setScreenState] = useState('select');
  const [selectedExam, setSelectedExam] = useState('ielts');
  const [selectedFormat, setSelectedFormat] = useState('full_mock');
  const [selectedSubject, setSelectedSubject] = useState('Matematika');

  // Exam execution states
  const [mockId, setMockId] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // seconds
  const [loading, setLoading] = useState(false);

  // Result state
  const [examResult, setExamResult] = useState(null);

  // Timer countdown hook
  useEffect(() => {
    let timer;
    if (screenState === 'exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screenState, timeLeft]);

  // Format timer
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start exam simulation
  const handleStartExam = async () => {
    setLoading(true);
    try {
      const res = await apiService.startMockExam(
        selectedExam,
        selectedFormat,
        selectedExam === 'ms' ? selectedSubject : ''
      );
      if (res.success && res.data) {
        setMockId(res.data.id);
        setSections(res.data.sections || []);
        setCurrentSectionIndex(0);
        await loadSectionQuestions(res.data.id, 0, res.data.sections || []);
        setScreenState('exam');
      }
    } catch (err) {
      console.error('Failed to start mock exam:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load section questions
  const loadSectionQuestions = async (mId, secIdx, secList) => {
    setLoading(true);
    try {
      const res = await apiService.getMockSection(mId, secIdx);
      if (res.success && res.questions) {
        setQuestions(res.questions);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        const secInfo = (secList || sections)[secIdx];
        setTimeLeft((secInfo?.time_limit_minutes || 30) * 60);
      }
    } catch (err) {
      console.error('Failed to load section questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Option selection
  const handleSelectOption = (questionId, optionLetter) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  // Submit current section
  const handleSubmitSection = async () => {
    setLoading(true);
    try {
      const timeSpent = (sections[currentSectionIndex]?.time_limit_minutes || 30) * 60 - timeLeft;
      const res = await apiService.submitMockSection(mockId, currentSectionIndex, userAnswers, timeSpent);

      if (res.success) {
        if (res.is_last_section) {
          // Finalize mock exam
          const finalRes = await apiService.completeMockExam(mockId);
          if (finalRes.success && finalRes.result) {
            setExamResult(finalRes.result);
            setScreenState('result');
          }
        } else {
          // Move to next section
          const nextIdx = currentSectionIndex + 1;
          setCurrentSectionIndex(nextIdx);
          await loadSectionQuestions(mockId, nextIdx, sections);
        }
      }
    } catch (err) {
      console.error('Failed to submit section:', err);
    } finally {
      setLoading(false);
    }
  };

  const msSubjects = [
    'Matematika', 'Biologiya', 'Kimyo', 'Fizika',
    'Ona tili va adabiyot', 'Tarix', 'Geografiya', 'Ingliz tili'
  ];

  return (
    <>
      <Seo
        title={t("Mock Imtihon Simulyatori | Knowza AI")}
        description={t("IELTS, SAT va Milliy Sertifikat bo'yicha to'liq hajmli simulyatsiya va AI tahlili.")}
        icon="/banner/Knowza-logo-mini.png"
      />

      <div className="flex flex-col gap-6 w-full mx-auto animate-in fade-in duration-500">

        {/* ================= STATE 1: EXAM SELECTION ================= */}
        {screenState === 'select' && (
          <div className="flex flex-col gap-6">
            {/* Header banner */}
            <div className="bg-[#274ed5] p-6 md:p-8 rounded-3xl text-white flex flex-col gap-3 shadow-xs">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[12px] font-bold uppercase tracking-wider text-white border border-white/20 self-start">
                <span className="material-symbols-outlined text-[16px]">quiz</span>
                <span>{t("Mock Exam Simulator")}</span>
              </div>
              <h1 className="text-[24px] md:text-[28px] font-black leading-tight">{t("To'liq Hajmli Simulyatsion Imtihon")}</h1>
              <p className="text-white/80 text-[14px] leading-relaxed max-w-2xl">
                {t("IELTS, SAT va Milliy Sertifikat standartlari bo'yicha tayyorlangan adaptiv mock testlarda o'zingizni sinab ko'ring.")}
              </p>
            </div>

            {/* Exam track cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* IELTS */}
              <div
                onClick={() => setSelectedExam('ielts')}
                className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border flex flex-col justify-between ${
                  selectedExam === 'ielts'
                    ? 'border-2 border-[#274ed5] bg-[#f0f4ff]'
                    : 'border-[#e5e2e1] bg-white hover:border-[#274ed5]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e8edff] text-[#274ed5] flex items-center justify-center font-bold text-2xl">
                      🇬🇧
                    </div>
                    {selectedExam === 'ielts' && (
                      <span className="material-symbols-outlined text-[#274ed5] text-[22px]">check_circle</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-[18px] text-[#1c1b1b]">IELTS Academic</h3>
                  <p className="text-[#747686] text-[13px] mt-1 leading-relaxed">4 Bo'lim: Listening, Reading, Writing, Speaking</p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#e5e2e1] flex items-center justify-between text-[12px] text-[#747686] font-bold">
                  <span>9.0 Band Shkalasi</span>
                  <span>~170 daqiqa</span>
                </div>
              </div>

              {/* SAT */}
              <div
                onClick={() => setSelectedExam('sat')}
                className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border flex flex-col justify-between ${
                  selectedExam === 'sat'
                    ? 'border-2 border-[#d52727] bg-[#ffe8e8]/60'
                    : 'border-[#e5e2e1] bg-white hover:border-[#d52727]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d52727] flex items-center justify-center font-bold text-2xl">
                      🇺🇸
                    </div>
                    {selectedExam === 'sat' && (
                      <span className="material-symbols-outlined text-[#d52727] text-[22px]">check_circle</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-[18px] text-[#1c1b1b]">Digital SAT</h3>
                  <p className="text-[#747686] text-[13px] mt-1 leading-relaxed">4 Modul: 2 R&W + 2 Math (Adaptiv)</p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#e5e2e1] flex items-center justify-between text-[12px] text-[#747686] font-bold">
                  <span>1600 Ball Shkalasi</span>
                  <span>~134 daqiqa</span>
                </div>
              </div>

              {/* Milliy Sertifikat */}
              <div
                onClick={() => setSelectedExam('ms')}
                className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border flex flex-col justify-between ${
                  selectedExam === 'ms'
                    ? 'border-2 border-[#27d56e] bg-emerald-50/60'
                    : 'border-[#e5e2e1] bg-white hover:border-[#27d56e]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#27d56e] flex items-center justify-center font-bold text-2xl">
                      🇺🇿
                    </div>
                    {selectedExam === 'ms' && (
                      <span className="material-symbols-outlined text-[#27d56e] text-[22px]">check_circle</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-[18px] text-[#1c1b1b]">Milliy Sertifikat</h3>
                  <p className="text-[#747686] text-[13px] mt-1 leading-relaxed">Majburiy fanlar + Asosiy yo'nalish fani</p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#e5e2e1] flex items-center justify-between text-[12px] text-[#747686] font-bold">
                  <span>A+ / A / B+ Darajalar</span>
                  <span>~165 daqiqa</span>
                </div>
              </div>
            </div>

            {/* MS Subject selection */}
            {selectedExam === 'ms' && (
              <div className="bg-white p-6 rounded-3xl border border-[#e5e2e1] space-y-3">
                <label className="block text-[14px] font-bold text-[#1c1b1b]">
                  {t("Asosiy yo'nalish fanini tanlang:")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {msSubjects.map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`p-3.5 rounded-2xl border text-[13px] font-bold transition-all cursor-pointer ${
                        selectedSubject === subj
                          ? 'border-[#274ed5] bg-[#f0f4ff] text-[#274ed5]'
                          : 'border-[#e5e2e1] bg-[#fcf9f8] text-[#747686] hover:text-[#1c1b1b]'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="flex justify-end mt-2">
              <button
                onClick={handleStartExam}
                disabled={loading}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[15px] rounded-2xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>{t("Imtihon tayyorlanmoqda...")}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    <span>{t("Mock Imtihonni Boshlash")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STATE 2: LIVE EXAM WORKSPACE ================= */}
        {screenState === 'exam' && (
          <div className="flex flex-col gap-6">
            {/* Top Bar */}
            <div className="bg-white p-5 rounded-3xl border border-[#e5e2e1] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#747686] tracking-wider">
                  {sections[currentSectionIndex]?.name_uz || sections[currentSectionIndex]?.name}
                </span>
                <h2 className="text-[18px] font-bold text-[#1c1b1b]">
                  {t("Bo'lim")} {currentSectionIndex + 1} / {sections.length}
                </h2>
              </div>

              {/* Timer badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-mono font-black text-[18px]">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Question Card */}
            {loading ? (
              <div className="bg-white p-12 rounded-3xl border border-[#e5e2e1] text-center space-y-3">
                <span className="material-symbols-outlined text-[36px] text-[#274ed5] animate-spin">progress_activity</span>
                <p className="text-[#444654] font-bold text-[15px]">{t("Savollar yuklanmoqda...")}</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e5e2e1] space-y-6">
                {/* Question header */}
                <div className="flex items-center justify-between border-b border-[#e5e2e1] pb-4">
                  <span className="text-[13px] font-extrabold text-[#274ed5]">
                    {t("Savol")} {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  <span className="text-[12px] text-[#747686] font-bold bg-[#f0f4ff] px-3 py-1 rounded-full border border-blue-100">
                    {questions[currentQuestionIndex]?.topic}
                  </span>
                </div>

                {/* Question text */}
                <h3 className="text-[16px] md:text-[18px] font-bold text-[#1c1b1b] leading-relaxed">
                  {questions[currentQuestionIndex]?.question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentQuestionIndex]?.options?.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    const qId = String(questions[currentQuestionIndex]?.id || currentQuestionIndex + 1);
                    const isSelected = userAnswers[qId] === letter;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(qId, letter)}
                        className={`w-full p-4 rounded-2xl border text-left font-medium transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-[#274ed5] bg-[#f0f4ff] text-[#274ed5]'
                            : 'border-[#e5e2e1] text-[#1c1b1b] hover:border-[#274ed5]/40 bg-[#fcf9f8]'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[14px] ${
                            isSelected ? 'bg-[#274ed5] text-white' : 'bg-slate-200 text-[#444654]'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-[14px] md:text-[15px]">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Footer */}
                <div className="pt-4 border-t border-[#e5e2e1] flex items-center justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-5 py-2.5 rounded-xl border border-[#e5e2e1] text-[#747686] text-[13px] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    {t("Oldingisi")}
                  </button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-6 py-2.5 bg-[#274ed5] text-white rounded-xl text-[14px] font-bold hover:bg-[#1f42ba] cursor-pointer"
                    >
                      {t("Keyingisi")}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitSection}
                      disabled={loading}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[14px] font-bold hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
                    >
                      {currentSectionIndex < sections.length - 1
                        ? t("Keyingi Bo'limga O'tish")
                        : t("Mock Imtihonni Yakunlash")}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ================= STATE 3: RESULTS & AI REVIEW ================= */}
        {screenState === 'result' && examResult && (
          <div className="flex flex-col gap-6">
            {/* Score reveal card */}
            <div className="bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] p-8 md:p-10 rounded-3xl text-white text-center flex flex-col items-center gap-4 shadow-xs">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-[12px] font-bold uppercase tracking-wider text-white border border-white/20">
                <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                <span>{t("Mock Natijasi — Yakuniy Ball")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black">{examResult.band_equivalent}</h2>
              <p className="text-white/80 text-[14px] max-w-md mx-auto">
                {t("Sizning ko'rsatkichingiz rasmiy rasmiy standartlar bo'yicha hisoblab chiqildi.")}
              </p>
            </div>

            {/* Section Breakdown */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e5e2e1] space-y-6">
              <h3 className="font-bold text-[18px] text-[#1c1b1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">analytics</span>
                {t("Bo'limlar Bo'yicha Natijalar")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(examResult.section_scores || {}).map(([secName, secData]) => (
                  <div key={secName} className="p-4 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] space-y-2">
                    <div className="flex justify-between text-[14px] font-bold text-[#1c1b1b]">
                      <span>{secName}</span>
                      <span className="text-[#274ed5]">{secData.accuracy_percent}%</span>
                    </div>
                    <div className="w-full bg-[#e5e2e1] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#274ed5] h-full rounded-full transition-all duration-500"
                        style={{ width: `${secData.accuracy_percent}%` }}
                      ></div>
                    </div>
                    <div className="text-[12px] text-[#747686] flex justify-between font-medium">
                      <span>{t("To'g'ri javoblar:")}</span>
                      <span className="font-bold text-[#1c1b1b]">{secData.correct} / {secData.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Review Report */}
            {examResult.ai_review?.summary && (
              <div className="bg-[#f0f4ff] p-6 md:p-8 rounded-3xl border border-[#274ed5]/20 space-y-3">
                <h3 className="font-bold text-[18px] text-[#274ed5] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px]">psychology</span>
                  {t("AI Ustoz Tahlili va Tavsiyalari")}
                </h3>
                <div className="text-[#444654] text-[14px] leading-relaxed whitespace-pre-line">
                  {examResult.ai_review.summary}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-between">
              <button
                onClick={() => setScreenState('select')}
                className="px-6 py-3.5 bg-[#fcf9f8] text-[#1c1b1b] border border-[#e5e2e1] rounded-2xl font-bold hover:bg-slate-100 text-[14px] cursor-pointer"
              >
                {t("Yangi Mock Topshirish")}
              </button>
              <button
                onClick={() => navigate('/knowza-ai/planner')}
                className="px-8 py-3.5 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white rounded-2xl font-bold hover:opacity-95 text-[14px] cursor-pointer shadow-xs"
              >
                {t("O'quv Rejasiga O'tish")}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default KnowzaAIMockExam;
