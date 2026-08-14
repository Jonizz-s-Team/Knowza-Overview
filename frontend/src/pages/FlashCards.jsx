import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../data/apiService';
import Seo from '../../components/Seo';
import { useAuth } from '../../context/AuthContext';
import { useFlashCards } from '../../context/FlashCardsContext';

const KnowzaAIFlashCards = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { startFlashGeneration, finishFlashGeneration, failFlashGeneration } = useFlashCards();
  
  // Auto-detect user's primary test track from backend
  const { data: userExamTrack } = useQuery({
    queryKey: ['userExamTrack'],
    queryFn: async () => {
      try {
        const res = await apiService.getDiagnosticResult('ielts');
        if (res?.data?.exam_type) return res.data.exam_type;
        const resSat = await apiService.getDiagnosticResult('sat');
        if (resSat?.data?.exam_type) return resSat.data.exam_type;
        const resMs = await apiService.getDiagnosticResult('ms');
        if (resMs?.data?.exam_type) return resMs.data.exam_type;
      } catch (e) {}
      return 'IELTS';
    }
  });

  // States
  const [selectedExamType, setSelectedExamType] = useState('IELTS');
  const [activeDeck, setActiveDeck] = useState(null);
  const [reviewCards, setReviewCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);

  useEffect(() => {
    if (userExamTrack) {
      const norm = userExamTrack.toUpperCase();
      if (norm.includes('SAT')) {
        setSelectedExamType('SAT');
      } else if (norm.includes('MS') || norm.includes('MILLIY') || norm.includes('SERTIFIKAT')) {
        setSelectedExamType('Milliy Sertifikat');
      } else {
        setSelectedExamType('IELTS');
      }
    }
  }, [userExamTrack]);

  const isPro = useMemo(() => {
    return Boolean(currentUser?.is_pro || currentUser?.is_premium || currentUser?.tariff === 'pro' || currentUser?.plan === 'pro');
  }, [currentUser]);

  const getWeekKey = useCallback(() => {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const dayNum = Math.floor((d - jan1) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((dayNum + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
  }, []);

  const getWeeklyCreationCount = useCallback(() => {
    const key = `knowza_fc_creation_count_${getWeekKey()}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  }, [getWeekKey]);

  const [weeklyCreationCount, setWeeklyCreationCount] = useState(() => getWeeklyCreationCount());
  const remainingWeeklyCreations = Math.max(0, 3 - weeklyCreationCount);

  // Form states
  const [formData, setFormData] = useState({
    examType: 'IELTS',
    topic: '',
    deckType: 'Lug\'at',
    count: 10
  });

  useEffect(() => {
    if (selectedExamType) {
      setFormData(prev => ({ ...prev, examType: selectedExamType }));
    }
  }, [selectedExamType]);

  // Queries
  const { data: decksData, isLoading: decksLoading } = useQuery({
    queryKey: ['flashcardDecks', selectedExamType],
    queryFn: () => apiService.getFlashcardDecks(selectedExamType),
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const DAILY_TOPICS = useMemo(() => ({
    IELTS: [
      'Academic Vocabulary Band 7+', 'Environment & Ecology', 'Technology & Innovation',
      'Health & Medicine', 'Society & Culture', 'Business & Economics', 'Education & Research',
      'Science & Space', 'Politics & Government', 'Arts & Literature', 'Travel & Geography',
      'Food & Nutrition', 'Sports & Competition', 'Climate & Sustainability', 'Psychology & Mind',
    ],
    SAT: [
      'SAT High-Frequency Words', 'Literary Devices', 'Critical Reading Vocabulary',
      'Science & Math Terms', 'History & Civics', 'Rhetoric & Argumentation',
      'Emotional & Abstract Words', 'Latin & Greek Roots', 'Command of Evidence Terms',
    ],
    default: [
      "Kundalik hayot so'zlari", "Ish va kasb", "Ta'lim va fan", "Tabiat va muhit",
      "Sog'liq va tibbiyot", "Texnologiya", "Jamiyat va madaniyat",
    ],
  }), []);

  // Auto-generate daily AI deck with rotating random topic
  useEffect(() => {
    const lastDaily = localStorage.getItem('knowza_fc_last_daily_date');
    if (lastDaily !== todayStr && !decksLoading && selectedExamType) {
      const topicsList = DAILY_TOPICS[selectedExamType] || DAILY_TOPICS.default;
      // Pick a pseudo-random topic based on day of year so it changes daily
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const autoTopic = topicsList[dayOfYear % topicsList.length];
      const title = `Kunlik AI Lug'at (${todayStr})`;

      startFlashGeneration(autoTopic);
      apiService.generateFlashcards(selectedExamType, autoTopic, "Lug'at", title, 10)
        .then(() => {
          localStorage.setItem('knowza_fc_last_daily_date', todayStr);
          queryClient.invalidateQueries({ queryKey: ['flashcardDecks'] });
          finishFlashGeneration(title);
        })
        .catch(e => {
          console.error('Auto daily deck generation error:', e);
          failFlashGeneration();
        });
    }
  }, [todayStr, selectedExamType, decksLoading, queryClient, DAILY_TOPICS, startFlashGeneration, finishFlashGeneration, failFlashGeneration]);

  const decks = decksData?.data || decksData || [];

  const startReviewMutation = useMutation({
    mutationFn: (deckId) => apiService.getFlashcardReview(deckId, 20),
    onSuccess: (data) => {
      const cards = data?.data || data || [];
      if (cards.length > 0) {
        setReviewCards(cards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowTranslation(false);
        setReviewSummary(null);
      } else {
        alert("Ko'rib chiqish uchun kartochkalar yo'q!");
        setActiveDeck(null);
      }
    }
  });

  const generateDeckMutation = useMutation({
    mutationFn: (data) => {
      startFlashGeneration(data.topic);
      return apiService.generateFlashcards(data.examType, data.topic, data.deckType, `${data.topic} - ${data.deckType}`, data.count);
    },
    onSuccess: () => {
      if (!isPro) {
        const key = `knowza_fc_creation_count_${getWeekKey()}`;
        const newCount = getWeeklyCreationCount() + 1;
        localStorage.setItem(key, newCount.toString());
        setWeeklyCreationCount(newCount);
      }
      queryClient.invalidateQueries({ queryKey: ['flashcardDecks'] });
      finishFlashGeneration(formData.topic);
      setIsModalOpen(false);
      setFormData({
        examType: selectedExamType || 'IELTS',
        topic: '',
        deckType: "Lug'at",
        count: 10
      });
    },
    onError: () => {
      failFlashGeneration();
    }
  });

  const reviewCardsRef = React.useRef([]);
  useEffect(() => { reviewCardsRef.current = reviewCards; }, [reviewCards]);

  const currentCardIndexRef = React.useRef(0);
  useEffect(() => { currentCardIndexRef.current = currentCardIndex; }, [currentCardIndex]);

  const goNextCard = useCallback(() => {
    const cards = reviewCardsRef.current;
    const currentIdx = currentCardIndexRef.current;
    if (currentIdx < cards.length - 1) {
      setCurrentCardIndex(currentIdx + 1);
      setIsFlipped(false);
      setShowTranslation(false);
    } else {
      setReviewSummary({ total: cards.length });
      setIsFlipped(false);
      setShowTranslation(false);
      // Refresh deck list so mastery % updates in the card grid
      queryClient.invalidateQueries({ queryKey: ['flashcardDecks'] });
    }
  }, [queryClient]);

  const submitAnswerMutation = useMutation({
    mutationFn: ({ cardId, quality }) => apiService.submitFlashcardAnswer(cardId, quality),
    onSuccess: goNextCard,
    onError: goNextCard,
  });

  // Handlers
  const handleStartReview = (deck) => {
    setActiveDeck(deck);
    startReviewMutation.mutate(deck.id || deck._id);
  };

  const handleAnswer = (quality) => {
    const cardId = reviewCards[currentCardIndex]?.id || reviewCards[currentCardIndex]?._id;
    if (cardId) {
      submitAnswerMutation.mutate({ cardId, quality });
    } else {
      // No cardId — just move to next
      goNextCard();
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!isPro && weeklyCreationCount >= 3) {
      alert("Siz bu hafta 3 marta qo'lda to'plam yaratdingiz! Kunlik AI to'plamlar esa har kuni avtomatik yaratilishda davom etadi.");
      return;
    }
    generateDeckMutation.mutate(formData);
  };

  const currentCard = reviewCards[currentCardIndex];

  const categoryTabs = useMemo(() => {
    const all = [
      { id: 'IELTS', label: '🇬🇧 IELTS' },
      { id: 'SAT', label: '🇺🇸 SAT' }
    ];

    if (isPro) {
      return [{ id: '', label: 'Barchasi' }, ...all];
    }

    // For Free Users: ONLY display the single track they have completed / selected!
    const matched = all.find(t => t.id === selectedExamType) || all[0];
    return [matched];
  }, [isPro, selectedExamType]);

  return (
    <>
      <Seo title="Lug'at | Knowza AI" description="IELTS va SAT uchun AI lug'at kartochkalari" />
      <div className="flex flex-col gap-6 w-full mx-auto animate-in fade-in duration-500">
      
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">
              {t('Lug\'at & So\'z boyligi')}
            </h2>
            <p className="text-[14px] leading-[20px] text-[#444654]">
              {t('IELTS va SAT uchun AI lug\'at va kartochkalar')}
            </p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-white font-bold bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] border border-white/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{t('Yangi kartochka yaratish')}</span>
          </button>
        </div>

        {/* Category Filters */}
        {!activeDeck && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categoryTabs.map(item => {
              const isSelected = selectedExamType === item.id;
              return (
                <button
                  key={item.id || 'all'}
                  onClick={() => setSelectedExamType(item.id)}
                  className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-all border select-none cursor-pointer whitespace-nowrap ${
                    isSelected 
                      ? 'bg-[#274ed5] text-white border-[#274ed5] shadow-xs' 
                      : 'bg-[#fcf9f8] text-[#747686] border-[#e5e2e1] hover:text-[#1c1b1b] hover:border-[#274ed5]/30'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Deck List View */}
        {!activeDeck && (
          <>
            {decksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse bg-white rounded-3xl p-6 h-48 border border-[#e5e2e1]"></div>
                ))}
              </div>
            ) : decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck, idx) => (
                  <div 
                    key={deck.id || deck._id || idx}
                    onClick={() => handleStartReview(deck)}
                    className="bg-white rounded-3xl p-6 border border-[#e5e2e1] shadow-xs cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#e8edff] text-[#274ed5] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">
                            {deck.deckType === "Lug'at" ? 'translate' : deck.deckType === "Formula" ? 'functions' : 'auto_stories'}
                          </span>
                        </div>
                        {deck.dueCount > 0 && (
                          <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[12px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">notifications</span>
                            {deck.dueCount} ta takrorlash
                          </div>
                        )}
                      </div>
                      <h3 className="text-[18px] font-bold text-[#1c1b1b] mb-1">{deck.title}</h3>
                      <p className="text-[13px] text-[#747686] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">school</span>
                        {deck.examType || deck.exam_type} • {deck.cards_count ?? deck.cardCount ?? deck.card_count ?? deck.totalCards ?? 0} ta kartochka
                      </p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#e5e2e1]">
                      <div className="flex justify-between text-[12px] mb-1.5 font-bold text-[#444654]">
                        <span>O'zlashtirish</span>
                        <span className="text-[#274ed5]">{Math.round(deck.mastery_percent ?? deck.masteryPercentage ?? 0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#f0f4ff] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#1f42ba] to-[#4f75ff] transition-all duration-1000"
                          style={{ width: `${Math.round(deck.mastery_percent ?? deck.masteryPercentage ?? 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#e5e2e1] text-center shadow-xs flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#e8edff] text-[#274ed5] flex items-center justify-center mb-4 border border-[#274ed5]/20">
                  <span className="material-symbols-outlined text-[32px]">style</span>
                </div>
                <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-2">{t("Hali kartochkalar yo'q")}</h3>
                <p className="text-[#747686] text-[14px] mb-6 max-w-md leading-relaxed">
                  {t("AI yordamida o'zingizga kerakli mavzuda kartochkalar to'plamini yarating va lug'at boyligingizni oshiring.")}
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-bold text-[14px] hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>{t("Birinchi to'plamni yaratish")}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Review Mode View */}
        {activeDeck && !reviewSummary && currentCard && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6 w-full">

            {/* Header: back button + progress */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setActiveDeck(null); setReviewCards([]); }}
                className="flex items-center gap-2 text-[#747686] hover:text-[#1c1b1b] font-bold text-[14px] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>{t("Orqaga")}</span>
              </button>

              <div className="flex items-center gap-4 w-1/2">
                <div className="w-full bg-[#e5e2e1] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#274ed5] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${((currentCardIndex + 1) / reviewCards.length) * 100}%` }}
                  />
                </div>
                <span className="text-[13px] font-bold text-[#1c1b1b] whitespace-nowrap">
                  {currentCardIndex + 1} / {reviewCards.length}
                </span>
              </div>
            </div>

            {/* Flip Card */}
            <div className="perspective-1000 min-h-[380px]">
              <div
                className={`relative w-full h-full min-h-[380px] transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front face */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-sm border border-[#e5e2e1] flex flex-col items-center justify-center p-8 text-center">
                  <span className="absolute top-6 left-6 text-[12px] font-extrabold uppercase tracking-wider text-[#274ed5] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Savol
                  </span>

                  <h2 className="text-3xl md:text-4xl font-black text-[#1c1b1b] mb-3">
                    {currentCard.front || currentCard.question || currentCard.word}
                  </h2>




                  <div className="absolute bottom-6 flex flex-col items-center text-[#747686] text-[12px] font-semibold gap-1">
                    <span className="material-symbols-outlined text-[20px] text-[#274ed5] animate-bounce">touch_app</span>
                    <span>Javobni ko'rish uchun bosing</span>
                  </div>
                </div>

                {/* Back face */}
                <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-[#fcf9f8] to-[#f4f7ff] rounded-3xl shadow-sm border border-[#274ed5]/30 flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                  <span className="absolute top-6 left-6 text-[12px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Javob
                  </span>

                  {/* Word (front) shown small on top for reference */}
                  <p className="text-[13px] text-[#747686] font-semibold mb-1">
                    {currentCard.front || currentCard.word}
                  </p>

                  <h2 className="text-2xl md:text-3xl font-black text-[#274ed5] mb-4">
                    {currentCard.back || currentCard.answer || currentCard.translation}
                  </h2>

                  {(currentCard.example || currentCard.example_sentence) && (
                    <div className="bg-white p-4 rounded-2xl max-w-lg text-left w-full border border-[#e5e2e1] mb-3">
                      <p className="text-[#1c1b1b] italic text-[14px]">
                        "{currentCard.example || currentCard.example_sentence}"
                      </p>
                    </div>
                  )}

                  {/* Translation detail button on back face */}
                  {!showTranslation ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowTranslation(true); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-[#274ed5] border border-[#274ed5]/20 text-[12px] font-bold cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      So'zni batafsil ko'rish
                    </button>
                  ) : (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col items-center gap-0.5 bg-white px-5 py-2 rounded-2xl border border-[#274ed5]/20"
                    >
                      <span className="text-[11px] text-[#747686] font-semibold uppercase tracking-wide">To'liq ma'no</span>
                      <span className="text-[15px] font-black text-[#274ed5]">
                        {currentCard.back || currentCard.answer || currentCard.translation}
                      </span>
                      {currentCard.hint && (
                        <span className="text-[12px] text-[#747686] mt-1">{currentCard.hint}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quality rating buttons — shown only after flip */}
            <div
              className={`relative z-10 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center text-[13px] font-bold text-[#747686] mb-3">{t("Qanchalik yaxshi esladingiz?")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Bilmayman", q: 1, bg: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
                  { label: "Qiyin", q: 2, bg: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
                  { label: "O'rtacha", q: 3, bg: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                  { label: "Oson", q: 4, bg: "bg-blue-50 text-[#274ed5] border-blue-200 hover:bg-blue-100" },
                  { label: "Juda oson", q: 5, bg: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", extra: "sm:col-span-1 col-span-2" },
                ].map(({ label, q, bg, extra = "" }) => (
                  <button
                    key={q}
                    disabled={submitAnswerMutation.isPending}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleAnswer(q); }}
                    className={`py-3 rounded-xl border font-bold text-[13px] transition-all cursor-pointer ${bg} ${extra} ${submitAnswerMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    {label} ({q})
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Review Summary */}
        {activeDeck && reviewSummary && (
          <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-3xl border border-[#e5e2e1] shadow-xs mt-6 p-8">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <span className="material-symbols-outlined text-[40px]">task_alt</span>
            </div>
            <h2 className="text-[24px] font-extrabold text-[#1c1b1b] mb-2">{t("Ajoyib natija!")}</h2>
            <p className="text-[#747686] text-[15px] mb-6">
              {t("Siz bugungi {{total}} ta kartochkani muvaffaqiyatli takrorladingiz.", { total: reviewSummary.total })}
            </p>
            <button 
              onClick={() => {setActiveDeck(null); setReviewCards([]); queryClient.invalidateQueries(['flashcardDecks']);}}
              className="px-8 py-3 rounded-2xl bg-[#274ed5] text-white font-bold text-[14px] hover:bg-[#1f42ba] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              {t("Asosiy menyuga qaytish")}
            </button>
          </div>
        )}

        {/* Create Deck Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1b1b]/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#e5e2e1]">
              <div className="p-6 border-b border-[#e5e2e1] flex justify-between items-center bg-[#fcf9f8]">
                <h3 className="text-[18px] font-bold text-[#1c1b1b] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#274ed5]">auto_awesome</span>
                  {t("AI bilan to'plam yaratish")}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white border border-[#e5e2e1] text-[#747686] hover:text-[#1c1b1b] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              
              <form onSubmit={handleGenerate} className="p-6 space-y-5">
                {!isPro && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
                      Haftalik qo'lda yaratish limiti:
                    </span>
                    <span className="font-extrabold text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                      {remainingWeeklyCreations}/3 ta qoldi
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-bold text-[#1c1b1b] mb-2">{t("Imtihon turi")}</label>
                  <select 
                    disabled={!isPro}
                    className="w-full rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] px-4 py-3 text-[14px] font-medium text-[#1c1b1b] focus:outline-none focus:border-[#274ed5] disabled:opacity-75 disabled:cursor-not-allowed"
                    value={formData.examType}
                    onChange={(e) => setFormData({...formData, examType: e.target.value})}
                  >
                    {isPro ? (
                      <>
                        <option value="IELTS">IELTS</option>
                        <option value="SAT">SAT</option>
                        <option value="Umumiy">Umumiy</option>
                      </>
                    ) : (
                      <option value={selectedExamType || 'IELTS'}>
                        {selectedExamType || 'IELTS'} (Aktiv yo'nalish)
                      </option>
                    )}
                  </select>
                  {!isPro && (
                    <p className="text-[11px] text-[#747686] mt-1 font-medium">
                      * Bepul tarifda faqat o'zingiz ishlayotgan yo'nalish bo'yicha to'plam yaratishingiz mumkin.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1c1b1b] mb-2">{t("Mavzu")}</label>
                  <input 
                    type="text" 
                    placeholder="Masalan: Atrof-muhit, Algebra, Biologiya..." 
                    className="w-full rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] px-4 py-3 text-[14px] font-medium text-[#1c1b1b] focus:outline-none focus:border-[#274ed5]"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1c1b1b] mb-2">{t("Kartochka turi")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Lug'at", "Formula", "Fakt", "Grammatika"].map(type => (
                      <div 
                        key={type}
                        onClick={() => setFormData({...formData, deckType: type})}
                        className={`px-4 py-3 border rounded-2xl cursor-pointer text-center text-[13px] font-bold transition-all ${
                          formData.deckType === type 
                            ? 'border-[#274ed5] bg-[#f0f4ff] text-[#274ed5]' 
                            : 'border-[#e5e2e1] bg-[#fcf9f8] text-[#747686] hover:text-[#1c1b1b]'
                        }`}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2 text-[13px] font-bold text-[#1c1b1b]">
                    <label>{t("Kartochkalar soni")}</label>
                    <span className="text-[#274ed5]">{formData.count} ta</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" max="20" step="1"
                    className="w-full accent-[#274ed5]"
                    value={formData.count}
                    onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})}
                  />
                  <div className="flex justify-between text-[11px] text-[#747686] mt-1 font-bold">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={generateDeckMutation.isPending || !formData.topic || (!isPro && remainingWeeklyCreations === 0)}
                    className="w-full py-3.5 px-4 bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white rounded-2xl font-bold text-[14px] shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generateDeckMutation.isPending ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                        <span>{t("Yaratilmoqda...")}</span>
                      </>
                    ) : (!isPro && remainingWeeklyCreations === 0) ? (
                      <span>Haftalik Limit Tugagan (3/3)</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                        <span>{t("AI Yordamida Yaratish")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      
      {/* 3D Transform styles for flip animation */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </>
  );
};

export default KnowzaAIFlashCards;
