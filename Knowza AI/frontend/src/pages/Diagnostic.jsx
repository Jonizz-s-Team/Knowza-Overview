import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Seo from '../../components/Seo';
import apiService from '../../data/apiService';
import { useAuth } from '../../context/AuthContext';

const KnowzaAIDiagnostic = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const urlExam = searchParams.get('examType') || searchParams.get('exam');
  const urlSubject = searchParams.get('subject');

  const [screen, setScreen] = useState('start'); // 'start', 'test', 'result', 'wizard'

  const changeScreen = (newScreen) => {
    setScreen(newScreen);
    if (newScreen === 'test') {
      navigate('/knowza-ai/diagnostic/test');
    } else if (newScreen === 'result') {
      navigate('/knowza-ai/diagnostic/result');
    } else if (newScreen === 'wizard') {
      navigate('/knowza-ai/diagnostic/wizard');
    } else {
      navigate('/knowza-ai/diagnostic/select');
    }
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/test') || path.includes('/diagnostic/test')) {
      if (screen !== 'test') setScreen('test');
    } else if (path.endsWith('/result') || path.includes('/diagnostic/result')) {
      if (screen !== 'result') setScreen('result');
    } else if (path.endsWith('/wizard') || path.includes('/diagnostic/wizard')) {
      if (screen !== 'wizard') setScreen('wizard');
    } else if (path.endsWith('/select') || path.endsWith('/diagnostic')) {
      if (screen !== 'start') setScreen('start');
    }
  }, [location.pathname]);
  
  // Start screen state
  const [examType, setExamType] = useState(() => {
    if (urlExam) {
      const upper = urlExam.toUpperCase();
      if (upper.includes('IELTS')) return 'IELTS';
      if (upper.includes('SAT')) return 'SAT';
      if (upper.includes('MS') || upper.includes('MILLIY') || upper.includes('DTM') || upper.includes('SERTIFIKAT')) return 'MS';
    }
    return 'IELTS';
  });
  const [subject, setSubject] = useState(() => urlSubject || 'English Foundation');

  // Test state
  const [diagnosticId, setDiagnosticId] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(25);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Results state
  const [results, setResults] = useState(null);
  
  // Onboarding AI Plan Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [dailyHours, setDailyHours] = useState('3'); // 1-2, 2-4, 4-6
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [paceMode, setPaceMode] = useState('normal'); // 'normal' | 'intensive'
  const [planTariff, setPlanTariff] = useState('free'); // 'free' (pro disabled)
  const [buildProgress, setBuildProgress] = useState(0); // 0 to 100% live progress

  const [selectedTrack, setSelectedTrack] = useState('ielts');

  // Animation state
  const [animateQuestion, setAnimateQuestion] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (screen === 'result' && results?.estimated_score) {
      const targetScore = parseFloat(results.estimated_score) || 0;
      let start = 0;
      const duration = 1500;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = targetScore / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= targetScore) {
          setScoreDisplay(targetScore);
          clearInterval(timer);
        } else {
          setScoreDisplay(start);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [screen, results]);

  // History tracking state for back/next navigation
  const [allQuestions, setAllQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showPalette, setShowPalette] = useState(false);

  // Auto check backend for active in_progress test or completed test on mount
  useEffect(() => {
    const checkUserTestSession = async () => {
      setLoading(true);
      try {
        const targetTrack = urlExam || 'ielts';
        const res = await apiService.getDiagnosticResult(targetTrack);
        
        if (res?.success) {
          if (res.completed && res.data) {
            setResults(res.data);
            
            const currentPath = location.pathname;
            if (currentPath.includes('/wizard')) {
              setScreen('wizard');
            } else if (currentPath.includes('/test')) {
              setScreen('test');
            } else {
              setScreen('result');
              if (!currentPath.includes('/result')) {
                navigate('/knowza-ai/diagnostic/result', { replace: true });
              }
            }
            setLoading(false);
            return;
          }
          if (res.in_progress && res.data?.id) {
            const diagId = res.data.id;
            localStorage.setItem('knowza_active_diagnostic_id', diagId);
            await loadAllQuestions(diagId);
            setLoading(false);
            return;
          }
        }

        // Clear stale local test ID if user has no test on backend
        localStorage.removeItem('knowza_active_diagnostic_id');
        const currentPath = location.pathname;
        if (!currentPath.includes('/wizard') && !currentPath.includes('/test')) {
          changeScreen('start');
        }
      } catch (e) {
        localStorage.removeItem('knowza_active_diagnostic_id');
        const currentPath = location.pathname;
        if (!currentPath.includes('/wizard') && !currentPath.includes('/test')) {
          changeScreen('start');
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserTestSession();
  }, [urlExam, currentUser?.id]);

  const loadAllQuestions = async (id) => {
    setLoading(true);
    try {
      setDiagnosticId(id);
      const res = await apiService.getDiagnosticAllQuestions(id);
      if (res?.success && Array.isArray(res.questions) && res.questions.length > 0) {
        setAllQuestions(res.questions);
        setTotalQuestions(res.total_questions || res.questions.length);
        
        // Populate existing user answers
        const existingAnswers = res.answers || {};
        setUserAnswers(existingAnswers);
        
        // Find first unanswered index or default to 1
        let firstUnanswered = 1;
        for (let i = 0; i < res.questions.length; i++) {
          if (!existingAnswers[String(i)] && existingAnswers[i] === undefined) {
            firstUnanswered = i + 1;
            break;
          }
        }
        
        setCurrentIdx(firstUnanswered);
        setQuestion(res.questions[firstUnanswered - 1]);
        setSelectedAnswer(existingAnswers[String(firstUnanswered - 1)] || existingAnswers[firstUnanswered - 1] || null);
        changeScreen('test');
        setTimerActive(true);
        setAnimateQuestion(true);
        return true;
      } else {
        localStorage.removeItem('knowza_active_diagnostic_id');
        changeScreen('start');
        return false;
      }
    } catch (e) {
      console.error('Error loading diagnostic questions', e);
      localStorage.removeItem('knowza_active_diagnostic_id');
      changeScreen('start');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resumeDiagnostic = async (id) => {
    setLoading(true);
    try {
      setDiagnosticId(id);
      await loadAllQuestions(id);
    } catch (e) {
      console.error('Error resuming diagnostic', e);
      localStorage.removeItem('knowza_active_diagnostic_id');
      changeScreen('start');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (overrideExam = null, overrideSubject = null) => {
    setLoading(true);
    const targetExam = overrideExam || (examType && examType !== 'foundation' ? examType : 'IELTS');
    const targetSubject = overrideSubject || (targetExam === 'MS' ? subject : null);

    // Clear stale local test ID before starting fresh test session for account
    localStorage.removeItem('knowza_active_diagnostic_id');

    try {
      const res = await apiService.startDiagnostic(targetExam, targetSubject);
      if (res?.already_completed && res?.result) {
        setResults(res.result);
        changeScreen('result');
        setLoading(false);
        return;
      }
      if (res?.diagnostic_id) {
        localStorage.setItem('knowza_active_diagnostic_id', res.diagnostic_id);
        const success = await loadAllQuestions(res.diagnostic_id);
        if (!success) {
          localStorage.removeItem('knowza_active_diagnostic_id');
          changeScreen('start');
        }
      } else {
        localStorage.removeItem('knowza_active_diagnostic_id');
        changeScreen('start');
      }
    } catch (e) {
      console.error('Error starting diagnostic', e);
      localStorage.removeItem('knowza_active_diagnostic_id');
      changeScreen('start');
    } finally {
      setLoading(false);
    }
  };

  const jumpToQuestion = (target1BasedIdx) => {
    if (target1BasedIdx < 1 || target1BasedIdx > totalQuestions) return;
    const target0Idx = target1BasedIdx - 1;
    setAnimateQuestion(false);
    setCurrentIdx(target1BasedIdx);
    setQuestion(allQuestions[target0Idx] || null);
    setSelectedAnswer(userAnswers[String(target0Idx)] || userAnswers[target0Idx] || null);
    setTimeout(() => setAnimateQuestion(true), 50);
  };

  const handleSelectAnswer = async (optId) => {
    setSelectedAnswer(optId);
    const updatedAnswers = { ...userAnswers, [String(currentIdx - 1)]: optId };
    setUserAnswers(updatedAnswers);
    try {
      await apiService.submitDiagnosticAnswer(diagnosticId, currentIdx - 1, optId, timeSpent);
    } catch (e) {
      console.error('Error submitting answer', e);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx >= totalQuestions) {
      handleFinish();
      return;
    }
    jumpToQuestion(currentIdx + 1);
  };

  const handlePrevQuestion = () => {
    if (currentIdx <= 1) return;
    jumpToQuestion(currentIdx - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await apiService.completeDiagnostic(diagnosticId);
      localStorage.removeItem('knowza_active_diagnostic_id');
      sessionStorage.setItem('knowza_diagnostic_completed', 'true');
      localStorage.setItem('knowza_diagnostic_completed', 'true');
      if (res?.result) {
        setResults(res.result);
        changeScreen('result');
      }
    } catch (e) {
      console.error('Error completing diagnostic', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  
  const getDifficultyColor = (diff) => {
    if (!diff) return 'bg-gray-100 text-gray-700';
    const lower = diff.toLowerCase();
    if (lower.includes('oson') || lower.includes('easy')) return 'bg-green-100 text-green-700';
    if (lower.includes('qiyin') || lower.includes('hard')) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const renderStartScreen = () => (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6 font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1b1b]">
      {/* Title & Description */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c1b1b] tracking-tight mb-3">
          {t('diagnostic_title', 'Diagnostik Test — Yo\'nalishni Tanlang')}
        </h1>
        <p className="text-sm sm:text-base text-[#444654] max-w-xl mx-auto font-semibold leading-relaxed">
          Tayyorgarlik yo'nalishingizni tanlang. Sun'iy intellekt darajangiz va zaif nuqtalaringizni aniqlab, 100% individual o'quv rejasini tuzib beradi.
        </p>
      </div>

      {/* 3 Main Exam Track Selection Cards (Equal width grid, no squishing, no shadow, no hover effect) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 w-full items-stretch">
        {/* Card 1: IELTS Academic */}
        <div 
          onClick={() => setExamType('IELTS')}
          className={`cursor-pointer rounded-2xl p-6 border-2 relative flex flex-col justify-between w-full min-w-0 transition-none shadow-none ${
            examType === 'IELTS'
              ? 'border-[#274ed5] bg-[#274ed5]/5'
              : 'border-[#e5e2e1] bg-white'
          }`}
        >
          {examType === 'IELTS' && (
            <span className="absolute top-4 right-4 bg-[#274ed5] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-none">
              Tanlandi
            </span>
          )}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#e8edff] text-[#274ed5] flex items-center justify-center text-2xl font-bold mb-4">
              🇬🇧
            </div>
            <h3 className="text-xl font-extrabold text-[#1c1b1b] mb-2">IELTS Academic</h3>
            <p className="text-xs text-[#444654] font-semibold leading-relaxed mb-2">
              45 ta Grammatika • 12 ta Reading • 1 ta Writing moslashuvchan daraja testi.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-[#e5e2e1] text-xs text-[#747686] font-bold flex items-center justify-between">
            <span>58 Savol</span>
            <span>~30 Daqiqa</span>
          </div>
        </div>

        {/* Card 2: Digital SAT */}
        <div 
          onClick={() => setExamType('SAT')}
          className={`cursor-pointer rounded-2xl p-6 border-2 relative flex flex-col justify-between w-full min-w-0 transition-none shadow-none ${
            examType === 'SAT'
              ? 'border-[#274ed5] bg-[#274ed5]/5'
              : 'border-[#e5e2e1] bg-white'
          }`}
        >
          {examType === 'SAT' && (
            <span className="absolute top-4 right-4 bg-[#274ed5] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-none">
              Tanlandi
            </span>
          )}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#e8edff] text-[#274ed5] flex items-center justify-center text-2xl font-bold mb-4">
              🇺🇸
            </div>
            <h3 className="text-xl font-extrabold text-[#1c1b1b] mb-2">Digital SAT</h3>
            <p className="text-xs text-[#444654] font-semibold leading-relaxed">
              Digital SAT Math va Reading & Writing modullari bo'yicha darajani baholash.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-[#e5e2e1] text-xs text-[#747686] font-bold flex items-center justify-between">
            <span>30 Savol</span>
            <span>~20 Daqiqa</span>
          </div>
        </div>

        {/* Card 3: Milliy Sertifikat / DTM */}
        <div 
          onClick={() => setExamType('MS')}
          className={`cursor-pointer rounded-2xl p-6 border-2 relative flex flex-col justify-between w-full min-w-0 transition-none shadow-none ${
            examType === 'MS'
              ? 'border-[#274ed5] bg-[#274ed5]/5'
              : 'border-[#e5e2e1] bg-white'
          }`}
        >
          {examType === 'MS' && (
            <span className="absolute top-4 right-4 bg-[#274ed5] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-none">
              Tanlandi
            </span>
          )}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#e8edff] text-[#274ed5] flex items-center justify-center text-2xl font-bold mb-4">
              🇺🇿
            </div>
            <h3 className="text-xl font-extrabold text-[#1c1b1b] mb-2">Milliy Sertifikat</h3>
            <p className="text-xs text-[#444654] font-semibold leading-relaxed">
              O'zbekiston Milliy Sertifikat mezonlari va DTM formati bo'yicha baholash.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-[#e5e2e1] text-xs text-[#747686] font-bold flex items-center justify-between">
            <span>25 Savol</span>
            <span>~15 Daqiqa</span>
          </div>
        </div>
      </div>

      {/* Subject Selector for Milliy Sertifikat */}
      {examType === 'MS' && (
        <div className="max-w-md mx-auto mb-8 bg-[#f5f8ff] border border-[#274ed5]/30 p-5 rounded-2xl shadow-none">
          <label className="block text-xs font-extrabold text-[#274ed5] uppercase tracking-wider mb-2">
            Fanni tanlang:
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3.5 bg-white border border-[#c4c5d7] rounded-xl text-sm font-bold text-[#1c1b1b] focus:ring-2 focus:ring-[#274ed5] outline-none shadow-none"
          >
            <option value="English Foundation">Ingliz tili (C1 / B2)</option>
            <option value="Ona tili va Adabiyot">Ona tili va Adabiyot</option>
            <option value="Matematika">Matematika</option>
            <option value="Fizika">Fizika</option>
            <option value="Tarix">Tarix</option>
          </select>
        </div>
      )}

      {/* Action CTA Button (Knowza AI Home page button style: flat #274ed5, no shadow, no hover) */}
      <div className="text-center pt-2">
        <button
          onClick={() => handleStart(examType, subject)}
          disabled={loading}
          className="inline-flex items-center justify-center px-10 py-4 text-base sm:text-lg font-extrabold rounded-2xl text-white bg-[#274ed5] border-none shadow-none transition-none cursor-pointer disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Test tayyorlanmoqda...
            </span>
          ) : (
            <span>
              {examType === 'IELTS' ? 'IELTS Diagnostik Testini Boshlash' : examType === 'SAT' ? 'SAT Diagnostik Testini Boshlash' : `Milliy Sertifikat (${subject}) Testini Boshlash`}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  const renderTestScreen = () => {
    if (loading && !question && !showFeedback) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
          <svg className="animate-spin h-12 w-12 text-[#274ed5] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h3 className="text-xl font-extrabold text-[#1c1b1b]">Keyingi savol tayyorlanmoqda...</h3>
          <p className="text-[#444654] font-semibold text-sm mt-2">Sun'iy intellekt darajangizga mos savol tanlamoqda</p>
        </div>
      );
    }

    if (!question) {
      return renderStartScreen();
    }

    const progressPercent = (currentIdx / totalQuestions) * 100;
    const optionLabels = ['A', 'B', 'C', 'D'];
    const options = Array.isArray(question.options) ? question.options : [];
    const activeSection = question.section || (currentIdx <= 45 ? 'Grammar' : currentIdx <= 57 ? 'Reading' : 'Writing');
    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] !== undefined && userAnswers[k] !== null && String(userAnswers[k]).trim() !== '').length;
    const isEssayQuestion = activeSection === 'Writing' || question.is_essay || options.length === 0;

    // Filter question index range per section

    let startQuestionIdx = 1;
    let endQuestionIdx = totalQuestions;
    if (examType === 'SAT') {
      if (currentIdx <= 15) { startQuestionIdx = 1; endQuestionIdx = 15; }
      else { startQuestionIdx = 16; endQuestionIdx = 30; }
    } else if (examType === 'MS') {
      startQuestionIdx = 1; endQuestionIdx = 25;
    } else { // IELTS
      if (activeSection === 'Grammar') { startQuestionIdx = 1; endQuestionIdx = 45; }
      else if (activeSection === 'Reading') { startQuestionIdx = 46; endQuestionIdx = 57; }
      else { startQuestionIdx = 58; endQuestionIdx = 58; }
    }

    // Count section answered questions
    const sectionAnsweredCount = Array.from(
      { length: endQuestionIdx - startQuestionIdx + 1 },
      (_, i) => startQuestionIdx + i - 1
    ).filter(idx0 => {
      const val = userAnswers[String(idx0)] || userAnswers[idx0];
      return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;

    return (
      <div className="w-full max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* 2-Column Balanced Centered Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start justify-center">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm sticky top-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                {activeSection}
              </span>
              <span className="text-xs font-black text-[#274ed5] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {sectionAnsweredCount} / {endQuestionIdx - startQuestionIdx + 1}
              </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[11px] font-medium text-gray-600 mb-4 pb-3 border-b border-gray-100">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ishlangan</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#274ed5]"></span> Joriy</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Ishlanmagan</span>
            </div>

            {/* Section Badges Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {Array.from({ length: endQuestionIdx - startQuestionIdx + 1 }, (_, i) => {
                const qNum = startQuestionIdx + i;
                const isCurrent = qNum === currentIdx;
                const ansVal = userAnswers[String(qNum - 1)] || userAnswers[qNum - 1];
                const isAnswered = ansVal !== undefined && ansVal !== null && String(ansVal).trim() !== '';

                let badgeStyle = 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
                if (isCurrent) {
                  badgeStyle = 'bg-[#274ed5] text-white font-extrabold border-[#274ed5] shadow-xs';
                } else if (isAnswered) {
                  badgeStyle = 'bg-emerald-500 text-white font-bold border-emerald-600';
                }

                return (
                  <button
                    key={qNum}
                    onClick={() => jumpToQuestion(qNum)}
                    className={`h-9 w-full rounded-xl text-xs font-bold flex items-center justify-center transition-colors border ${badgeStyle}`}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>

            {/* Section Navigation Tabs at Bottom of Sidebar */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                Bo'limlarga O'tish
              </span>

              {examType === 'SAT' ? (
                <>
                  <button
                    onClick={() => jumpToQuestion(1)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      currentIdx <= 15 ? 'bg-[#274ed5] text-white shadow-xs' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>📖 Reading & Writing</span>
                    <span className="text-[10px] opacity-75 font-normal">1–15</span>
                  </button>
                  <button
                    onClick={() => jumpToQuestion(16)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      currentIdx >= 16 ? 'bg-[#274ed5] text-white shadow-xs' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>🔢 Math</span>
                    <span className="text-[10px] opacity-75 font-normal">16–30</span>
                  </button>
                </>
              ) : examType === 'MS' ? (
                <button
                  onClick={() => jumpToQuestion(1)}
                  className="w-full text-left px-3.5 py-2.5 bg-[#274ed5] text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  🎓 Fan Diagnostikasi (1–25)
                </button>
              ) : (
                <>
                  <button
                    onClick={() => jumpToQuestion(1)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeSection === 'Grammar' ? 'bg-[#274ed5] text-white shadow-xs' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>📝 Grammar</span>
                    <span className="text-[10px] opacity-75 font-normal">1–45</span>
                  </button>
                  <button
                    onClick={() => jumpToQuestion(46)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeSection === 'Reading' ? 'bg-[#274ed5] text-white shadow-xs' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>📖 Reading</span>
                    <span className="text-[10px] opacity-75 font-normal">46–57</span>
                  </button>
                  <button
                    onClick={() => jumpToQuestion(58)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeSection === 'Writing' ? 'bg-[#274ed5] text-white shadow-xs' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>✍️ Writing</span>
                    <span className="text-[10px] opacity-75 font-normal">58</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Main Question Card & Progress Bar */}
          <div className="lg:col-span-9">
            {/* Top Sticky Bar - Moved Higher Up */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 mb-4 sticky top-2 z-10 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">
                    Knowza AI Diagnostik Test • {activeSection}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    Savol {currentIdx} / {totalQuestions}
                  </span>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-[#274ed5] rounded-lg border border-indigo-100">
                  {activeSection}
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-[#274ed5] h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Question Area */}
            <div className={`transition-all duration-500 transform ${animateQuestion ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
                <div className="p-6 sm:p-8">
                  {(() => {
                    let displayQuestion = question.text || question.question || '';
                    let displayPassage = question.passage || '';

                    if (isEssayQuestion) {
                      if (!displayQuestion || displayQuestion.includes('___') || displayQuestion.toLowerCase().includes('choose the correct form') || displayQuestion.includes('[Inversion]')) {
                        displayQuestion = "Writing Task 2 Essay: Some people believe that university education should be free for everyone. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.";
                      }
                      if (!displayPassage || displayPassage.includes('Read the text')) {
                        displayPassage = "Write your essay response in English in the text box below (minimum 150-250 words).";
                      }
                    }

                    return (
                      <>
                        {/* Only show passage if passage exists AND section is Reading/Writing */}
                        {displayPassage && activeSection !== 'Grammar' && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-slate-800 text-sm sm:text-base leading-relaxed">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Matn / Essay Guidance</span>
                            <div dangerouslySetInnerHTML={{ __html: displayPassage }} />
                          </div>
                        )}

                        <div className="prose prose-blue max-w-none mb-8">
                          <p className="text-lg sm:text-xl text-gray-900 font-medium leading-relaxed" 
                             dangerouslySetInnerHTML={{ __html: displayQuestion }} />
                        </div>
                      </>
                    );
                  })()}

                  {/* If Writing section -> Clean Lined Essay Paper Sheet */}
                  {isEssayQuestion ? (
                    <div className="mt-4">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-xs">
                        <textarea
                          rows={13}
                          value={selectedAnswer || ''}
                          onChange={(e) => handleSelectAnswer(e.target.value)}
                          placeholder="Write your essay response in English starting from line 1... (Minimum 150-250 words)"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(white, white 31px, #cbd5e1 31px, #cbd5e1 32px)',
                            lineHeight: '32px',
                            backgroundAttachment: 'local'
                          }}
                          className="w-full border-l-4 border-l-rose-400 pl-6 pr-4 py-2 text-slate-800 text-base font-normal tracking-wide focus:outline-none focus:ring-0 focus:border-l-rose-600 resize-y"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 mt-3 px-1">
                        <span>So'zlar soni: {(selectedAnswer || '').trim().split(/\s+/).filter(Boolean).length} ta</span>
                        <span>Belgilar soni: {(selectedAnswer || '').length} ta</span>
                      </div>
                    </div>
                  ) : (



                    /* Multiple Choice Options */
                    <div className="space-y-3">
                      {options.map((opt, idx) => {
                        const optId = typeof opt === 'object' ? (opt.id || String(idx)) : String(opt);
                        const optText = typeof opt === 'object' ? opt.text : opt;
                        const label = optionLabels[idx] || String(idx + 1);
                        
                        let optionStateClass = 'border-gray-200 hover:border-gray-300';
                        let radioVisual = (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0"></div>
                        );
                        
                        if (selectedAnswer === optId || selectedAnswer === String(optText)) {
                          optionStateClass = 'border-[#274ed5] bg-[#274ed5]/5 z-10 shadow-xs';
                          radioVisual = (
                            <div className="w-5 h-5 rounded-full border-2 border-[#274ed5] bg-[#274ed5] flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={optId}
                            disabled={loading}
                            onClick={() => handleSelectAnswer(optId)}
                            className={`w-full flex items-start text-left p-4 rounded-xl border-2 group transition-all ${optionStateClass}`}
                          >
                            <div className="flex-shrink-0 flex items-center mr-4 mt-0.5">
                              {radioVisual}
                            </div>
                            <div className="flex-grow">
                              <span className="font-bold mr-3 text-gray-700">{label}.</span>
                              <span className="text-gray-800" dangerouslySetInnerHTML={{ __html: optText }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

            
            {/* Action Bar with Back & Next buttons */}
            <div className="bg-gray-50 p-6 sm:px-8 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
              <button
                onClick={handlePrevQuestion}
                disabled={currentIdx <= 1 || loading}
                className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Orqaga
              </button>

              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-[#274ed5] hover:bg-[#1f3fb3]"
              >
                <span>{currentIdx >= totalQuestions ? 'Testni yakunlash ✨' : 'Keyingi savol'}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};


  const cleanTopicName = (topic) => {
    if (!topic) return "General Knowledge";
    let t = String(topic).trim();
    for (const prefix of ["grammar_", "reading_", "listening_", "writing_"]) {
      if (t.toLowerCase().startsWith(prefix)) {
        t = t.slice(prefix.length);
      }
    }
    t = t.replace(/_/g, " ").replace(/-/g, " ");
    t = t.split(/\s+/).filter(Boolean).join(" ");

    const mapping = {
      "mcq": "Multiple Choice Questions",
      "tfng": "True / False / Not Given",
      "second conditional": "Second Conditional (If Clauses)",
      "modal obligation": "Modal Verbs of Obligation",
      "modal deduction": "Modal Verbs of Deduction",
      "possessive relative clause": "Possessive Relative Clauses",
      "present perfect vs past simple": "Present Perfect vs. Past Simple",
      "subject verb agreement": "Subject-Verb Agreement",
      "gerund vs infinitive": "Gerunds vs. Infinitives",
      "articles a an the": "Articles (A / An / The)",
      "causative form": "Causative Form (Have/Get something done)",
      "antonym scarcity": "Vocabulary (Antonyms & Synonyms)",
      "wish clause": "Wish Clauses & Past Regrets",
      "prepositions of time": "Prepositions of Time (At / On / In)",
      "future continuous": "Future Continuous Tense",
      "present perfect": "Present Perfect Tense",
      "past perfect": "Past Perfect Tense",
      "past continuous": "Past Continuous Tense",
      "past simple": "Past Simple Tense",
      "present simple": "Present Simple Tense",
      "zero conditional": "Zero Conditional",
      "inversion": "Inversion & Negative Adverbials",
      "relative clauses": "Relative Clauses",
      "reported speech": "Reported Speech",
      "reading comprehension": "Reading Comprehension & Analysis",
      "reading headings": "Reading Paragraph Headings",
      "reading matching": "Reading Information Matching"
    };

    const lower = t.toLowerCase();
    if (mapping[lower]) return mapping[lower];
    return t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  };

  const renderResultScreen = () => {
    if (!results) return null;

    const displayLevel = results.display_level || results.estimated_band || "B1";
    const totalCorrect = results.total_correct || 0;
    const totalQuestionsCount = results.total_questions || 58;
    const accuracy = results.accuracy_percent || 0;

    const breakdown = results.section_breakdown || {};
    const weakTopics = results.weak_topics || [];
    const mistakes = results.mistakes || [];

    return (
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1b1b]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2 tracking-tight">
            Diagnostik Test Statistikasi
          </h1>
          <p className="text-[#444654] max-w-md mx-auto text-sm sm:text-base font-semibold">
            Sun'iy intellekt tahlili bo'yicha darajangiz va yo'l qo'yilgan xatolar ko'rsatkichi.
          </p>
        </div>

        {/* Main Stats Summary Cards (Taxminiy daraja removed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-[#e5e2e1] shadow-none text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#747686] block mb-1">To'g'ri Javoblar</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{totalCorrect} / {totalQuestionsCount}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e2e1] shadow-none text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#747686] block mb-1">Umumiy Aniqlik</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{accuracy}%</span>
          </div>
        </div>

        {/* Section Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#274ed5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Bo'limlar Bo'yicha Natijalar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(breakdown).map(([secName, secData]) => (
                <div key={secName} className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 text-sm">{secName}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {secData.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div className="bg-[#274ed5] h-2 rounded-full" style={{ width: `${secData.accuracy}%` }}></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{secData.correct} ta to'g'ri ({secData.total} ta savoldan)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Topics Analysis */}
        {weakTopics.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 mb-8 shadow-xs">
            <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Yetishmovchilik Bor Mavzular (Bo'shliqlar)
            </h3>
            <p className="text-sm font-medium text-amber-800 mb-4">
              Sun'iy intellekt quyidagi mavzularda xatolar aniqladi va ularni o'rganish rejangizga kiritadi:
            </p>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((topic, idx) => (
                <span key={idx} className="bg-white border border-amber-300/80 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  {cleanTopicName(topic)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Mistakes Log */}
        {mistakes.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Xato Qilingan Savollar Tahlili ({mistakes.length} ta)
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {mistakes.map((m, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800">
                  <div className="flex items-center justify-between font-bold mb-1.5 text-slate-900">
                    <span>Savol #{m.question_index} ({m.section})</span>
                    <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg font-bold">
                      {cleanTopicName(m.topic)}
                    </span>
                  </div>
                  {m.explanation && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-medium flex items-start gap-1.5">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                      <span><strong>Tushuntirish:</strong> {m.explanation}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Single Primary Action Button: Proceed to Interactive AI Plan Setup Wizard */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setWizardStep(1);
              changeScreen('wizard');
            }}
            className="w-full sm:w-auto px-10 py-4 bg-[#274ed5] text-white font-bold text-base rounded-xl inline-flex items-center justify-center gap-3 transition-all shadow-md hover:bg-[#1f3fb3] hover:shadow-lg active:scale-98"
          >
            <span>Davom ettirish</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderWizardScreen = () => {
    const daysConfig = [
      { id: 'mon', label: 'Dushanba' },
      { id: 'tue', label: 'Seshanba' },
      { id: 'wed', label: 'Chorshanba' },
      { id: 'thu', label: 'Payshanba' },
      { id: 'fri', label: 'Juma' },
      { id: 'sat', label: 'Shanba' },
      { id: 'sun', label: 'Yakshanba' }
    ];

    const toggleDay = (dayId) => {
      if (selectedDays.includes(dayId)) {
        if (selectedDays.length > 1) {
          setSelectedDays(selectedDays.filter(d => d !== dayId));
        }
      } else {
        setSelectedDays([...selectedDays, dayId]);
      }
    };

    const handleFinalizePlan = async () => {
      setWizardStep(4);
      setBuildProgress(5);

      // Start realistic smooth percentage timer ticking from 5% to ~90% while backend builds plan
      const interval = setInterval(() => {
        setBuildProgress((prev) => {
          if (prev >= 90) {
            return 90;
          }
          const increment = Math.floor(Math.random() * 6) + 3;
          return Math.min(prev + increment, 90);
        });
      }, 200);

      try {
        await apiService.generateRoadmap({
          daily_hours: dailyHours,
          study_days: selectedDays,
          pace_mode: paceMode,
          plan_tariff: planTariff,
          exam_type: results?.exam_type || 'IELTS'
        });

        await queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
        await queryClient.refetchQueries({ queryKey: ['roadmaps'] });

        localStorage.setItem('knowza_diagnostic_completed', 'true');
        sessionStorage.setItem('knowza_diagnostic_completed', 'true');

        clearInterval(interval);
        setBuildProgress(100);

        setTimeout(() => {
          window.location.href = '/knowza-ai/planner';
        }, 400);
      } catch (e) {
        console.error("Error finalizing plan", e);
        await queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
        localStorage.setItem('knowza_diagnostic_completed', 'true');
        sessionStorage.setItem('knowza_diagnostic_completed', 'true');
        clearInterval(interval);
        setBuildProgress(100);
        setTimeout(() => {
          window.location.href = '/knowza-ai/planner';
        }, 400);
      }
    };


    return (
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 font-sans antialiased text-slate-900 tracking-tight">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${wizardStep >= 1 ? 'bg-[#274ed5] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <div className={`w-8 h-1 rounded-full ${wizardStep >= 2 ? 'bg-[#274ed5]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${wizardStep >= 2 ? 'bg-[#274ed5] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          <div className={`w-8 h-1 rounded-full ${wizardStep >= 3 ? 'bg-[#274ed5]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${wizardStep >= 3 ? 'bg-[#274ed5] text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
          <div className={`w-8 h-1 rounded-full ${wizardStep >= 4 ? 'bg-[#274ed5]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${wizardStep >= 4 ? 'bg-[#274ed5] text-white' : 'bg-slate-200 text-slate-500'}`}>4</div>
        </div>

        {wizardStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">
              1-qadam: Kunlik O'quv Vaqtingiz va Kunlaringiz
            </h2>
            <p className="text-slate-600 text-sm text-center mb-8 font-medium">
              Sun'iy intellekt shaxsiy jadvalingizni diagnostika natijalaringizga moslashtiradi.
            </p>

            {/* Daily Hours Selection */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-800 mb-3">
                1. Kunlik qancha vaqt ajrata olasiz?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '2', hours: '1-2 soat', title: 'Yengil Rejim', desc: 'Yengil tayyorgarlik', badge: 'Tavsiya etiladi' },
                  { id: '3', hours: '2-4 soat', title: 'Standart Rejim', desc: 'Maksimal samaradorlik', badge: 'Ommabop' },
                  { id: '5', hours: '4-6 soat', title: 'Intensiv Rejim', desc: 'Kuchaytirilgan tayyorgarlik', badge: 'Tezlashtirilgan' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDailyHours(opt.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      dailyHours === opt.id
                        ? 'border-[#274ed5] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {dailyHours === opt.id && (
                      <span className="absolute top-3 right-3 text-[#274ed5] font-bold">✓</span>
                    )}
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md inline-block mb-1">
                      {opt.hours}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{opt.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Days Selection */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-800">
                  2. Haftaning qaysi kunlarida shug'ullanmoqchisiz?
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])}
                    className="text-[#274ed5] font-bold hover:underline"
                  >
                    Har kuni
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri'])}
                    className="text-slate-600 font-medium hover:underline"
                  >
                    Ish kunlari
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {daysConfig.map((d) => {
                  const active = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDay(d.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        active
                          ? 'bg-[#274ed5] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => changeScreen('result')}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Orqaga
              </button>
              <button
                onClick={() => setWizardStep(2)}
                className="px-7 py-3 bg-[#274ed5] text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 hover:bg-[#1f3fb3] shadow-xs"
              >
                <span>Keyingi qadam</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">
              2-qadam: Rejangiz Intensivligi
            </h2>
            <p className="text-slate-600 text-sm text-center mb-8 font-medium">
              Siz intensiv yoki oddiyroq shug'ullanmoqchimisiz?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Normal Pace */}
              <button
                type="button"
                onClick={() => setPaceMode('normal')}
                className={`p-6 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                  paceMode === 'normal'
                    ? 'border-[#274ed5] bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {paceMode === 'normal' && (
                  <span className="absolute top-4 right-4 text-[#274ed5] font-black">
                    <svg className="w-5 h-5 text-[#274ed5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-3 shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l9-3 9 3M3 6v12l9 3 9-3V6M3 6l9 3 9-3"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-1">Oddiy Rejim (Normal Pace)</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">
                  Bosqichma-bosqich, puxta va muvozanatli ta'lim. Dars va boshqa ishlar bilan olib borishga ideal.
                </p>
                <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Balansli & Stabil natija
                </span>
              </button>

              {/* Intensive Pace */}
              <button
                type="button"
                onClick={() => setPaceMode('intensive')}
                className={`p-6 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                  paceMode === 'intensive'
                    ? 'border-[#274ed5] bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {paceMode === 'intensive' && (
                  <span className="absolute top-4 right-4 text-[#274ed5] font-black">
                    <svg className="w-5 h-5 text-[#274ed5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-3 shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-1">Intensiv Rejim (Intensive Pace)</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">
                  Qisqa muddatda maksimal natija va chuqurlashtirilgan mashqlar. Imtihonga oz vaqt qolganlar uchun.
                </p>
                <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Maksimal tezlik & Kuchaytirilgan
                </span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => setWizardStep(1)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Orqaga
              </button>
              <button
                onClick={() => setWizardStep(3)}
                className="px-7 py-3 bg-[#274ed5] text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 hover:bg-[#1f3fb3] shadow-xs"
              >
                <span>Keyingi qadam</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tariff / Plan Tier Choice (Pro vs Free) */}
        {wizardStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">
              3-qadam: Tarif va Reja Qamrovi Tanlovi
            </h2>
            <p className="text-slate-600 text-sm text-center mb-8 font-medium max-w-lg mx-auto">
              Siz PRO tarifga o'tmoqchimisiz? Rejangizni yanada chuqurroq va kuchliroq shakllantirishingiz mumkin!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 items-stretch">
              {/* Pro Tariff (Disabled for now) */}
              <div
                className="w-full flex flex-col justify-between p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/80 opacity-60 text-left relative cursor-not-allowed select-none"
              >
                <div className="w-full">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-lg mb-3 shrink-0">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-extrabold text-slate-700 text-base">PRO Tarif</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                      Hozircha mavjud emas (Tez kunda)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium block">
                    Rejani 2 barobar chuqurroq va kuchliroq qiladi! Barcha zaif mavzular bo'yicha chuqurlashtirilgan mashqlar va Deep Research imkoniyati.
                  </p>
                </div>
                <div>
                  <span className="inline-block text-[11px] font-bold text-slate-500 bg-slate-200/80 border border-slate-300 px-2.5 py-1 rounded-lg">
                    🔒 Tez kunda ishga tushadi
                  </span>
                </div>
              </div>

              {/* Free Plan (Active & Selected) */}
              <button
                type="button"
                onClick={() => setPlanTariff('free')}
                className="w-full flex flex-col justify-between p-6 rounded-2xl border-2 border-[#274ed5] bg-blue-50/60 shadow-md text-left relative cursor-pointer"
              >
                <span className="absolute top-4 right-4 text-[#274ed5] font-black">
                  <svg className="w-5 h-5 text-[#274ed5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </span>
                <div className="w-full">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg mb-3 shrink-0">
                    <svg className="w-5 h-5 text-[#274ed5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base">FREE Plan (Bepul Rejim)</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Faol rejim
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium block">
                    Standart reja bilan davom etish. Oddiyroq tuzilma bo'ladi, lekin baribir ta'lim berish mantiqi va sifati juda yaxshi saqlanadi.
                  </p>
                </div>
                <div>
                  <span className="inline-block text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg">
                    Standart & Sifatli Ta'lim
                  </span>
                </div>
              </button>
            </div>



            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => setWizardStep(2)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Orqaga
              </button>
              <button
                onClick={handleFinalizePlan}
                className="px-8 py-3.5 bg-[#274ed5] text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 hover:bg-[#1f3fb3] shadow-md cursor-pointer"
              >
                <span>AI Rejani Shakllantirish</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Live Real Progress & Redirection */}
        {wizardStep === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm text-center font-sans antialiased">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 pt-4">
              Sun'iy Intellekt Shaxsiy Rejangizni Yaratmoqda...
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 font-medium leading-relaxed">
              Diagnostika natijalaringiz, tanlagan kunlaringiz va {dailyHours} soatlik ajratilgan vaqtingiz bo'yicha 100% individual reja shakllantirilmoqda.
            </p>

            {/* Gorizontal Liniyalik Live Progress Bar & Percentage */}
            <div className="max-w-md mx-auto mb-8 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  {buildProgress < 25 && "Diagnostika xatoligi va zaif mavzular tahlili..."}
                  {buildProgress >= 25 && buildProgress < 60 && "Kunlik va haftalik jadval biriktirilmoqda..."}
                  {buildProgress >= 60 && buildProgress < 90 && "Sun'iy intellekt dars modullarini tuzmoqda..."}
                  {buildProgress >= 90 && "O'quv rejasi tayyorlandi!"}
                </span>
                <span className="text-xl font-black text-[#274ed5]">{buildProgress}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-blue-200">
                <div
                  className="bg-[#274ed5] h-full rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${buildProgress}%` }}
                >
                </div>
              </div>
            </div>

            {/* Live Checklist */}
            <div className="max-w-md mx-auto space-y-3 text-left bg-slate-50/80 p-5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
              <div className={`flex items-center gap-2.5 transition-all ${buildProgress >= 20 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${buildProgress >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                  ✓
                </div>
                <span>Diagnostika xatolari va zaif mavzular tahlil qilindi</span>
              </div>

              <div className={`flex items-center gap-2.5 transition-all ${buildProgress >= 45 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${buildProgress >= 45 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                  ✓
                </div>
                <span>Kunlik {dailyHours} soatlik va haftada {selectedDays.length} kunlik jadval biriktirildi</span>
              </div>

              <div className={`flex items-center gap-2.5 transition-all ${buildProgress >= 70 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${buildProgress >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                  ✓
                </div>
                <span>{paceMode === 'intensive' ? 'Intensiv rejim' : 'Oddiy rejim'} traektoriyasi biriktirildi</span>
              </div>

              <div className={`flex items-center gap-2.5 transition-all ${buildProgress >= 95 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${buildProgress >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                  ✓
                </div>
                <span>FREE Plan: Standart va puxta o'quv rejasi tayyorlandi</span>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  };

  return (
    <>
      <Seo title={t('diagnostic_title', 'Diagnostik Test | Knowza AI')} />
      <div className="min-h-screen bg-white font-sans text-gray-900">
        {screen === 'start' && renderStartScreen()}
        {screen === 'test' && renderTestScreen()}
        {screen === 'result' && renderResultScreen()}
        {screen === 'wizard' && renderWizardScreen()}
      </div>
    </>
  );
};


export default KnowzaAIDiagnostic;
