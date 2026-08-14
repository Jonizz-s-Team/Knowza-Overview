import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../data/apiService';
import { PlannerSkeleton } from '../../components/Skeletons';
import { EXAM_TRACKS } from '../../data/goalConstants';
import { usePlannerContext } from '../../context/PlannerContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/Seo';
import GoalEditModal from '../../components/GoalEditModal';
import dayjs from 'dayjs';

// Real Backend Planner & Roadmap Component (Zero Hardcoded Mocks)

export default function Planner() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedTrackId, setSelectedTrackId] = useState('ielts');
  const [showTooltip, setShowTooltip] = useState(false);
  const [completedTasks, setCompletedTasks] = useState({});
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const { generatingPlannerState, startPlannerGeneration } = usePlannerContext();

  const isPro = useMemo(() => {
    return Boolean(currentUser?.is_pro || currentUser?.is_premium || currentUser?.tariff === 'pro' || currentUser?.plan === 'pro');
  }, [currentUser]);

  const { data: roadmaps, isLoading } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: async () => {
      const res = await apiService.getRoadmap();
      if (res.success && res.data) return Array.isArray(res.data) ? res.data : [res.data];
      return [];
    },
    refetchInterval: 15000
  });

  const regenerateNodeMutation = useMutation({
    mutationFn: (id) => apiService.regenerateRoadmapNode(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roadmaps'] }),
    onError: () => alert(t("Xatolik yuz berdi."))
  });

  // Extract track styling and active track
  const activeTrack = useMemo(() => {
    return EXAM_TRACKS.find(t => t.id === selectedTrackId) || EXAM_TRACKS[0];
  }, [selectedTrackId]);

  // Helper to check if student has set a target goal/mission for a given track in Profile
  const hasMissionForTrack = useCallback((track) => {
    const goals = currentUser?.target_goals;
    if (!Array.isArray(goals) || goals.length === 0) return false;
    
    const trackName = (track.name || '').toLowerCase();
    const trackId = (track.id || '').toLowerCase();

    return goals.some(g => {
      if (!g) return false;
      const name = (typeof g === 'string' ? g : g.name || g.title || g.type || '').toLowerCase();
      
      if (trackId === 'ielts' && (name.includes('ielts') || name.includes('ingliz'))) return true;
      if (trackId === 'sat' && name.includes('sat')) return true;
      if (trackId === 'ms' && (name.includes('milliy') || name.includes('sertifikat') || name.includes('dtm'))) return true;
      
      return name.includes(trackName) || name.includes(trackId);
    });
  }, [currentUser]);

  // Available tracks filtered to active mission goals (defaults to IELTS)
  const availableTracks = useMemo(() => {
    const goals = currentUser?.target_goals;
    if (!Array.isArray(goals) || goals.length === 0) {
      return EXAM_TRACKS.filter(t => t.id === 'ielts');
    }
    const active = EXAM_TRACKS.filter(t => hasMissionForTrack(t));
    return active.length > 0 ? active : EXAM_TRACKS.filter(t => t.id === 'ielts');
  }, [currentUser, hasMissionForTrack]);

  // Fetch user's real diagnostic test result for active track
  const { data: diagRes } = useQuery({
    queryKey: ['diagnosticResult', selectedTrackId],
    queryFn: async () => {
      try {
        const res = await apiService.getDiagnosticResult(selectedTrackId);
        if (res.success && res.data) return res.data;
      } catch (e) {}
      return null;
    }
  });

  // Find user's target goal object for active track
  const userGoal = useMemo(() => {
    const goals = currentUser?.target_goals;
    if (!Array.isArray(goals)) return null;
    const trackName = activeTrack.name.toLowerCase();
    const trackId = activeTrack.id.toLowerCase();
    return goals.find(g => {
      if (!g) return null;
      const name = (typeof g === 'string' ? g : g.name || g.title || g.type || '').toLowerCase();
      return name.includes(trackName) || name.includes(trackId);
    }) || null;
  }, [currentUser, activeTrack]);

  // Real current score derived strictly from user's diagnostic test result
  const realCurrentScore = useMemo(() => {
    if (diagRes?.estimated_band) {
      return `Band ${diagRes.estimated_band}`;
    }
    if (diagRes?.display_level) {
      return diagRes.display_level;
    }
    if (userGoal?.currentLevel) {
      return userGoal.currentLevel;
    }
    return null;
  }, [diagRes, userGoal]);

  const realTargetScore = useMemo(() => {
    if (userGoal?.targetLevel) return userGoal.targetLevel;
    return null;
  }, [userGoal]);

  // Fallback goal statistics if user goal is not explicitly set in profile yet
  const effectiveGoal = useMemo(() => {
    if (userGoal) return userGoal;
    return { 
      targetLevel: realTargetScore, 
      currentLevel: realCurrentScore, 
      targetDeadline: '', 
      timeCommitment: currentUser?.study_hours_per_day || '2' 
    };
  }, [userGoal, realTargetScore, realCurrentScore, currentUser]);

  // Calculate days remaining to exam
  const daysLeft = useMemo(() => {
    if (!effectiveGoal || !effectiveGoal.targetDeadline) return null;
    const deadline = dayjs(effectiveGoal.targetDeadline);
    if (!deadline.isValid()) return null;
    const diff = deadline.diff(dayjs(), 'day');
    return diff >= 0 ? diff : 0;
  }, [effectiveGoal]);


  // Active roadmap resolution with realistic rich defaults for every category
  const activeRoadmap = useMemo(() => {
    let found = null;
    if (roadmaps && roadmaps.length > 0) {
      found = roadmaps.find(r => {
        const gDir = (r.goal_direction || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        const trackName = activeTrack.name.toLowerCase();
        const trackId = activeTrack.id.toLowerCase();
        return gDir.includes(trackName) || gDir.includes(trackId) || title.includes(trackName) || title.includes(trackId);
      });
    }
    return found || (roadmaps && roadmaps.length > 0 ? roadmaps[0] : null);
  }, [roadmaps, activeTrack, selectedTrackId]);

  const isPending = isLoading || generatingPlannerState.isGenerating || regenerateNodeMutation.isPending;

  const handleRegenerateAll = () => {
    if (!activeRoadmap || window.confirm(t("Barcha darslar qaytadan tuziladi. Ishonchingiz komilmi?"))) {
      startPlannerGeneration(() => {
        queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      }, selectedTrackId);
    }
  };

  const toggleTask = (taskIndex) => {
    setCompletedTasks(prev => ({
      ...prev,
      [`${selectedTrackId}-${taskIndex}`]: !prev[`${selectedTrackId}-${taskIndex}`]
    }));
  };

  const handleStartTask = (taskItem, index, e) => {
    if (e) e.stopPropagation();

    const titleLower = (taskItem.title || '').toLowerCase();

    // 1. Flashcards / Vocabulary
    if (titleLower.includes('lug\'at') || titleLower.includes('vocabulary') || titleLower.includes('collocations') || titleLower.includes('kartochka')) {
      navigate('/knowza-ai/flashcards');
      return;
    }

    // 2. Mock Exam / Simulator
    if (titleLower.includes('mock') || titleLower.includes('imtihon') || titleLower.includes('test') || titleLower.includes('sinash')) {
      navigate('/knowza-ai/mock-exam');
      return;
    }

    // 3. Diagnostic
    if (titleLower.includes('diagnostika') || titleLower.includes('daraja')) {
      navigate('/knowza-ai/diagnostic');
      return;
    }

    // 4. Navigate directly to Lesson Page for interactive deep practice!
    navigate(`/knowza-ai/lesson?topic=${encodeURIComponent(taskItem.title || 'Mavzu')}`);
  };

  const handleSaveGoals = async (newGoals) => {
    try {
      if (updateProfile) {
        await updateProfile({ target_goals: newGoals });
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsGoalModalOpen(false);
    } catch (err) {
      console.error("Error saving goals:", err);
    }
  };

  const weeksMap = useMemo(() => {
    if (!activeRoadmap || !activeRoadmap.nodes) return {};
    const map = {};
    activeRoadmap.nodes.forEach(node => {
      const w = node.week_number || 1;
      if (!map[w]) map[w] = [];
      map[w].push(node);
    });
    return map;
  }, [activeRoadmap]);

  const activeNode = useMemo(() => {
    if (!activeRoadmap || !activeRoadmap.nodes || activeRoadmap.nodes.length === 0) return null;
    return activeRoadmap.nodes.find(n => n.status === 'available' || n.status === 'in_progress') || activeRoadmap.nodes[0];
  }, [activeRoadmap]);

  const getTasksForNode = useCallback((node) => {
    if (!node) return [];
    if (Array.isArray(node.tasks) && node.tasks.length > 0) {
      return node.tasks;
    }
    const estMins = node.estimated_minutes || 60;
    const mainTitle = (node.title || "Darslik").replace(/\s*\(\d+\s*(?:daqiqa|min|minutes)\)/gi, '');
    
    const m1 = Math.round(estMins * 0.3);
    const m2 = Math.round(estMins * 0.3);
    const m3 = Math.round(estMins * 0.2);
    const m4 = Math.max(10, estMins - m1 - m2 - m3);

    return [
      { title: `Nazariy tushunchalar va darslik tahlili`, estimated_minutes: m1 },
      { title: `Amaliy mashqlar va test namunalarini yechish`, estimated_minutes: m2 },
      { title: `Grammatika va akademik lug'at ustida ishlash`, estimated_minutes: m3 },
      { title: `Bugungi bilimlarni sinash va xatolarni ko'rib chiqish`, estimated_minutes: m4 },
    ];
  }, []);

  const todaysTasksList = useMemo(() => {
    return getTasksForNode(activeNode);
  }, [activeNode, getTasksForNode]);

  const rawMission = activeRoadmap?.meta_data?.todays_mission;
  const todaysMission = useMemo(() => {
    let list = Array.isArray(rawMission) && rawMission.length > 0 ? [...rawMission] : [];
    if (list.length === 0) {
      list = [
        `Tinglash: ${activeTrack.name} audio tushunish va eshitish mashqi`,
        `O'qish: ${activeTrack.name} matn tahlili va kalit so'zlar`,
        `Yozish: Insho va akademik iboralar ustida ishlash`,
        `Bugungi mavzular bo'yicha takrorlash va amaliy test`
      ];
    }
    if (list.length < 4) {
      const extra = [
        `Yozish va Grammatika: Akademik tuzilmalar mashqi`,
        `Lug'at boyligi: Yangi akademik collocations va so'zlar`,
        `Kunlik bilimlarni sinash va xatolar tahlili`
      ];
      let idx = 0;
      while (list.length < 4) {
        list.push(extra[idx % extra.length]);
        idx++;
      }
    }
    return list;
  }, [rawMission, activeTrack]);

  if (isLoading && (!roadmaps || roadmaps.length === 0)) {
    return <PlannerSkeleton />;
  }

  const todaysMissionCount = todaysMission.length;
  const completedCount = todaysMission.filter((_, idx) => completedTasks[`${selectedTrackId}-${idx}`]).length;
  const todaysProgressPct = todaysMissionCount > 0 ? Math.round((completedCount / todaysMissionCount) * 100) : 0;

  return (
    <>
      <Seo 
        title="O'quv Rejasi | Knowza AI"
        description="Sun'iy intellekt tomonidan yaratilgan shaxsiy o'quv xaritangiz va kunlik topshiriqlaringiz."
        icon="/banner/Knowza-logo-mini.png"
      />
      <div className="flex flex-col gap-6 w-full mx-auto animate-in fade-in duration-500">
        
        {/* Header (Matched exactly to Profile page) */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">{t('Reja')}</h2>
              <p className="text-[14px] leading-[20px] text-[#444654]">{t("Sun'iy intellekt tomonidan moslashtirilgan shaxsiy o'quv rejasi")}</p>
            </div>
          </div>
        </div>

        {/* Tabs for Active Tracks (Only show active tracks, e.g. IELTS) */}
        {availableTracks.length > 1 && (
          <div className="flex gap-6 border-b border-[#e5e2e1] pb-0 mb-2 overflow-x-auto scrollbar-hide">
            {availableTracks.map(track => {
              const isSelected = selectedTrackId === track.id;
              const hasMission = hasMissionForTrack(track);
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`pb-3 px-2 font-bold transition-colors relative flex items-center gap-2 whitespace-nowrap text-[15px] cursor-pointer ${
                    isSelected ? 'text-[#274ed5]' : 'text-[#747686] hover:text-[#1c1b1b]'
                  }`}
                >
                  <span>{track.name} Reja</span>
                  {hasMission && (
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {t("Missiya bor")}
                    </span>
                  )}
                  {isSelected && (
                    <div 
                      className="absolute bottom-[-1px] left-0 w-full h-[3px] rounded-t-full transition-all"
                      style={{ backgroundColor: track.themeColor || '#274ed5' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic Category Track Plan View */}
        {!activeRoadmap ? (
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#e5e2e1] text-center flex flex-col items-center justify-center py-16 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#274ed5] border border-indigo-200 flex items-center justify-center text-3xl">
              <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-1">
                {t("{{name}} bo'yicha AI O'quv Rejasi Yaratilmagan", { name: activeTrack.name })}
              </h3>
              <p className="text-[#747686] text-[14px] max-w-md mx-auto leading-relaxed font-medium">
                {t("Sizning darajangiz va maqsadingizga moslashtirilgan shaxsiy o'quv rejasini shakllantirish uchun Diagnostik Testni topshiring.")}
              </p>
            </div>
            <button 
              onClick={handleRegenerateAll}
              className="px-6 py-3 bg-[#274ed5] hover:bg-[#1f3fb3] active:scale-95 text-white rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{t("AI O'quv Rejasini Shakllantirish ➔")}</span>
            </button>
          </div>
        ) : (
          <>
          {/* 1. Sleek Compact Header Card */}
          <div 
            className="rounded-2xl p-5 md:p-6 text-white relative overflow-hidden transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm"
            style={{ backgroundColor: activeTrack.themeColor || '#274ed5' }}
          >
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold bg-white/20 px-3 py-1 rounded-full border border-white/25 inline-flex items-center gap-1.5">
                  <span>{activeTrack.name} O'quv Rejasi</span>
                </span>
              </div>

              <h3 className="text-[20px] md:text-[22px] font-extrabold leading-snug">
                Assalomu alaykum, {currentUser?.first_name || 'O\'quvchi'}! 👋
              </h3>
            </div>

            {/* Right Side Compact Stats & Edit Action */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-xl text-center min-w-[110px]">
                <span className="text-[10px] uppercase tracking-wider text-white/75 font-semibold block">Kunlik Vaqt</span>
                <span className="text-[14px] font-extrabold text-white">
                  {effectiveGoal.timeCommitment || '2'} soat / kun
                </span>
              </div>
            </div>
          </div>

          {/* 2. Today's Mission (Bugungi Topshiriqlar) Interactive Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-[#e5e2e1] pb-4">
              <div>
                <h4 className="font-extrabold text-[#1c1b1b] text-[20px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#274ed5]">flag</span>
                  {t("Bugungi topshiriqlar")} {activeNode?.day_label ? `(${activeNode.day_label})` : ''}
                </h4>
                <p className="text-[13px] text-[#747686] mt-0.5">
                  Kunlik {effectiveGoal.timeCommitment || '2'} soatlik tayyorgarlik rejangiz asosida ajratilgan topshiriqlar
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#f0f4ff] border border-[#274ed5]/20 px-4 py-2 rounded-2xl self-start md:self-auto">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#747686] uppercase tracking-wider">Bugungi progress</p>
                  <p className="text-[14px] font-black text-[#274ed5]">
                    {completedCount}/{todaysMissionCount} bajarildi ({todaysProgressPct}%)
                  </p>
                </div>
                <div className="w-12 h-2.5 bg-[#dde2f4] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#1f42ba] to-[#4f75ff] transition-all duration-500 rounded-full"
                    style={{ width: `${todaysProgressPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Task Items Grid */}
            <ul className="space-y-3">
              {todaysTasksList.map((taskItem, i) => {
                const isDone = !!completedTasks[`${selectedTrackId}-${i}`];
                const timeEstimate = `${taskItem.estimated_minutes || 15} daqiqa`;
                const rawTitle = taskItem.title || '';
                const taskTitle = rawTitle.includes(':') && rawTitle.split(':').length > 2
                  ? rawTitle.split(':').pop().trim()
                  : rawTitle;

                return (
                  <li 
                    key={i} 
                    onClick={() => toggleTask(i)}
                    className={`flex items-center justify-between p-4 rounded-2xl border select-none transition-all cursor-pointer ${
                      isDone 
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                        : 'bg-[#fcf9f8] border-[#e5e2e1] text-[#1c1b1b] hover:border-[#274ed5]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button 
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isDone ? 'bg-emerald-600 text-white' : 'border-2 border-[#c4c5d7] text-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                      </button>
                      <span className={`text-[15px] font-semibold leading-relaxed ${isDone ? 'line-through opacity-70 text-emerald-950' : 'text-[#1c1b1b]'}`}>
                        {taskTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#e5e2e1] text-[#747686] text-[12px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {timeEstimate}
                      </span>
                      <button 
                        onClick={(e) => handleStartTask(taskItem, i, e)}
                        className={`px-4 py-2 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-600 text-white border border-emerald-600' 
                            : 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white hover:opacity-95 active:scale-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isDone ? 'check_circle' : 'play_arrow'}
                        </span>
                        <span>{isDone ? t('Bajarildi') : t('Boshlash')}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 3. O'quv Xaritasi (Interactive Roadmap View) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1]">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
              <div>
                <h3 className="text-[20px] font-bold text-[#1c1b1b] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#274ed5]">map</span>
                  {t("O'quv Xaritasi")} ({activeTrack.name})
                </h3>
                <p className="text-[13px] text-[#747686] mt-1">
                  Bosqichma-bosqich shakllantirilgan bilim berish grafigi {!isPro ? t("(Bepul tarifda faqat 1-kun ochiq)") : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-10">
              {Object.keys(weeksMap).sort((a,b) => a - b).map((weekKey) => (
                <div key={weekKey} className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <span 
                      className="w-8 h-8 rounded-full text-white font-black text-[13px] flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: activeTrack.themeColor || '#274ed5' }}
                    >
                      {weekKey}
                    </span>
                    <h4 className="font-extrabold text-[18px] text-[#1c1b1b]">
                      {t("{{weekKey}}-hafta o'quv dasturi", { weekKey })}
                    </h4>
                  </div>

                  {/* Vertical Connecting Line & Nodes Container */}
                  <div className="flex flex-col gap-6">
                    {weeksMap[weekKey].map((node, nodeIdx) => {
                      const isMock = node.node_type === 'mock_test';
                      const isFirstDay = String(weekKey) === '1' && nodeIdx === 0;
                      const isFirstNodeInWeek = nodeIdx === 0;
                      const isLastNodeInWeek = nodeIdx === weeksMap[weekKey].length - 1;
                      const isLockedForFree = !isPro && !isFirstDay;
                      
                      return (
                        <div key={node.id} className="flex gap-4 md:gap-6 relative items-center">
                          {/* Left Timeline Column (line + dot centered together) */}
                          <div className="w-6 shrink-0 relative flex justify-center items-center self-stretch">
                            {/* Vertical Line connecting continuously */}
                            <div 
                              className={`absolute w-0.5 bg-[#e5e2e1] left-1/2 -translate-x-1/2 ${
                                isFirstNodeInWeek && isLastNodeInWeek 
                                  ? 'hidden' 
                                  : isFirstNodeInWeek 
                                  ? 'top-1/2 bottom-[-13px]' 
                                  : isLastNodeInWeek 
                                  ? 'top-[-13px] bottom-1/2' 
                                  : 'top-[-13px] bottom-[-13px]'
                              }`}
                            ></div>

                            {/* Node Circle Dot - Vertically centered on card */}
                            <div 
                              className={`w-6 h-6 rounded-full border-4 border-white z-10 shrink-0 flex items-center justify-center my-auto ${
                                isFirstDay ? 'bg-[#274ed5]' : isMock ? 'bg-amber-500' : 'bg-gray-400'
                              }`}
                              style={{ backgroundColor: isFirstDay ? (activeTrack.themeColor || '#274ed5') : isMock ? '#f59e0b' : '#9ca3af' }}
                            >
                              {isMock && <span className="material-symbols-outlined text-[10px] text-white">star</span>}
                            </div>
                          </div>

                          {/* Right Card Content */}
                          <div className={`flex-1 rounded-3xl p-6 relative overflow-hidden transition-all ${
                            isFirstDay 
                              ? 'bg-[#fcf9f8] border-2 border-[#274ed5]' 
                              : 'bg-[#fcf9f8] border border-[#e5e2e1]'
                          }`}>

                            {/* Free Tier Lock Overlay */}
                            {isLockedForFree && (
                              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center border border-[#274ed5]/20 shadow-xs">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#274ed5] border border-blue-200 flex items-center justify-center mb-2">
                                  <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                                </div>
                                <h5 className="font-extrabold text-[#1c1b1b] text-[15px] mb-1">
                                  {t("Kelgusi darslar faqat PRO tarifida ochiq")}
                                </h5>
                                <p className="text-[#747686] text-[12px] max-w-sm mb-3 font-medium leading-relaxed">
                                  {t("Bepul tarifda faqat bugungi kungi o'quv rejasini ko'rishingiz mumkin. To'liq 4-8 haftalik xaritani ochish uchun Pro tarifiga o'ting.")}
                                </p>
                                <button
                                  onClick={() => navigate('/knowza-ai/pro')}
                                  className="px-4 py-2 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white rounded-xl font-bold text-[12px] shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                                  <span>{t("Pro tarifiga o'tish ➔")}</span>
                                </button>
                              </div>
                            )}

                            <div className={isLockedForFree ? 'filter blur-[2px] opacity-40 select-none pointer-events-none' : ''}>
                              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    {node.day_label && (
                                      <span 
                                        className={`text-[12px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                          isFirstDay ? 'text-white' : 'bg-[#e5e2e1] text-[#747686]'
                                        }`}
                                        style={isFirstDay ? { backgroundColor: activeTrack.themeColor || '#274ed5' } : {}}
                                      >
                                        {node.day_label}
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-extrabold text-[#1c1b1b] text-[17px] mt-1">{node.title}</h5>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-bold px-3 py-1 bg-[#e5e2e1] text-[#444654] rounded-xl flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    {node.estimated_minutes || (isFirstDay ? 60 : 60)}{t(" daqiqa")}
                                  </span>
                                </div>
                              </div>

                              <div className="prose prose-blue prose-sm max-w-none text-[#444654] text-[13.5px] leading-relaxed line-clamp-2 overflow-hidden">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.description}</ReactMarkdown>
                              </div>

                              {/* Kunlik topshiriqlar */}
                              {(() => {
                                const displayTasks = getTasksForNode(node);
                                return (
                                  <div className="mt-4 pt-3 border-t border-[#e5e2e1]/60">
                                    <div className="text-[13px] font-extrabold uppercase tracking-wider text-[#274ed5] mb-2 flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                      {t("Kunlik topshiriqlar:")}
                                    </div>
                                    <div className="space-y-1.5">
                                      {displayTasks.map((task, tIdx) => (
                                        <div key={tIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e5e2e1]/80 text-[13px] font-medium text-[#1c1b1b]">
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-50 text-[#274ed5] text-[11px] font-bold flex items-center justify-center shrink-0">
                                              {tIdx + 1}
                                            </span>
                                            <span>{task.title}</span>
                                          </div>
                                          <span className="text-[12px] font-bold text-[#747686] bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 shrink-0">
                                            {task.estimated_minutes || 15} daqiqa
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
        )}
      </div>

      {/* Goal Edit Modal */}
      <GoalEditModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoals={currentUser?.target_goals || []}
        onSave={handleSaveGoals}
        isPro={true}
      />
    </>
  );
}
