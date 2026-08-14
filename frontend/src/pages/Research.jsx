import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../data/apiService';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import html2pdf from 'html2pdf.js';
import Seo from '../../components/Seo';
import { ResearchSkeleton } from '../../components/Skeletons';

import { useResearch } from '../../context/ResearchContext';
import { useAuth } from '../../context/AuthContext';
import ProUpgradeModal from '../../components/ProUpgradeModal';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SUGGESTIONS = [
  "Qora tuynuklar qanday paydo bo'ladi?",
  "Kvant kompyuterlari ishlash prinsipi",
  "Sun'iy intellekt kelajak kasblariga ta'siri",
  "IELTS Writing Task 2 da 8.0 olish strategiyasi",
  "Gen muhandisligi va CRISPR texnologiyasi",
  "Mars sayyorasini kolonizatsiya qilish istiqbollari"
];

const KnowzaAIResearch = () => {
  const { t } = useTranslation();
  const { generatingState, startGeneration } = useResearch();
  const { currentUser } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  
  // Use context for current topic if we are currently generating it, otherwise local state for input
  const [inputTopic, setInputTopic] = useState('');
  
  // article and loading flags map to context or active selected research
  const isCurrentlyGenerating = generatingState.isGenerating;
  const loading = isCurrentlyGenerating;
  const loadingStepText = generatingState.stepText;
  
  const [localArticle, setLocalArticle] = useState('');
  
  const { researchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeResearchId, setActiveResearchId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isFullScreen = searchParams.get('fullscreen') === 'true';
  const setIsFullScreen = (value) => {
    if (value) {
      searchParams.set('fullscreen', 'true');
    } else {
      searchParams.delete('fullscreen');
    }
    setSearchParams(searchParams);
  };
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | '24h' | 'week' | 'month' | 'older'
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' | 'oldest' | 'az'
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicText, setEditingTopicText] = useState("");

  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isPlaceholderFading, setIsPlaceholderFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderFading(true);
      setTimeout(() => {
        setPlaceholderIdx(prev => (prev + 1) % SUGGESTIONS.length);
        setIsPlaceholderFading(false);
      }, 350);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Close full screen on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Lock body scroll when in full screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullScreen]);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const { data: researches = [], isLoading: isLoadingResearches } = useQuery({
    queryKey: ['researches'],
    queryFn: async () => {
      const data = await apiService.getSavedResearches();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
    refetchInterval: 15000
  });

  const filteredAndSortedResearches = React.useMemo(() => {
    if (!researches) return [];
    let list = [...researches];

    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase();
      list = list.filter(r => (r.topic || '').toLowerCase().includes(q));
    }

    const now = new Date().getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const ONE_WEEK = 7 * ONE_DAY;
    const ONE_MONTH = 30 * ONE_DAY;

    if (timeFilter === '24h') {
      list = list.filter(r => {
        const itemTime = new Date(r.created_at || 0).getTime();
        return (now - itemTime) <= ONE_DAY;
      });
    } else if (timeFilter === 'week') {
      list = list.filter(r => {
        const itemTime = new Date(r.created_at || 0).getTime();
        return (now - itemTime) <= ONE_WEEK;
      });
    } else if (timeFilter === 'month') {
      list = list.filter(r => {
        const itemTime = new Date(r.created_at || 0).getTime();
        return (now - itemTime) <= ONE_MONTH;
      });
    } else if (timeFilter === 'older') {
      list = list.filter(r => {
        const itemTime = new Date(r.created_at || 0).getTime();
        return (now - itemTime) > ONE_MONTH;
      });
    }

    if (sortOrder === 'latest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortOrder === 'az') {
      list.sort((a, b) => (a.topic || '').localeCompare(b.topic || ''));
    }

    return list;
  }, [researches, sidebarSearch, timeFilter, sortOrder]);

  useEffect(() => {
    if (researchId && researches.length > 0) {
      const found = researches.find(r => String(r.research_id) === String(researchId) || String(r.id) === String(researchId));
      if (found) {
        setActiveResearchId(found.research_id || found.id);
        setInputTopic(found.topic || '');
        if (found.content) {
          setLocalArticle(found.content);
        }
        setIsEditing(false);
      }
    } else if (!researchId && !generatingState.isGenerating) {
      setActiveResearchId(null);
      setInputTopic('');
      setLocalArticle('');
      setIsEditing(false);
    }
  }, [researchId, researches, generatingState.isGenerating]);
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!inputTopic.trim()) return toast.error(t('Mavzuni kiriting'));

    setIsEditing(false);
    setIsFullScreen(false);
    setLocalArticle('');
    
    await startGeneration(inputTopic, (text, savedId) => {
      // Live updates
      setLocalArticle(text);
      if (savedId) queryClient.invalidateQueries({ queryKey: ['researches'] });
    }, (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ['researches'] });
      if (savedItem && savedItem.research_id) {
        navigate(`/knowza-ai/research/${savedItem.research_id}`);
      }
    });
    
    setInputTopic('');
  };

  const formatMarkdownSpacing = (text) => {
    if (!text) return '';
    const cleanText = text;
    return cleanText.split('\n').reduce((acc, line, i, arr) => {
      if (i === 0) return line;
      const isList = /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
      const prevIsList = /^\s*[-*+]\s+/.test(arr[i-1]) || /^\s*\d+\.\s+/.test(arr[i-1]);
      if (arr[i-1] === '' || line === '' || (isList && prevIsList)) {
        return acc + '\n' + line;
      }
      return acc + '\n\n' + line;
    }, '');
  };

  const rawArticle = (isCurrentlyGenerating && (activeResearchId === generatingState.savedId || !activeResearchId)) ? generatingState.article : localArticle;
  const currentArticle = formatMarkdownSpacing(rawArticle);

  const exportClientPdf = async (title, content) => {
    const articleEl = document.getElementById('article-pdf-content');
    let elementToExport;

    if (articleEl) {
      elementToExport = articleEl.cloneNode(true);
      elementToExport.style.maxHeight = 'none';
      elementToExport.style.overflow = 'visible';
      elementToExport.style.padding = '10px';
      elementToExport.style.backgroundColor = '#ffffff';
      elementToExport.style.color = '#1c1b1b';
      
      // Remove TOC inside clone if present
      const toc = elementToExport.querySelector('.mt-12');
      if (toc) toc.remove();
    } else {
      elementToExport = document.createElement('div');
      elementToExport.style.padding = '20px';
      elementToExport.style.fontFamily = 'Arial, sans-serif';
      elementToExport.style.color = '#1c1b1b';
      elementToExport.style.lineHeight = '1.8';
      elementToExport.style.fontSize = '14px';
      elementToExport.innerText = content || '';
    }

    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = '#ffffff';

    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '24px';
    header.style.borderBottom = '2px solid #274ed5';
    header.style.paddingBottom = '16px';
    header.innerHTML = `
      <h1 style="font-size: 26px; color: #274ed5; margin: 0 0 8px 0; font-family: sans-serif;">Knowza AI Research</h1>
      <p style="font-size: 16px; font-weight: bold; margin: 0; color: #1c1b1b; font-family: sans-serif;">${title || 'Izlanish Maqolasi'}</p>
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
      p, blockquote, ul, ol, li, div.katex-display, .katex, tr, img { page-break-inside: avoid; break-inside: avoid; }
    `;
    wrapper.appendChild(styleEl);
    wrapper.appendChild(header);
    wrapper.appendChild(elementToExport);

    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     `${(title || 'research').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    return html2pdf().set(opt).from(wrapper).save();
  };

  const handleExportPDF = async () => {
    if (!currentArticle) return;
    try {
      toast.info(t('PDF yuklanmoqda...'));
      const blob = await apiService.knowzaAIExportPdf(currentArticle);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(inputTopic || generatingState.topic || 'research').substring(0, 20)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('PDF yuklandi'));
    } catch (err) {
      console.warn('Server PDF export failed, using client-side fallback:', err);
      try {
        await exportClientPdf(inputTopic || generatingState.topic || 'Knowza_AI_Research', currentArticle);
        toast.success(t('PDF yuklandi'));
      } catch (fallbackErr) {
        console.error('Client PDF export failed:', fallbackErr);
        toast.error(t('PDF eksportida xatolik yuz berdi'));
      }
    }
  };

  const handleExportItemPdf = async (r, e) => {
    if (e) e.stopPropagation();
    setMenuOpenId(null);
    try {
      toast.info(t('PDF yuklanmoqda...'));
      const blob = await apiService.knowzaAIExportPdf(r.content || r.topic);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(r.topic || 'research').substring(0, 20)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('PDF yuklandi'));
    } catch (err) {
      console.warn('Server PDF export failed, using client-side fallback:', err);
      try {
        await exportClientPdf(r.topic || 'Knowza_AI_Research', r.content || r.topic);
        toast.success(t('PDF yuklandi'));
      } catch (fallbackErr) {
        console.error('Client PDF export failed:', fallbackErr);
        toast.error(t('PDF eksportida xatolik yuz berdi'));
      }
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const localItems = JSON.parse(localStorage.getItem('knowza_saved_researches') || '[]');
        const filtered = localItems.filter(item => String(item.research_id || item.id) !== String(id));
        localStorage.setItem('knowza_saved_researches', JSON.stringify(filtered));
      } catch (e) {}

      try {
        await apiService.deleteSavedResearch(id);
      } catch (e) {
        console.warn('Server delete fallback:', e);
      }
      return id;
    },
    onSuccess: (id) => {
      toast.success(t("O'chirildi"));
      queryClient.invalidateQueries({ queryKey: ['researches'] });
      if (String(activeResearchId) === String(id)) {
        navigate('/knowza-ai/research');
      }
    },
    onError: () => {
      toast.success(t("O'chirildi"));
      queryClient.invalidateQueries({ queryKey: ['researches'] });
    }
  });

  const handleSaveTopic = async (id) => {
    if (!editingTopicText.trim()) {
      setEditingTopicId(null);
      return;
    }
    const newTopic = editingTopicText.trim();
    try {
      const localItems = JSON.parse(localStorage.getItem('knowza_saved_researches') || '[]');
      const idx = localItems.findIndex(item => String(item.research_id || item.id) === String(id));
      if (idx !== -1) {
        localItems[idx].topic = newTopic;
        localStorage.setItem('knowza_saved_researches', JSON.stringify(localItems));
      }
    } catch (e) {}

    try {
      await apiService.updateSavedResearch(id, { topic: newTopic });
    } catch (error) {
      console.warn('Failed to update topic on server:', error);
    }
    queryClient.invalidateQueries({ queryKey: ['researches'] });
    setEditingTopicId(null);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    setMenuOpenId(null);
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const loadResearch = (research) => {
    if (loading && activeResearchId === research.research_id) return; // Prevent reload if currently generating
    navigate(`/knowza-ai/research/${research.research_id}`);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedContent(currentArticle);
  };

  const saveEditMutation = useMutation({
    mutationFn: async ({ id, content }) => {
      try {
        const localItems = JSON.parse(localStorage.getItem('knowza_saved_researches') || '[]');
        const idx = localItems.findIndex(item => String(item.research_id || item.id) === String(id));
        if (idx !== -1) {
          localItems[idx].content = content;
          localStorage.setItem('knowza_saved_researches', JSON.stringify(localItems));
        }
      } catch (e) {}

      try {
        const updated = await apiService.updateSavedResearch(id, { content });
        return updated;
      } catch (e) {
        return { content };
      }
    },
    onSuccess: (updated) => {
      setLocalArticle(updated.content);
      setIsEditing(false);
      toast.success(t('Tahrir saqlandi!'));
      queryClient.invalidateQueries({ queryKey: ['researches'] });
    }
  });

  const handleSaveEdit = () => {
    if (!activeResearchId) return;
    saveEditMutation.mutate({ id: activeResearchId, content: editedContent });
  };

  const handleNew = () => {
    if (loading) return toast.info(t("Avval joriy jarayon tugashini kuting"));
    navigate('/knowza-ai/research');
  };

  const renderTOC = (markdown) => {
    if (!markdown) return null;
    const lines = markdown.split('\n');
    const headings = [];
    lines.forEach(line => {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/\*|_|\[|\]|\(.*\)/g, '').trim(); 
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        headings.push({ level, text, id });
      }
    });

    if (headings.length === 0) return null;

    return (
      <div className="mt-12 bg-[#fcf9f8] p-6 md:p-8 rounded-3xl border border-[#e5e2e1]">
        <h3 className="text-xl font-bold text-[#1c1b1b] mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#274ed5]">list_alt</span>
          {t("Mundarija")}
        </h3>
        <ul className="flex flex-col gap-3">
          {headings.map((h, i) => (
            <li key={i} className={h.level === 3 ? "ml-6" : ""}>
              <a 
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-[#274ed5] hover:text-[#1f42ba] hover:underline font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#c4c5d7] shrink-0"></div>
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      <Seo 
        title={t("AI Izlanish | Knowza AI")}
        description={t("Sun'iy intellekt yordamida chuqur ilmiy izlanishlar olib boring va maqolalar yarating.")}
        icon="/banner/Knowza-logo-mini.png"
      />
      <div className="flex flex-col lg:flex-row gap-6 w-full lg:h-[calc(100vh-80px)] relative overflow-hidden">
        {/* Sidebar: Saved Researches */}
      <div className="w-full lg:w-1/4 bg-white rounded-[36px] p-6 shadow-none border border-[#e5e2e1] flex flex-col z-10 shrink-0 lg:h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-[#1c1b1b] text-[18px]">{t("Saqlangan izlanishlar")}</h3>
          <button onClick={handleNew} disabled={loading} className="bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 text-white w-10 h-10 flex items-center justify-center shrink-0 rounded-2xl hover:opacity-95 active:scale-95 transition-all shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none" title={t("Yangi izlanish")}>
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>

        {/* Search & Section Title */}
        <div className="flex flex-col gap-3 mb-3 shrink-0">
          {/* Search bar */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[#747686] text-[18px]">search</span>
            <input 
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder={t("Izlanishlardan qidirish...")}
              className="w-full pl-10 pr-3 py-2 bg-[#f8f9fa] border border-[#e5e2e1] rounded-2xl text-[13px] outline-none focus:ring-1 focus:ring-[#274ed5] text-[#1c1b1b]"
            />
          </div>

          {/* Clean Section Label: Oxirgilar / Latest */}
          <div className="flex items-center px-1">
            <span className="text-[13px] font-bold text-[#747686] tracking-wide uppercase">{t("Oxirgilar")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 -mx-3 pb-4 custom-scrollbar min-h-0">
          {isLoadingResearches ? (
             <ResearchSkeleton />
          ) : filteredAndSortedResearches.length === 0 ? (
            <p className="text-[#8e8f99] text-sm text-center py-4">{t("Izlanish topilmadi")}</p>
          ) : (
            filteredAndSortedResearches.map(r => {
              const isActive = activeResearchId === r.research_id;
              const isGeneratingThis = isCurrentlyGenerating && generatingState.savedId === r.research_id;
              return (
                <div 
                  key={r.research_id}
                  onClick={() => loadResearch(r)}
                  className={`p-3.5 rounded-[22px] cursor-pointer transition-all flex justify-between items-center group ${editingTopicId === r.research_id ? 'bg-[#e8edff]' : isActive && !isGeneratingThis ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 text-white shadow-none font-bold' : isGeneratingThis ? 'bg-blue-50/50' : 'bg-[#f8f9fa] hover:bg-[#f0edec]'}`}
                >
                  <div className="flex-1 min-w-0 pr-2 relative">
                    <input 
                      type="text" 
                      value={editingTopicId === r.research_id ? editingTopicText : r.topic}
                      onChange={(e) => setEditingTopicText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTopic(r.research_id);
                        if (e.key === 'Escape') setEditingTopicId(null);
                      }}
                      autoFocus={editingTopicId === r.research_id}
                      onClick={(e) => { if (editingTopicId === r.research_id) e.stopPropagation(); }}
                      readOnly={editingTopicId !== r.research_id}
                      className={`w-full bg-transparent outline-none text-[15px] font-medium transition-all duration-300 truncate ${editingTopicId === r.research_id ? 'text-[#1c1b1b] translate-y-[9px] scale-[1.03] origin-left cursor-text' : (isActive && !isGeneratingThis ? 'text-white cursor-pointer font-bold' : 'text-[#1c1b1b] cursor-pointer')}`}
                    />
                    <p className={`text-xs transition-all duration-300 ${editingTopicId === r.research_id ? 'opacity-0 pointer-events-none mt-0.5' : isActive && !isGeneratingThis ? 'mt-0.5 text-white/80 opacity-100' : 'mt-0.5 text-[#8e8f99] opacity-100'}`}>
                      {isGeneratingThis ? (
                        <span className="flex items-center gap-1 text-[#274ed5] font-semibold">
                          <span className="w-3 h-3 border-[2px] border-[#274ed5] border-t-transparent rounded-full animate-spin"></span>
                          {t("Yozilmoqda...")}
                        </span>
                      ) : (
                        new Date(r.created_at).toLocaleDateString()
                      )}
                    </p>
                  </div>
                  {!isGeneratingThis && (
                    <div className="relative flex items-center gap-1 shrink-0">
                      {editingTopicId === r.research_id ? (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingTopicId(null); }}
                            className="w-8 h-8 rounded-2xl hover:bg-[#f0eded] text-[#8e8f99] hover:text-[#1c1b1b] flex items-center justify-center transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSaveTopic(r.research_id); }}
                            className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white hover:opacity-90 flex items-center justify-center transition-all shadow-none"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === r.research_id ? null : r.research_id); }}
                            className={`transition-all p-1.5 rounded-xl flex items-center justify-center ${menuOpenId === r.research_id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isActive ? (menuOpenId === r.research_id ? 'bg-white/25 text-white' : 'hover:bg-white/20 text-white') : (menuOpenId === r.research_id ? 'bg-[#e5e2e1] text-[#1c1b1b]' : 'hover:bg-[#e5e2e1] text-[#8e8f99]')}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>
                          
                          {menuOpenId === r.research_id && (
                        <div className="absolute right-0 top-8 mt-1 w-40 bg-white rounded-2xl shadow-none border border-[#e5e2e1] overflow-hidden z-10 flex flex-col">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setMenuOpenId(null); 
                              setEditingTopicId(r.research_id); 
                              setEditingTopicText(r.topic); 
                            }}
                            className="px-4 py-2.5 text-left text-sm font-semibold text-[#1c1b1b] hover:bg-[#f0edec] transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            {t("Tahrirlash")}
                          </button>
                          <button 
                            onClick={(e) => {
                              if (!currentUser?.is_premium) {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                setShowProModal(true);
                              } else {
                                handleExportItemPdf(r, e);
                              }
                            }}
                            className={`px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center gap-2 ${!currentUser?.is_premium ? 'text-slate-400 opacity-70 hover:bg-white' : 'text-[#1c1b1b] hover:bg-[#f0edec]'}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {!currentUser?.is_premium ? 'lock' : 'picture_as_pdf'}
                            </span>
                            {t("PDF yuklash")}
                          </button>
                          <button 
                            onClick={(e) => { setMenuOpenId(null); handleDelete(r.research_id, e); }}
                            className="px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            {t("O'chirish")}
                          </button>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:w-3/4 flex flex-col gap-6 min-h-0 lg:h-full">
        {!activeResearchId && !isCurrentlyGenerating && (
          <div className="flex-1 flex flex-col items-center justify-start pt-[18%] min-h-[500px] lg:h-full px-4 text-center">
            {/* Animated Icon Badge */}
            <div className="w-16 h-16 rounded-3xl bg-[#e8edff] flex items-center justify-center text-[#274ed5] mb-5 shadow-none">
              <span className="material-symbols-outlined text-[36px]">auto_awesome</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-[26px] md:text-[32px] font-bold text-[#1c1b1b] mb-2 tracking-tight">
              {t("Nima haqida izlanish o'tkazmoqchisiz?")}
            </h2>
            <p className="text-[#747686] text-[15px] max-w-lg mb-8 leading-relaxed">
              {t("Istalgan ilmiy, texnik yoki ta'limiy mavzuni kiriting. Knowza AI siz uchun tahliliy va batafsil maqola tayyorlaydi.")}
            </p>

            {/* Main Input Form Card */}
            <div className="w-full max-w-2xl bg-white rounded-[36px] p-6 md:p-8 shadow-none border border-[#e5e2e1] text-left transition-all duration-300">
              <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                <label className="font-bold text-[#1c1b1b] text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#274ed5] text-[20px]">edit_note</span>
                  {t("Izlanish mavzusi")}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 flex items-center">
                    <input 
                      type="text" 
                      value={inputTopic}
                      onChange={(e) => setInputTopic(e.target.value)}
                      className="w-full px-5 py-4 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] outline-none text-[#1c1b1b] text-[15px] transition-all"
                      disabled={loading}
                    />
                    {!inputTopic && (
                      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8e8f99] text-[15px] select-none flex items-center gap-1">
                        <span>{t("Masalan:")}</span>
                        <span 
                          className={`transition-all duration-350 ease-in-out inline-block ${
                            isPlaceholderFading ? 'opacity-0 blur-sm scale-95' : 'opacity-100 blur-0 scale-100'
                          }`}
                        >
                          {SUGGESTIONS[placeholderIdx]}
                        </span>
                      </span>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || !inputTopic.trim()}
                    className="px-8 py-4 rounded-[30px] bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 text-white font-bold text-[16px] shadow-none hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        {t("Jarayonda...")}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        {t("Yaratish")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Skeleton while analyzing/searching before article starts */}
        {loading && !generatingState.article && loadingStepText && (
          <div className="bg-white rounded-[36px] p-6 md:p-12 shadow-none border border-[#e5e2e1] flex flex-col items-center justify-center flex-1 text-center min-h-[50vh]">
            <div className="w-16 h-16 bg-[#e8edff] text-[#274ed5] rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[32px]">manage_search</span>
            </div>
            <h3 className="text-2xl font-bold text-[#1c1b1b] mb-4">{t("Izlanish olib borilmoqda...")}</h3>
            <p className="text-[#444654] text-lg max-w-md">
              {t("Sizning mavzuingiz bo'yicha ma'lumotlar to'planmoqda va maqola yozilmoqda. ")}
              <strong>{t("Izlanish tayyor bo'lganda xabar beramiz.")}</strong>
            </p>
            <div className="mt-8 flex items-center gap-3 text-[#274ed5] font-semibold bg-blue-50 px-6 py-3 rounded-2xl">
              <span className="w-5 h-5 border-2 border-[#274ed5] border-t-transparent rounded-full animate-spin"></span>
              {loadingStepText}
            </div>
          </div>
        )}

        {(currentArticle || (!loading && activeResearchId && !isEditing) || isEditing) && (
          <div className={isFullScreen ? "fixed inset-0 z-[100] bg-[#f8fafc] overflow-y-auto w-full h-full" : "bg-white rounded-[36px] p-6 shadow-none border border-[#e5e2e1] flex flex-col gap-6 flex-1 min-h-0 overflow-hidden"}>
            <div className={isFullScreen ? "max-w-4xl mx-auto w-full flex flex-col gap-6 p-6 md:p-12 min-h-screen bg-white md:shadow-none md:my-8 rounded-[36px] border border-[#e5e2e1]" : "flex flex-col gap-6 flex-1 overflow-hidden"}>
              <div className="flex flex-wrap justify-between items-center border-b border-[#e5e2e1] pb-4 gap-4 shrink-0">
                <h3 className="text-[20px] font-bold text-[#1c1b1b] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#274ed5]">description</span>
                  {t("Tayyor izlanish")}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsFullScreen(!isFullScreen)} 
                    className="px-5 py-2.5 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 rounded-full text-white font-bold text-[14px] hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 shadow-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isFullScreen ? 'fullscreen_exit' : 'fullscreen'}
                    </span>
                    {isFullScreen ? t('Kichraytirish') : t("To'liq ekran")}
                  </button>
                  {!loading && (
                    <button 
                      onClick={() => {
                        if (!currentUser?.is_premium) {
                          setShowProModal(true);
                        } else {
                          handleExportPDF();
                        }
                      }} 
                      className={`px-5 py-2.5 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 rounded-full font-bold text-[14px] transition-all flex items-center gap-2 hidden sm:flex text-white hover:opacity-95 active:scale-95 shadow-none`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {!currentUser?.is_premium ? 'lock' : 'picture_as_pdf'}
                      </span>
                      {t("PDF eksport")}
                    </button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="flex-1 w-full min-h-[400px] p-4 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl outline-none text-[16px] leading-[1.8] focus:ring-2 focus:ring-[#274ed5]"
                />
                <div className="flex justify-end gap-3 shrink-0">
                  <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-full font-semibold text-[#8e8f99] hover:bg-[#f0edec]">
                    {t("Bekor qilish")}
                  </button>
                  <button onClick={handleSaveEdit} className="px-6 py-3 rounded-full font-bold bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 text-white hover:opacity-95 active:scale-95 transition-all shadow-none">
                    {t("Saqlash")}
                  </button>
                </div>
              </div>
            ) : (
              <div id="article-pdf-content" className="text-[#1c1b1b] flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 break-words max-w-full">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-6 text-[16px] md:text-[17px] leading-[1.8] break-words" {...props} />,
                    h1: ({node, children, ...props}) => {
                      const extractText = (c) => typeof c === 'string' ? c : (Array.isArray(c) ? c.map(extractText).join('') : (c?.props?.children ? extractText(c.props.children) : ''));
                      const id = String(extractText(children)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      return <h1 id={id} className="text-3xl md:text-4xl font-bold mb-6 mt-8 text-[#1c1b1b]" {...props}>{children}</h1>;
                    },
                    h2: ({node, children, ...props}) => {
                      const extractText = (c) => typeof c === 'string' ? c : (Array.isArray(c) ? c.map(extractText).join('') : (c?.props?.children ? extractText(c.props.children) : ''));
                      const id = String(extractText(children)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      return <h2 id={id} className="text-2xl md:text-3xl font-bold mb-5 mt-8 text-[#1c1b1b]" {...props}>{children}</h2>;
                    },
                    h3: ({node, children, ...props}) => {
                      const extractText = (c) => typeof c === 'string' ? c : (Array.isArray(c) ? c.map(extractText).join('') : (c?.props?.children ? extractText(c.props.children) : ''));
                      const id = String(extractText(children)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      return <h3 id={id} className="text-xl md:text-2xl font-bold mb-4 mt-6 text-[#1c1b1b]" {...props}>{children}</h3>;
                    },
                    ul: ({node, ...props}) => <ul className="list-disc pl-8 mb-6 space-y-2 text-[16px] md:text-[17px] leading-[1.8]" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-8 mb-6 space-y-2 text-[16px] md:text-[17px] leading-[1.8]" {...props} />,
                    img: ({node, src, alt, ...props}) => {
                      if (!src && !alt) return null;
                      const altText = alt || '';
                      if (altText.toLowerCase().includes('video')) {
                        return (
                          <div className="my-6 p-4 rounded-2xl bg-[#e8edff] border border-[#274ed5]/20 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#274ed5] text-white flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">smart_display</span>
                              </div>
                              <div>
                                <h5 className="font-bold text-[#1c1b1b] text-[14px]">{altText}</h5>
                                <p className="text-xs text-[#5a5b6a]">{t("Mavzuga oid video qo'llanma")}</p>
                              </div>
                            </div>
                            <a 
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(src || altText)}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-4 py-2 bg-[#274ed5] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1 shrink-0"
                            >
                              <span>{t("Ko'rish")}</span>
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </div>
                        );
                      }
                      const isDirect = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
                      const imgSrc = isDirect ? src : `https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80`;
                      return (
                        <figure className="my-8 rounded-2xl overflow-hidden border border-[#e5e2e1] bg-[#fcf9f8] shadow-xs">
                          <img src={imgSrc} alt={altText || 'Ilmiy tasvir'} className="w-full h-auto max-h-[420px] object-cover" />
                          {altText && (
                            <figcaption className="p-3 text-center text-xs font-semibold text-[#5a5b6a] bg-white border-t border-[#e5e2e1] flex items-center justify-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-[#274ed5]">image</span>
                              <span>{altText}</span>
                            </figcaption>
                          )}
                        </figure>
                      );
                    },
                    a: ({node, href, children, ...props}) => {
                      if (href) {
                        const lowerHref = href.toLowerCase();
                        const nsfwKeywords = ['porn', 'sex', 'adult', 'xxx', 'hentai', 'erotic', 'nude', 'nsfw', 'simplybestporn', 'xvideos', 'pornhub'];
                        if (nsfwKeywords.some(kw => lowerHref.includes(kw))) {
                          return null;
                        }
                      }
                      if (href && (href.includes('youtube.com/watch') || href.includes('youtu.be/'))) {
                        let videoId = null;
                        try {
                          if (href.includes('youtu.be/')) videoId = href.split('youtu.be/')[1].split('?')[0];
                          else videoId = new URL(href.startsWith('http') ? href : `https://${href}`).searchParams.get('v');
                        } catch(e) {}
                        if (videoId) {
                          return (
                            <span className="block my-6 aspect-video w-full rounded-2xl overflow-hidden border border-[#e5e2e1]">
                              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </span>
                          );
                        }
                      }
                      if (href && href.startsWith('#')) {
                        return (
                          <a href={href} onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(href.substring(1));
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }} className="text-[#274ed5] hover:text-[#1f42ba] underline break-words font-medium cursor-pointer" {...props}>
                            {children}
                          </a>
                        );
                      }
                      return <a href={href} className="text-[#274ed5] hover:text-[#1f42ba] underline break-words font-medium" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                    },
                    strong: ({node, ...props}) => <strong className="font-semibold text-[#1c1b1b]" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#274ed5] bg-[#fcf9f8] p-4 rounded-r-xl italic text-[#5a5b6a] my-6 text-[16px] leading-[1.8]" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-[#f8fafc] text-[#334155] border border-[#e2e8f0] p-5 rounded-xl my-6 overflow-x-auto custom-scrollbar font-mono text-[14px] leading-relaxed shadow-sm" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      if (inline) {
                        return <code className="bg-[#f2f4f7] text-[#344054] border border-[#eaecf0] px-1.5 py-0.5 rounded-md font-mono text-[13px] break-words whitespace-pre-wrap" {...props}>{children}</code>;
                      }
                      return <code className="bg-transparent text-inherit p-0 font-mono text-[14px]" {...props}>{children}</code>;
                    }
                  }}
                >
                  {currentArticle}
                </ReactMarkdown>
                
                {/* Dynamically Generated TOC */}
                {renderTOC(currentArticle)}
                
                {loading && (
                  <span className="inline-block w-2.5 h-5 bg-[#274ed5] animate-pulse ml-1 align-middle mt-2"></span>
                )}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-[#e5e2e1] flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-[#1c1b1b] text-xl">{t("O'chirishni tasdiqlang")}</h3>
              <p className="text-[#5a5b6a] text-[15px] leading-relaxed">
                {t("Haqiqatan ham ushbu izlanishni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.")}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-[#1c1b1b] bg-[#f2f4f7] hover:bg-[#e4e7ec] transition-colors"
              >
                {t("Bekor qilish")}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-[#d92d20] hover:bg-[#b42318] transition-colors"
              >
                {t("O'chirish")}
              </button>
            </div>
          </div>
        </div>
      )}
      <ProUpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
};

export default KnowzaAIResearch;
