import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResearch } from '../../context/ResearchContext';
import { usePlannerContext } from '../../context/PlannerContext';
import Seo from '../../components/Seo';
import { useTranslation } from 'react-i18next';
import ExamTrackModal from '../../components/KnowzaAI/ExamTrackModal';
import { useFlashCards } from '../../context/FlashCardsContext';

const KnowzaAILayout = ({ children }) => {
  const { logout, currentUser } = useAuth();
  const { generatingState, completedState, setCompletedState } = useResearch();
  const { generatingPlannerState, completedPlannerState, setCompletedPlannerState } = usePlannerContext();
  const { generatingFlashState, completedFlashState, setCompletedFlashState } = useFlashCards();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [langDropdownVisible, setLangDropdownVisible] = React.useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = React.useState(false);

  const isDiagnosticPage = location.pathname.startsWith('/knowza-ai/diagnostic') || location.pathname.startsWith('/knowza-ai/test');

  React.useEffect(() => {
    const hasCompletedDiagnostic = 
      sessionStorage.getItem('knowza_diagnostic_completed') === 'true' || 
      localStorage.getItem('knowza_diagnostic_completed') === 'true' || 
      currentUser?.has_completed_diagnostic;
    
    if (isDiagnosticPage) {
      if (hasCompletedDiagnostic) {
        // Tugallangan foydalanuvchi diagnostikaga qaytolmaydi
        navigate('/knowza-ai/dashboard', { replace: true });
        return;
      }
      setIsSidebarOpen(false);
      setIsExamModalOpen(false);
      return;
    }

    if (!hasCompletedDiagnostic) {
      // Force user to diagnostic test page if they haven't completed it yet
      navigate('/knowza-ai/diagnostic', { replace: true });
    } else {
      setIsExamModalOpen(false);
    }
  }, [currentUser, location.pathname, isDiagnosticPage, navigate]);
  const langDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const langDetails = {
    UZ: { flagUrl: 'https://flagcdn.com/uz.svg', name: "O'zbek" },
    RU: { flagUrl: 'https://flagcdn.com/ru.svg', name: 'Русский' },
    EN: { flagUrl: 'https://flagcdn.com/us.svg', name: 'English' }
  };

  const currentLangRaw = i18n.language || 'UZ';
  const currentLangCode = currentLangRaw.toLowerCase().startsWith('ru') ? 'RU' : currentLangRaw.toLowerCase().startsWith('en') ? 'EN' : 'UZ';
  const currentDetails = langDetails[currentLangCode];

  const langMenu = (
    <div className="absolute left-0 md:left-[calc(100%+12px)] bottom-full md:bottom-0 mb-2 md:mb-0 bg-white rounded-2xl shadow-lg border border-[#e5e2e1] p-2 w-[210px] flex flex-col gap-1.5 z-[10000] font-sans">
      {Object.entries(langDetails).map(([code, details]) => {
        const isSelected = currentLangCode === code;
        return (
          <button 
            key={code}
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              i18n.changeLanguage(code.toLowerCase()); 
              setLangDropdownVisible(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ease-out w-full active:scale-[0.97] border border-transparent ${
              isSelected 
                ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold' 
                : 'text-[#444654] hover:bg-[#e5e2e1] font-semibold'
            }`}
          >
            <img src={details.flagUrl} alt={details.name} className="w-[24px] h-[16px] object-cover rounded-[3px] shrink-0" />
            <span className="text-[14px] leading-none">{details.name}</span>
            {isSelected && <span className="material-symbols-outlined ml-auto text-[18px] text-white">check</span>}
          </button>
        );
      })}
    </div>
  );

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (location.pathname.startsWith('/knowza-ai/research') && completedState?.isVisible) {
      setCompletedState(null);
    }
    if (location.pathname.startsWith('/knowza-ai/planner') && completedPlannerState?.isVisible) {
      setCompletedPlannerState(null);
    }
  }, [location.pathname, completedState, setCompletedState, completedPlannerState, setCompletedPlannerState]);

  const handleLogout = async () => {
    try {
      await logout('/knowza-ai/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavItemClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    { id: 'dashboard', name: t('Bosh sahifa'), icon: 'home', path: '/knowza-ai/dashboard' },
    { id: 'tutor', name: t('AI Tutor'), icon: 'smart_toy', path: '/knowza-ai/tutor' },
    { id: 'research', name: t('Izlanish'), icon: 'auto_awesome', path: '/knowza-ai/research' },
    { id: 'reading', name: t('Reading'), icon: 'menu_book', path: '/knowza-ai/reading' },
    { id: 'writing', name: t('Writing'), icon: 'edit_document', path: '/knowza-ai/writing' },
    { id: 'flashcards', name: t('Lug\'at'), icon: 'style', path: '/knowza-ai/flashcards' },
    { id: 'planner', name: t('Reja'), icon: 'flag', path: '/knowza-ai/planner' },
    { id: 'profile', name: t('Profil'), icon: 'person', path: '/knowza-ai/profile' },
  ];

  return (
    <>
      <Seo
        title={t('Knowza AI — Knowza')}
        description={t("Knowza AI bilan individual o'quv yo'nalishini, testlar va tahlillarni boshqaring. Bilimlarni tezroq o'zlashtiring va o'quv maqsadlaringizga erishing.")}
        image="/banner/Knowza-logo-mini.png"
        icon="/banner/Knowza-logo-mini.png"
      />

      <ExamTrackModal 
        isOpen={isExamModalOpen} 
        isBlocking={true}
        onClose={null}
        onSuccess={() => setIsExamModalOpen(false)}
      />
      <div className="bg-[#F5F6FA] text-[#1c1b1b] font-['Plus_Jakarta_Sans',sans-serif] antialiased min-h-screen flex flex-col md:flex-row max-w-full relative">
      {!isDiagnosticPage && (
        <>
          {/* Mobile Top App Bar */}
          <header style={{position:'fixed',top:0,left:0,right:0,width:'100%',height:'56px',zIndex:1000}} className="md:hidden px-4 bg-[#fcf9f8] border-b border-[#c4c5d7]/20 shadow-xs flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-[#e5e2e1] text-[#444654] rounded-lg transition-colors flex items-center justify-center"
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="text-[20px] leading-[28px] font-black text-[#274ed5]">Knowza AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate('/knowza-ai/research')} className="p-2 text-[#444654] hover:text-[#274ed5] transition-colors rounded-full hover:bg-[#e5e2e1]" title={t("Izlanish")}>
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </button>
              <button onClick={() => navigate('/knowza-ai/tutor')} className="p-2 text-[#444654] hover:text-[#274ed5] transition-colors rounded-full hover:bg-[#e5e2e1]" title={t("AI Tutor")}>
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </button>
              <button onClick={() => navigate('/knowza-ai/profile')} className="w-8 h-8 rounded-full overflow-hidden bg-[#dde1ff] border border-[#c4c5d7] flex items-center justify-center ml-1 shrink-0">
                <span className="material-symbols-outlined text-[#274ed5] text-[20px]">person</span>
              </button>
            </div>
          </header>

          {/* Backdrop for mobile drawer */}
          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* SideNavBar */}
          <aside className={`fixed left-0 top-0 h-full flex flex-col px-5 py-6 z-50 md:z-40 border-r border-[#c4c5d7]/20 bg-[#f0eded] transition-all duration-300 ease-in-out ${
            isSidebarOpen 
              ? 'translate-x-0 w-[280px]' 
              : '-translate-x-full md:translate-x-0 w-[280px] md:w-[88px]'
          }`}>
        {/* Header */}
        <div className="flex items-center mb-8 relative h-12 w-full">
          <div className={`transition-all duration-300 ease-in-out ${
            isSidebarOpen 
              ? 'opacity-100 blur-0 translate-x-0' 
              : 'opacity-0 blur-sm -translate-x-2 pointer-events-none absolute left-0'
          }`}>
            <h1 className="text-[24px] leading-[32px] font-bold text-[#274ed5] leading-tight whitespace-nowrap">Knowza AI</h1>
            <p className="text-[12px] leading-[16px] font-medium text-[#444654] whitespace-nowrap">{t('Educator Portal')}</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute right-0 top-0 w-12 h-12 hover:bg-[#e5e2e1] text-[#444654] hover:text-[#274ed5] rounded-xl transition-all duration-200 active:scale-[0.97] flex items-center justify-center overflow-hidden"
          >
            <span className={`material-symbols-outlined absolute transition-all duration-300 ${
              isSidebarOpen ? 'opacity-100 scale-100 blur-0 rotate-0' : 'opacity-0 scale-75 blur-[2px] rotate-90 pointer-events-none'
            }`}>
              menu_open
            </span>
            <span className={`material-symbols-outlined absolute transition-all duration-300 ${
              !isSidebarOpen ? 'opacity-100 scale-100 blur-0 rotate-0' : 'opacity-0 scale-75 blur-[2px] -rotate-90 pointer-events-none'
            }`}>
              menu
            </span>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.id} className="h-12 flex items-center w-full relative">
                <NavLink
                  to={item.path}
                  onClick={handleNavItemClick}
                  className={`relative flex items-center rounded-2xl transition-all duration-200 ease-out group w-full h-12 active:scale-[0.97] border border-transparent ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold shadow-none'
                      : 'text-[#444654] hover:bg-[#e5e2e1]'
                  }`}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <span 
                      className={`material-symbols-outlined transition-colors duration-300 ease-in-out ${isActive ? 'text-white' : 'group-hover:text-[#274ed5]'}`} 
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className={`text-[14px] leading-[20px] whitespace-nowrap transition-colors duration-300 ease-in-out absolute left-12 ${
                    isSidebarOpen ? 'opacity-100 blur-0 translate-x-0' : 'opacity-0 blur-sm -translate-x-2 pointer-events-none'
                  } ${isActive ? 'font-bold text-white' : 'font-semibold'}`}>
                    {item.name}
                  </span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* Footer / Bottom Navigation */}
        <div className="mt-auto space-y-1.5 pt-4 border-t border-[#c4c5d7]/20">
          {/* Global Generation Progress Indicator */}
          {generatingState.isGenerating && (
            isSidebarOpen ? (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#274ed5] truncate pr-2" title={generatingState.topic}>
                    {generatingState.topic || t('Yangi izlanish...')}
                  </span>
                  <span className="w-3.5 h-3.5 border-2 border-[#274ed5] border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                </div>
                <p className="text-[10px] font-semibold text-[#274ed5]/80 truncate">
                  {generatingState.stepText || t('Yozilmoqda...')}
                </p>
              </div>
            ) : (
              <div className="mb-3 flex justify-center py-2 bg-blue-50 border border-blue-100 rounded-2xl animate-pulse" title={generatingState.topic || t('Yangi izlanish...')}>
                <span className="w-4 h-4 border-2 border-[#274ed5] border-t-transparent rounded-full animate-spin"></span>
              </div>
            )
          )}

          {completedState?.isVisible && !location.pathname.startsWith('/knowza-ai/research') && (
            isSidebarOpen ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl relative group cursor-pointer transition-colors hover:bg-green-100" onClick={() => { handleNavItemClick(); navigate('/knowza-ai/research'); }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCompletedState(null); }}
                  className="absolute top-2 right-2 text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                  <span className="text-sm font-bold text-green-700 truncate pr-4" title={completedState.topic}>
                    {completedState.topic || t('Izlanish yakunlandi')}
                  </span>
                </div>
                <p className="text-xs font-bold text-green-700 underline underline-offset-2">
                  {t('Mavzu yaratildi. Pagega kiring →')}
                </p>
              </div>
            ) : (
              <div className="mb-4 flex justify-center py-3 bg-green-50 border border-green-200 rounded-2xl cursor-pointer hover:bg-green-100" onClick={() => { handleNavItemClick(); navigate('/knowza-ai/research'); }} title={completedState.topic || t('Izlanish yakunlandi')}>
                <span className="material-symbols-outlined text-green-600 text-[20px]">task_alt</span>
              </div>
            )
          )}

          {generatingPlannerState.isGenerating && (
            isSidebarOpen ? (
              <div className="mb-3 p-2.5 bg-orange-50 border border-orange-100 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-orange-600 truncate pr-2">
                    {t("O'quv Rejasi")}
                  </span>
                  <span className="w-3.5 h-3.5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                </div>
                <p className="text-[10px] font-semibold text-orange-600/80 truncate">
                  {t('Shakllantirilmoqda...')}
                </p>
              </div>
            ) : (
              <div className="mb-3 flex justify-center py-2 bg-orange-50 border border-orange-100 rounded-2xl animate-pulse" title={t("O'quv Rejasi")}>
                <span className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            )
          )}

          {completedPlannerState?.isVisible && !location.pathname.startsWith('/knowza-ai/planner') && (
            isSidebarOpen ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl relative group cursor-pointer transition-colors hover:bg-green-100" onClick={() => { handleNavItemClick(); navigate('/knowza-ai/planner'); }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCompletedPlannerState(null); }}
                  className="absolute top-2 right-2 text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                  <span className="text-sm font-bold text-green-700 truncate pr-4">
                    {t('Reja tayyor!')}
                  </span>
                </div>
                <p className="text-xs font-bold text-green-700 underline underline-offset-2">
                  {t("O'quv rejasiga o'tish →")}
                </p>
              </div>
            ) : (
              <div className="mb-4 flex justify-center py-3 bg-green-50 border border-green-200 rounded-2xl cursor-pointer hover:bg-green-100" onClick={() => { handleNavItemClick(); navigate('/knowza-ai/planner'); }} title={t('Reja tayyor!')}>
                <span className="material-symbols-outlined text-green-600 text-[20px]">task_alt</span>
              </div>
            )
          )}

          {/* Flashcard deck generating indicator */}
          {generatingFlashState.isGenerating && (
            isSidebarOpen ? (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-emerald-700 truncate pr-2" title={generatingFlashState.topic}>
                    {generatingFlashState.topic || t("Lug'at yaratilyapti...")}
                  </span>
                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                </div>
                <p className="text-[10px] font-semibold text-emerald-600/80 truncate">
                  {generatingFlashState.stepText || t('Kartochkalar tayyorlanmoqda...')}
                </p>
              </div>
            ) : (
              <div className="mb-3 flex justify-center py-2 bg-emerald-50 border border-emerald-100 rounded-2xl animate-pulse" title={generatingFlashState.topic || t("Lug'at yaratilyapti...")}>
                <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            )
          )}

          {completedFlashState?.isVisible && !location.pathname.startsWith('/knowza-ai/flashcards') && (
            isSidebarOpen ? (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl relative group cursor-pointer transition-colors hover:bg-emerald-100" onClick={() => { handleNavItemClick(); navigate('/knowza-ai/flashcards'); }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCompletedFlashState(null); }}
                  className="absolute top-2 right-2 text-emerald-600 hover:text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  <span className="text-sm font-bold text-emerald-700 truncate pr-4" title={completedFlashState.topic}>
                    {completedFlashState.topic || t("Lug'at tayyor!")}
                  </span>
                </div>
                <p className="text-xs font-bold text-emerald-700 underline underline-offset-2">
                  {t("Lug'atga o'tish →")}
                </p>
              </div>
            ) : (
              <div className="mb-4 flex justify-center py-3 bg-emerald-50 border border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-100" onClick={() => { handleNavItemClick(); navigate('/knowza-ai/flashcards'); }} title={completedFlashState.topic || t("Lug'at tayyor!")}>
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">task_alt</span>
              </div>
            )
          )}

          <div className="h-12 flex items-center w-full relative mb-2">
            <button 
              onClick={() => { handleNavItemClick(); navigate('/knowza-ai/pro'); }}
              className="relative flex items-center justify-start rounded-3xl transition-all duration-200 ease-out group w-full h-12 active:scale-[0.97] border border-transparent bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold shadow-none"
              title={t("Pro tarifga o'ting")}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white">workspace_premium</span>
              </div>
              <span className={`text-[14px] leading-[20px] whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                isSidebarOpen ? 'opacity-100 blur-0 translate-x-0' : 'opacity-0 blur-sm -translate-x-2 pointer-events-none'
              } font-bold text-white`}>
                {t("Pro tarifga o'ting")}
              </span>
            </button>
          </div>

          <div className="h-12 flex items-center w-full relative">
            <button 
              onClick={() => { handleNavItemClick(); navigate('/knowza-ai/guide'); }} 
              className={`relative flex items-center justify-start rounded-3xl transition-all duration-200 ease-out group w-full h-12 active:scale-[0.97] border border-transparent ${location.pathname.startsWith('/knowza-ai/guide') ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold' : 'text-[#444654] hover:bg-[#e5e2e1]'}`}
              title={t("Qo'llanma")}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined transition-colors duration-300 ease-in-out ${location.pathname.startsWith('/knowza-ai/guide') ? 'text-white' : 'group-hover:text-[#274ed5]'}`}>menu_book</span>
              </div>
              <span className={`text-[14px] leading-[20px] whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                isSidebarOpen ? 'opacity-100 blur-0 translate-x-0' : 'opacity-0 blur-sm -translate-x-2 pointer-events-none'
              } ${location.pathname.startsWith('/knowza-ai/guide') ? 'font-bold text-white' : 'font-semibold'}`}>
                {t("Qo'llanma")}
              </span>
            </button>
          </div>

          <div className="h-12 flex items-center w-full relative" ref={langDropdownRef}>
              <button 
                onClick={() => setLangDropdownVisible(!langDropdownVisible)}
                className={`relative flex items-center justify-start rounded-3xl transition-all duration-200 ease-out group w-full h-12 text-[#444654] hover:bg-[#e5e2e1] active:scale-[0.97] border border-transparent ${langDropdownVisible ? 'bg-[#e5e2e1]' : ''}`}
                title={t("Tilni almashtirish")}
              >
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <img src={currentDetails.flagUrl} alt={currentDetails.name} className="w-[24px] h-[16px] object-cover rounded-[3px]" />
                </div>
                <div className={`flex items-center justify-between w-[calc(100%-48px)] pr-3 whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                  isSidebarOpen ? 'opacity-100 blur-0 translate-x-0' : 'opacity-0 blur-sm -translate-x-2 pointer-events-none'
                }`}>
                    <span className="font-semibold text-[15px] text-[#1c1b1b]">{currentDetails.name}</span>
                    <span className="material-symbols-outlined text-[20px] opacity-50">unfold_more</span>
                </div>
              </button>
              {langDropdownVisible && langMenu}
          </div>

          <div className="h-12 flex items-center w-full relative">
            <a 
              href="https://t.me/jonizz_devvvv" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="relative flex items-center justify-start rounded-3xl transition-all duration-200 ease-out group w-full h-12 text-[#444654] hover:bg-[#e5e2e1] active:scale-[0.97] border border-transparent"
              title={t("Yordam Markazi")}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined transition-colors duration-300 ease-in-out group-hover:text-[#274ed5]">contact_support</span>
              </div>
              <span className={`text-[14px] leading-[20px] whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                isSidebarOpen ? 'opacity-100 blur-0 translate-x-0' : 'opacity-0 blur-sm -translate-x-2 pointer-events-none'
              } font-semibold`}>
                {t("Yordam Markazi")}
              </span>
            </a>
          </div>

          <div className="h-12 flex items-center w-full relative">
            <button 
              onClick={handleLogout} 
              className="relative flex items-center justify-start rounded-3xl transition-all duration-200 ease-out group w-full h-12 text-[#ba1a1a] hover:bg-[#ffdad6] active:scale-[0.97] border border-transparent"
              title={t("Tizimdan chiqish")}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">logout</span>
              </div>
              <span className={`text-[14px] leading-[20px] whitespace-nowrap transition-all duration-300 ease-in-out absolute left-12 ${
                isSidebarOpen ? 'opacity-100 blur-0 translate-x-0' : 'opacity-0 blur-sm -translate-x-2 pointer-events-none'
              } font-semibold`}>
                {t("Tizimdan chiqish")}
              </span>
            </button>
          </div>
        </div>
      </aside>
        </>
      )}

      <main className={`flex-1 w-full max-w-full transition-[margin] duration-300 ease-in-out min-w-0 ${
        isDiagnosticPage 
          ? 'ml-0 md:ml-0 p-0 pt-0 min-h-screen bg-white' 
          : `px-4 pt-14 pb-24 md:p-[40px] md:pb-[40px] flex flex-col gap-5 ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[88px]'}`
      }`}>
        {children ?? <Outlet />}
      </main>

      {/* Mobile Bottom Navigation */}
      {!isDiagnosticPage && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#fcf9f8]/95 backdrop-blur-md border-t border-[#c4c5d7]/20 z-50 flex justify-around items-center h-16 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors ${
                  isActive ? 'text-[#274ed5]' : 'text-[#444654] hover:text-[#274ed5]'
                }`}
              >
                <div className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-[#dde2f4] text-[#274ed5]' : ''}`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <span className={`text-[10px] leading-tight mt-0.5 whitespace-nowrap ${isActive ? 'font-bold text-[#274ed5]' : 'font-medium opacity-80'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
    </>
  );
};

export default KnowzaAILayout;
