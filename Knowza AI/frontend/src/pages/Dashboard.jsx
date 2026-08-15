import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../data/apiService';
import { toast } from 'sonner';
import Seo from '../../components/Seo';
import { DashboardSkeleton } from '../../components/Skeletons';
import { useTranslation } from 'react-i18next';

const KnowzaAIDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [dashStats, queueData] = await Promise.all([
        apiService.getAIDashboardStats(),
        apiService.getAIQueue()
      ]);
      return { dashStats, queueData };
    },
    refetchInterval: 15000 // Live refresh every 15s
  });

  // Query Planner roadmaps to get today's active tasks (100% matched with Planner.jsx)
  const { data: roadmapsData } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: async () => {
      const res = await apiService.getRoadmap();
      if (res?.success && res?.data) return Array.isArray(res.data) ? res.data : [res.data];
      const resAll = await apiService.getRoadmaps();
      if (resAll?.data) return Array.isArray(resAll.data) ? resAll.data : [resAll.data];
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: 15000
  });

  const roadmaps = Array.isArray(roadmapsData) ? roadmapsData : (roadmapsData?.data || []);
  const activeRoadmap = roadmaps.length > 0 ? (roadmaps.find(r => r.is_active) || roadmaps[0]) : null;
  const activeNode = activeRoadmap?.nodes?.find(n => n.status === 'available' || n.status === 'in_progress' || !n.is_completed) || activeRoadmap?.nodes?.[0];

  const getTasksForNode = (node) => {
    if (!node) return [];
    if (Array.isArray(node.tasks) && node.tasks.length > 0) {
      return node.tasks;
    }
    const estMins = node.estimated_minutes || 60;
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
  };

  const nodeTasks = getTasksForNode(activeNode);
  const rawTasks = nodeTasks.length > 0 ? nodeTasks : (data?.queueData?.data || []);

  const completeMissionMutation = useMutation({
    mutationFn: async (mission) => {
      if (activeNode?.id && activeNode?.tasks) {
        const updatedTasks = activeNode.tasks.map(t => 
          (t.id === mission.id || t.title === mission.title) ? { ...t, is_completed: true, completed: true } : t
        );
        await apiService.updateNodeProgress(activeNode.id, updatedTasks);
      } else if (mission.id) {
        await apiService.completeQueueItem(mission.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      toast.success(t('Vazifa yakunlandi!'));
    },
    onError: () => {
      toast.error(t('Xatolik yuz berdi'));
    }
  });

  // Background AI Diagnostic Result & Weakness Analysis Query
  const { data: userDiagResult } = useQuery({
    queryKey: ['userDiagResultDashboard'],
    queryFn: async () => {
      try {
        const res = await apiService.getDiagnosticResult('ielts');
        if (res?.data) return res.data;
        const resSat = await apiService.getDiagnosticResult('sat');
        if (resSat?.data) return resSat.data;
      } catch (e) {}
      return null;
    }
  });

  const weakSkillsList = useMemo(() => {
    const list = [];
    if (userDiagResult?.skill_breakdown) {
      Object.entries(userDiagResult.skill_breakdown).forEach(([skill, val]) => {
        list.push({
          skill: skill.toUpperCase(),
          score: val,
          issue: `Diagnostik testda ${skill} bo'limida natijangiz ${val}% deb baholandi.`,
          recommendation: `Ushbu bo'lim bo'yicha maxsus mashqlarni va darsliklarni tahlil qilish zarur.`
        });
      });
    }
    if (userDiagResult?.detailed_feedback?.weaknesses) {
      userDiagResult.detailed_feedback.weaknesses.forEach(w => {
        const name = typeof w === 'string' ? w : w.name || 'Zaif nuqta';
        if (!list.some(l => l.skill === name)) {
          list.push({
            skill: name,
            score: 50,
            issue: typeof w === 'string' ? w : w.description || 'Test jarayonida aniqlangan bilim bo\'shlig\'i',
            recommendation: 'Ushbu mavzuda amaliy ko\'nikmalarni oshirish tavsiya etiladi.'
          });
        }
      });
    }
    if (list.length === 0) {
      list.push(
        { skill: "Reading (Matching Headings)", score: 55, issue: "Sarlavhalarni moslashtirishda vaqt yetishmovchiligi va paragraf g'oyasini ajrata olmaslik.", recommendation: "Paragraf tahlili va kalit so'zlarni skanerlash ustida ishlash zarur." },
        { skill: "Grammar & Academic Vocabulary", score: 68, issue: "Akademik collocations va bog'lovchilar qo'llanishida xatolar.", recommendation: "Lug'at kartochkalaridan (Flashcards) doimiy foydalanish." },
        { skill: "Writing Task 2 Essay Structure", score: 60, issue: "Insho strukturasini rejalashtirish va dalillarni asoslash.", recommendation: "Insho shablonlari va argumentlar tahlili ustida ishlash." }
      );
    }
    return list.filter(item => {
      const sLower = (item.skill || '').toLowerCase();
      return !sLower.includes('listening') && !sLower.includes('tinglash');
    });
  }, [userDiagResult]);

  if (isLoading) return <DashboardSkeleton />;

  const stats = {
    streak: data?.dashStats?.streak?.current_streak || 0,
    subject: data?.dashStats?.profile?.subject || t('Umumiy'),
    gaps: data?.dashStats?.skill_gaps?.length || 0,
    targetScore: data?.dashStats?.profile?.target_score || t("Noma'lum")
  };

  const missions = rawTasks
    .map((m, idx) => ({
      id: m.id || m._id || idx,
      title: m.title || m.task_name || m.name || 'Topshiriq',
      subject: activeRoadmap?.goal_direction || activeRoadmap?.exam_type || activeRoadmap?.title || 'IELTS',
      done: Boolean(m.is_completed || m.completed),
      type: m.task_type || m.type || 'lesson',
      topic: m.topic || m.title || m.task_name
    }))
    .filter(m => {
      const tLower = (m.title || '').toLowerCase();
      return !tLower.includes('listening') && !tLower.includes('tinglash');
    });

  const filters = [
    { key: 'today', label: t('Bugungi vazifa') },
    { key: 'weak', label: t("Zaif ko'nikmalar") },
    { key: 'all', label: t('Barchasi') },
  ];

  const handleMissionClick = (mission) => {
    if (mission.type === 'test') {
      navigate(`/knowza-ai/test?topic=${encodeURIComponent(mission.topic)}`);
    } else {
      navigate(`/knowza-ai/lesson?topic=${encodeURIComponent(mission.topic)}`);
    }
  };

  const completedCount = missions.filter(m => m.done).length;
  const progressPercent = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/knowza-ai/research?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };


  return (
    <>
      <Seo 
        title={t("Boshqaruv paneli | Knowza AI")}
        description={t("Knowza AI dashboardida o'zlashtirish statistikasini, maqsadlarni va shaxsiy AI tavsiyalarini kuzating.")}
        icon="/banner/Knowza-logo-mini.png"
      />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full min-w-0">
        <div className="flex flex-col gap-1 sm:gap-2 mb-1 sm:mb-2 min-w-0">
          <h2 className="text-[22px] sm:text-[28px] leading-[30px] sm:leading-[36px] font-bold text-[#1c1b1b]">{t("Boshqaruv paneli")}</h2>
          <p className="text-[13px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#444654]">
            {t("Salom")}, {currentUser?.first_name || currentUser?.username || t('Talaba')}! {t("Kunlik o'quv missiyalar va natijalar.")}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          <form onSubmit={handleSearch} className="relative flex-1 md:w-auto sm:min-w-[240px] min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[#747686] text-[20px]">search</span>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#e5e2e1] border-none rounded-2xl focus:ring-2 focus:ring-[#274ed5] outline-none text-[#1c1b1b] text-[14px] placeholder:text-[#747686]" 
              placeholder={t("Mavzu yozing...")} 
            />
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto hide-scrollbar w-full max-w-full pb-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-[13px] sm:text-[14px] leading-[20px] transition-all active:scale-95 shrink-0 ${
              activeFilter === f.key
                ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white border border-white/20 shadow-none'
                : 'bg-[#fcf9f8] border border-[#c4c5d7] text-[#444654] hover:bg-gradient-to-tr hover:from-[#1f42ba] hover:via-[#274ed5] hover:to-[#4f75ff] hover:text-white hover:border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0 max-w-full">
        
        {/* Left Column (Missions) */}
        <div className="lg:col-span-2 bg-white rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 md:p-8 border border-[#e5e2e1] flex flex-col relative overflow-hidden shadow-none min-w-0">
          <div className="flex justify-between items-start mb-5 sm:mb-6 min-w-0 gap-3">
            <div className="min-w-0">
              <h3 className="text-[20px] sm:text-[24px] leading-[28px] sm:leading-[32px] font-bold text-[#1c1b1b]">
                {activeFilter === 'weak' ? t("Zaif ko'nikmalar & AI Tahlil") : t("Bugungi missiya")}
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#444654] mt-0.5 sm:mt-1">
                {activeFilter === 'weak' 
                  ? t("Diagnostika va testlar asosida orqa fonda AI aniqlagan kamchiliklar") 
                  : `${completedCount}/${missions.length} ${t("bajarildi")}`}
              </p>
            </div>
            <button 
              onClick={() => navigate('/knowza-ai/analytics')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white rounded-2xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-none border border-white/20 shrink-0"
              title={t("Tahlillar")}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">center_focus_strong</span>
            </button>
          </div>

          {activeFilter === 'weak' ? (
            <div className="flex flex-col gap-4 min-w-0">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 mb-1">
                <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">auto_awesome</span>
                <div className="text-xs leading-relaxed font-medium">
                  <strong className="font-bold text-amber-950 block mb-0.5">AI Fondagi Tahlil & Diagnostika:</strong>
                  Sizning diagnostika va amaliy testlaringiz orqa fonda AI tomonidan doimiy tahlil qilinib bormoqda. Testdan so'ng aniqlangan asosiy bilim bo'shliqlaringiz va rivojlantirish kerak bo'lgan bo'limlar:
                </div>
              </div>

              {weakSkillsList.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/knowza-ai/lesson?topic=${encodeURIComponent(item.skill)}`)}
                  className="p-4 rounded-2xl border border-[#e5e2e1] hover:border-[#274ed5] bg-[#fcf9f8] hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-extrabold text-[11px]">
                        {item.score}% o'zlashtirish
                      </span>
                      <h4 className="font-extrabold text-[#1c1b1b] text-sm group-hover:text-[#274ed5] transition-colors">{item.skill}</h4>
                    </div>
                    <p className="text-xs text-[#444654] font-medium leading-relaxed">{item.issue}</p>
                    <p className="text-[11px] text-[#274ed5] font-bold">💡 AI Tavsiyasi: {item.recommendation}</p>
                  </div>
                  <button className="px-4 py-2 bg-[#274ed5] text-white rounded-xl text-xs font-bold self-start md:self-auto hover:bg-[#1f42ba] transition-colors shrink-0 shadow-xs">
                    Mashq qilish ➔
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
              {missions.map(m => (
                <div key={m.id} onClick={() => handleMissionClick(m)} className="flex items-center justify-between p-3.5 sm:p-4 rounded-[22px] border border-[#e5e2e1] hover:border-[#274ed5] hover:bg-[#fcf9f8] transition-all cursor-pointer group gap-3 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <button onClick={(e) => { e.stopPropagation(); if (!m.done) completeMissionMutation.mutate(m); }} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center transition-all shrink-0 ${m.done ? 'bg-[#4ae176] text-white' : 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white hover:opacity-90 active:scale-95 border border-white/20'}`}>
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                        {m.done ? 'check' : 'play_arrow'}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-[14px] sm:text-[16px] font-bold transition-colors truncate ${m.done ? 'text-[#747686] line-through' : 'text-[#1c1b1b] group-hover:text-[#274ed5]'}`}>{m.title}</h4>
                      <p className="text-[11px] sm:text-[12px] text-[#444654] mt-0.5 truncate">{m.subject}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#c4c5d7] group-hover:text-[#274ed5] transition-colors shrink-0">chevron_right</span>
                </div>
              ))}
            </div>
          )}

          {completedCount === missions.length && missions.length > 0 && (
            <div className="mt-5 sm:mt-6 p-4 bg-[#e8f5e9] rounded-[24px] text-center border border-[#4ae176]/30">
              <span className="material-symbols-outlined text-[#2e7d32] text-[28px] sm:text-[32px]">celebration</span>
              <p className="font-bold text-[#2e7d32] mt-1.5 sm:mt-2 text-[14px] sm:text-[16px]">{t("Barcha vazifalar bajarildi! 🎉")}</p>
            </div>
          )}
        </div>

        {/* Right Column (Widgets) */}
        <div className="flex flex-col gap-5 sm:gap-6 min-w-0">
          
          {/* Roadmap Progress */}
          <div className="bg-white rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 md:p-8 border border-[#e5e2e1] shadow-none min-w-0">
            <h3 className="text-[18px] sm:text-[20px] leading-[26px] sm:leading-[28px] font-bold text-[#1c1b1b] mb-3 sm:mb-4">{t("Roadmap progressi")}</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[13px] sm:text-[14px] text-[#444654] font-medium">{t("Joriy modul")}</span>
              <span className="text-[20px] sm:text-[24px] font-bold text-[#274ed5] leading-none">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-[#e5e2e1] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-[#1f42ba] via-[#274ed5] to-[#4f75ff] rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[12px] text-[#444654] leading-[18px]">
              {missions.length - completedCount > 0 
                ? t("Keyingi bosqichga o'tish uchun {{count}} ta vazifa qoldi.", { count: missions.length - completedCount })
                : t("Siz yangi bosqichga o'tishga tayyorsiz!")
              }
            </p>
          </div>

          {/* Help Widget */}
          <div className="bg-[#e8edff] rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 md:p-8 border border-[#c4d4ff] relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[200px] shadow-none min-w-0">
            <div className="relative z-10">
              <h3 className="text-[18px] sm:text-[20px] leading-[26px] sm:leading-[28px] font-bold text-[#274ed5] mb-1.5 sm:mb-2">{t("Yordam kerakmi?")}</h3>
              <p className="text-[13px] sm:text-[14px] text-[#274ed5] font-semibold opacity-90 max-w-[170px] mb-5 sm:mb-6">
                {t("AI yordamchi bilan suhbatlashing")}
              </p>
              <button 
                onClick={() => navigate('/knowza-ai/tutor')}
                className="bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-[13px] sm:text-[14px] flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-none"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                {t("Boshlash")}
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#c8d4ff] rounded-full opacity-50 z-0"></div>
            <div className="absolute bottom-6 right-6 w-12 h-12 bg-[#274ed5]/10 rounded-full z-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#274ed5] text-[32px] opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default KnowzaAIDashboard;
