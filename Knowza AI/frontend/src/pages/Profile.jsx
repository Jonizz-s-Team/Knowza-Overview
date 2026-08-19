import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoalEditModal from '../../components/GoalEditModal';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import ProUpgradeModal from '../../components/ProUpgradeModal';
import Seo from '../../components/Seo';
import { ProfileSkeleton } from '../../components/Skeletons';
import CustomDatePicker from '../../components/CustomDatePicker';
import dayjs from 'dayjs';

import ProfileGoalsSection from '../../components/ProfileGoalsSection';
import apiService from '../../data/apiService';
import ReceiptModal from '../../components/ReceiptModal';
// Countdown Timer Helper
const getRemainingTime = (deadline) => {
  if (!deadline) return null;
  const total = Date.parse(deadline) - Date.parse(new Date());
  if (total <= 0) return t("Muddat tugagan");
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  
  if (days > 0) return `${days} ${t("kun")}, ${hours} ${t("soat qoldi")}`;
  return `${hours} ${t("soat")}, ${minutes} ${t("daqiqa qoldi")}`;
};

const KnowzaAIProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, updateProfile, refreshProfile } = useAuth();
  const { setGlobalLoading } = useLoading();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    currentLevel: '',
    goals: [],
    studentType: "Maktab o'quvchisi",
    studentDetail: '',
    studyDays: [],
    studyHoursPerDay: '',
    interests: [],
    favoriteSocialMedia: [],
    aiPersona: '',
    bio: '',
    isAiPersonalized: true,
    isMemoryEnabled: false,
    aiMemorySummary: ''
  });
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const [showProModal, setShowProModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const isProUser = useMemo(() => {
    return Boolean(currentUser?.is_pro || currentUser?.is_premium || currentUser?.tariff === 'pro' || currentUser?.plan === 'pro');
  }, [currentUser]);

  const { data: premiumPurchasesResponse, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['premiumPurchases'],
    queryFn: () => apiService.getPremiumPurchases(),
    enabled: !!currentUser,
  });
  
  const purchases = premiumPurchasesResponse?.results || [];

  const { data: diagnosticStatus } = useQuery({
    queryKey: ['userDiagnosticStatusAll'],
    queryFn: async () => {
      const results = {};
      try {
        const ieltsRes = await apiService.getDiagnosticResult('ielts');
        if (ieltsRes?.success && ieltsRes.data) {
          results.IELTS = ieltsRes.data;
        }
      } catch (e) {}
      try {
        const satRes = await apiService.getDiagnosticResult('sat');
        if (satRes?.success && satRes.data) {
          results.SAT = satRes.data;
        }
      } catch (e) {}
      try {
        const msRes = await apiService.getDiagnosticResult('ms');
        if (msRes?.success && msRes.data) {
          results.MS = msRes.data;
        }
      } catch (e) {}
      return results;
    },
    enabled: !!currentUser,
  });
  
  const predefinedDirections = [
    "IELTS",
    "SAT",
    "DTM (O'zbekiston OTMlari uchun)",
    "CEFR (Ingliz tili)",
    "TOEFL iBT",
    "Milliy Sertifikat (Matematika, Ona tili va h.k)",
    "Xorijiy universitetlarga grant yutish",
    "Dasturlash (Frontend, Backend, AI)",
    "Maktab fanlarini o'zlashtirish",
    "Olimpiadalarga tayyorgarlik",
    "Rus tili (TRKI va boshqalar)",
    "Koreys tili (TOPIK)",
    "GMAT / GRE",
    "O'zingizning variantingiz"
  ];

  const predefinedInterests = [
    "Dasturlash", "Sun'iy intellekt", "Koinot", "Fizika", "Matematika", "Tarix", 
    "Psixologiya", "Biznes", "Startaplar", "Moliya", "Kriptovalyuta", "Marketing",
    "Dizayn", "San'at", "Rasm chizish", "Musiqa", "Kino va seriallar", "Kitob o'qish",
    "Sayohat", "Sport", "Futbol", "Shaxmat", "E-sport", "O'yinlar (Gaming)", 
    "Sog'lom turmush tarzi", "Fitness", "Tibbiyot", "Biologiya", "Kimyo", "Robototexnika",
    "Avtomobillar", "Arxitektura", "Tabiat", "Ekologiya", "Siyosat", "Iqtisodiyot",
    "Falsafa", "Chet tillari", "Ingliz tili", "Koreys tili", "Yapon tili", "Arab tili",
    "Pazandachilik", "Moda", "Kreativ yozish", "Blogerlik", "Video montaj", "3D modellashtirish",
    "Animatsiya", "Animelar"
  ];

  const predefinedSocialMedia = [
    "Telegram", "Instagram", "YouTube", "TikTok", "Discord", "Twitter (X)", "Facebook", "LinkedIn", "Pinterest", "Snapchat", "Twitch"
  ];

  const predefinedPersonas = [
    { id: 'qattiqqol', label: 'Qattiqqo\'l', icon: 'gavel', desc: 'Talabchan va qattiq intizomga asoslangan holda dars o\'tadi' },
    { id: 'dostona', label: 'Do\'stona', icon: 'handshake', desc: 'O\'rtoqdek gaplashadi va qiyinchiliklarni tushunishga harakat qiladi' },
    { id: 'motivator', label: 'Motivator', icon: 'local_fire_department', desc: 'Sizni doimiy ruhlantirib, yangi marralarga olg\'a intilishga undaydi' },
    { id: 'hazilkash', label: 'Hazilkash', icon: 'sentiment_very_satisfied', desc: 'Mavzularni zeriktirmasdan, kulgili va qiziqarli tarzda tushuntiradi' },
    { id: 'faylasuf', label: 'Faylasuf', icon: 'psychology_alt', desc: 'Mavzularga chuqur ma\'noli va keng mulohazali yondashuv bilan qaraydi' },
    { id: 'jiddiy', label: 'Jiddiy O\'qituvchi', icon: 'school', desc: 'Darslarni rasmiy, aniq va to\'liq professional uslubda olib boradi' }
  ];

  const revertFormData = () => {
    if (!currentUser) return;
    let sType = "Maktab o'quvchisi";
    let sDetail = currentUser.class_group || '';
    
    if (currentUser.class_group && currentUser.class_group.includes('|')) {
      const parts = currentUser.class_group.split('|');
      sType = parts[0].trim();
      sDetail = parts[1].trim();
    } else if (currentUser.class_group) {
      if (currentUser.age && currentUser.age >= 18) {
         sType = currentUser.age <= 24 ? "Talaba" : "Boshqa";
      }
    }

    setFormData({
      firstName: currentUser.first_name || '',
      lastName: currentUser.last_name || '',
      email: currentUser.email || '',
      age: currentUser.age || '',
      currentLevel: currentUser.current_level || "O'rta (Intermediate)",
      goals: Array.isArray(currentUser.target_goals) ? currentUser.target_goals.map(g => {
        if (typeof g === 'string') return { type: 'study_goal', title: g };
        if (!g.type) {
           return { ...g, type: 'certificate' }; // Backward compatibility
        }
        return g;
      }) : [],
      studentType: sType,
      studentDetail: sDetail,
      studyDays: Array.isArray(currentUser.study_days) ? currentUser.study_days : [],
      studyHoursPerDay: currentUser.study_hours_per_day || '',
      interests: Array.isArray(currentUser.interests) ? currentUser.interests : [],
      favoriteSocialMedia: Array.isArray(currentUser.favorite_social_media) ? currentUser.favorite_social_media : [],
      aiPersona: currentUser.ai_persona || '',
      bio: currentUser.bio || '',
      isAiPersonalized: currentUser?.is_ai_personalized !== undefined ? currentUser.is_ai_personalized : true,
      isMemoryEnabled: currentUser?.is_memory_enabled !== undefined ? currentUser.is_memory_enabled : false,
      aiMemorySummary: currentUser?.ai_memory_summary || ''
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCancel = () => {
    revertFormData();
    setIsEditing(false);
  };

  useEffect(() => {
    // Update countdown timer every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isEditing) {
      revertFormData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isEditing]);

  const handleAgeChange = (e) => {
    const newAge = e.target.value;
    let newType = formData.studentType;
    
    if (newAge) {
      const ageNum = parseInt(newAge, 10);
      if (ageNum > 0 && ageNum < 18) newType = "Maktab o'quvchisi";
      else if (ageNum >= 18 && ageNum <= 24) newType = "Talaba";
      else if (ageNum > 24) newType = "Boshqa";
    }
    
    setFormData({...formData, age: newAge, studentType: newType});
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const classGroupStr = formData.studentDetail ? `${formData.studentType} | ${formData.studentDetail}` : formData.studentType;
      
      let currentGoals = [...(formData.goals || [])];
      
      setFormData(prev => ({ ...prev, goals: currentGoals }));
      
      const studyDaysArr = Array.isArray(formData.studyDays) ? formData.studyDays : [];
      const interestsArr = Array.isArray(formData.interests) ? formData.interests : [];
      const socialMediaArr = Array.isArray(formData.favoriteSocialMedia) ? formData.favoriteSocialMedia : [];

      let updates;
      if (photoFile) {
        updates = new FormData();
        updates.append('first_name', formData.firstName || '');
        updates.append('last_name', formData.lastName || '');
        if (formData.age) updates.append('age', formData.age);
        updates.append('current_level', formData.currentLevel || '');
        updates.append('target_goals', JSON.stringify(currentGoals));
        updates.append('class_group', classGroupStr);
        updates.append('study_days', JSON.stringify(studyDaysArr));
        if (formData.studyHoursPerDay) updates.append('study_hours_per_day', parseFloat(formData.studyHoursPerDay));
        updates.append('interests', JSON.stringify(interestsArr));
        updates.append('favorite_social_media', JSON.stringify(socialMediaArr));
        updates.append('ai_persona', formData.aiPersona || '');
        updates.append('bio', formData.bio || '');
        updates.append('profile_photo', photoFile);
      } else {
        updates = {
          first_name: formData.firstName || '',
          last_name: formData.lastName || '',
          age: formData.age ? parseInt(formData.age, 10) : null,
          current_level: formData.currentLevel || '',
          target_goals: currentGoals,
          class_group: classGroupStr,
          study_days: studyDaysArr,
          study_hours_per_day: formData.studyHoursPerDay ? parseFloat(formData.studyHoursPerDay) : null,
          interests: interestsArr,
          favorite_social_media: socialMediaArr,
          ai_persona: formData.aiPersona || '',
          bio: formData.bio || ''
        };
      }
      
      await updateProfile(updates);
      await refreshProfile();
      
      setIsEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      const detail = error?.response?.data ? (typeof error.response.data === 'object' ? (error.response.data.detail || JSON.stringify(error.response.data)) : error.response.data) : error?.message;
      alert(`${t("Ma'lumotlarni saqlashda xatolik yuz berdi!")}${detail ? `: ${detail}` : ''}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAiSetting = async (field, value) => {
    if (!isProUser) {
      setShowProModal(true);
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    try {
      const backendField = field === 'isAiPersonalized' ? 'is_ai_personalized' : 'is_memory_enabled';
      await updateProfile({ [backendField]: value });
      await refreshProfile();
    } catch (err) {
      console.error("Error toggling AI setting:", err);
      setFormData(prev => ({ ...prev, [field]: !value })); // revert
    }
  };

  const handleOpenMemoryModal = () => {
    if (!isProUser) {
      setShowProModal(true);
      return;
    }
    setShowMemoryModal(true);
  };

  const handleSaveMemory = async () => {
    try {
      setIsSaving(true);
      await updateProfile({ ai_memory_summary: formData.aiMemorySummary });
      await refreshProfile();
      setShowMemoryModal(false);
    } catch (error) {
      console.error("Error saving memory:", error);
      alert(t("Xotirani saqlashda xatolik yuz berdi!"));
    } finally {
      setIsSaving(false);
    }
  };

  const SOCIAL_ICONS = {
    Telegram: {
      color: '#0088cc',
      bg: '#e6f4fb',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.07 9.77c-.15.68-.56.84-1.13.53l-3.15-2.32-1.52 1.46c-.17.17-.31.31-.64.31l.23-3.22 5.86-5.3c.25-.23-.05-.35-.39-.13l-7.25 4.56-3.12-.97c-.68-.21-.69-.68.14-1l12.21-4.71c.56-.21 1.06.14.88.98z"/>
        </svg>
      )
    },
    Instagram: {
      color: '#e1306c',
      bg: '#fcebf2',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    YouTube: {
      color: '#ff0000',
      bg: '#ffe6e6',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    LinkedIn: {
      color: '#0a66c2',
      bg: '#e6f0fa',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    "Twitter (X)": {
      color: '#000000',
      bg: '#f0f0f0',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    TikTok: {
      color: '#000000',
      bg: '#f0f0f0',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.525 0h3.08c.12 1.01.667 1.95 1.51 2.57.844.62 1.88.89 2.885.76V6.5c-1.33.02-2.61-.39-3.665-1.17-.37-.28-.7-.6-.98-.95v9.12c0 3.32-2.68 6-6 6s-6-2.68-6-6 2.68-6 6-6c.49 0 .97.06 1.43.18v3.23c-.22-.09-.46-.14-.71-.14-1.22 0-2.22 1-2.22 2.22s1 2.22 2.22 2.22 2.22-1 2.22-2.22V0z"/>
        </svg>
      )
    },
    Discord: {
      color: '#5865f2',
      bg: '#edf0ff',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )
    },
    Facebook: {
      color: '#1877f2',
      bg: '#e8f2fe',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    }
  };

  if (!currentUser) return <ProfileSkeleton />;

  return (
    <>
      <Seo 
        title="Mening Profilim | Knowza AI"
        description="Shaxsiy ma'lumotlaringizni, maqsadlaringizni va joriy o'zlashtirish darajangizni boshqaring."
        icon="/banner/Knowza-logo-mini.png"
      />
      <div className="flex flex-col gap-6 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">{t('Mening Profilim')}</h2>
            <p className="text-[14px] leading-[20px] text-[#444654]">{t("Shaxsiy ma'lumotlaringiz va o'quv maqsadlaringiz")}</p>
          </div>
          {activeTab === 'profile' && (
            isEditing ? (
              <div className="flex gap-2">
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-[#444654] font-semibold bg-[#e5e2e1] hover:bg-[#d5d2d1] transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-white font-semibold bg-[#274ed5] hover:bg-[#1f42ba] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                  Saqlash
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl text-white font-semibold bg-[#274ed5] hover:bg-[#1f42ba] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                Tahrirlash
              </button>
            )
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#e5e2e1] pb-0 mb-2">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-2 font-semibold transition-colors relative ${activeTab === 'profile' ? 'text-[#274ed5]' : 'text-[#747686] hover:text-[#1c1b1b]'}`}
        >
          Umumiy
          {activeTab === 'profile' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#274ed5] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-2 font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'settings' ? 'text-[#274ed5]' : 'text-[#747686] hover:text-[#1c1b1b]'}`}
        >
          Sozlamalar
          {activeTab === 'settings' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#274ed5] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('yonalish')}
          className={`pb-3 px-2 font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'yonalish' ? 'text-[#274ed5]' : 'text-[#747686] hover:text-[#1c1b1b]'}`}
        >
          Yo'nalish
          {activeTab === 'yonalish' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#274ed5] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('tarif')}
          className={`pb-3 px-2 font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'tarif' ? 'text-[#274ed5]' : 'text-[#747686] hover:text-[#1c1b1b]'}`}
        >
          Ta'rif
          {activeTab === 'tarif' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#274ed5] rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'profile' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {isSaving ? (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] flex flex-col items-center text-center animate-pulse">
              <div className="w-32 h-32 rounded-full bg-[#fcf9f8] mb-6 border-4 border-[#e8edff]"></div>
              <div className="h-8 bg-[#fcf9f8] rounded-xl w-3/4 mb-2"></div>
              <div className="h-4 bg-[#fcf9f8] rounded-xl w-1/2 mb-6"></div>
              <div className="h-12 bg-[#fcf9f8] rounded-xl w-full"></div>
            </div>
          ) : (
          <div className="bg-white rounded-3xl border border-[#e5e2e1] overflow-hidden shadow-xs flex flex-col items-center text-center">
            {/* Live Animated Cover Banner */}
            <div className="w-full h-32 relative overflow-hidden live-banner-bg">
              <style>{`
                @keyframes liveBannerShift {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes floatOrb1 {
                  0%, 100% { transform: translate(0px, 0px) scale(1); }
                  50% { transform: translate(15px, -10px) scale(1.15); }
                }
                @keyframes floatOrb2 {
                  0%, 100% { transform: translate(0px, 0px) scale(1); }
                  50% { transform: translate(-12px, 8px) scale(1.1); }
                }
                .live-banner-bg {
                  background: linear-gradient(-45deg, #162f8a, #1f42ba, #274ed5, #4f75ff, #38bdf8);
                  background-size: 300% 300%;
                  animation: liveBannerShift 9s ease infinite;
                }
                .live-orb-1 {
                  animation: floatOrb1 7s ease-in-out infinite;
                }
                .live-orb-2 {
                  animation: floatOrb2 5s ease-in-out infinite;
                }
              `}</style>
              {/* Floating ambient glow lights */}
              <div className="absolute -right-6 -top-6 w-36 h-36 bg-cyan-300/30 rounded-full blur-2xl pointer-events-none live-orb-1"></div>
              <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-indigo-300/30 rounded-full blur-xl pointer-events-none live-orb-2"></div>
            </div>

            {/* Avatar Section */}
            <div className="relative -mt-16 mb-4 px-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#1c1b1b] shadow-none bg-white flex items-center justify-center relative mx-auto">
                {photoPreview || currentUser.profile_photo_url ? (
                  <img src={photoPreview || currentUser.profile_photo_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[44px] font-black text-[#274ed5]">
                    {formData.firstName?.[0] || 'A'}
                  </span>
                )}
                
                {isEditing && (
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity z-10">
                    <span className="material-symbols-outlined text-white text-[28px]">photo_camera</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-2 bg-white rounded-full w-9 h-9 flex items-center justify-center border border-[#e5e2e1] shadow-md cursor-pointer pointer-events-none z-20">
                  <span className="material-symbols-outlined text-[#274ed5] text-[18px]">edit</span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="px-6 pb-6 w-full flex flex-col items-center">
              <h3 className="text-[24px] font-extrabold text-[#1c1b1b] mb-0.5">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-[#747686] text-[14px] mb-6">{currentUser.email}</p>
              
              <div className="flex items-center gap-2.5 justify-center bg-[#fcf9f8] px-4 py-3 rounded-2xl w-full border border-[#e5e2e1]">
                <span className="material-symbols-outlined text-[#274ed5] shrink-0">school</span>
                <span className="font-bold text-[#1c1b1b] text-[14px] truncate" title={`${formData.studentType} ${formData.studentDetail ? `(${formData.studentDetail})` : ''}`}>
                  {formData.studentType} {formData.studentDetail ? `(${formData.studentDetail})` : ''}
                </span>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Right Column: Details & Goals */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {isSaving ? (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] animate-pulse">
              <div className="h-6 bg-[#fcf9f8] rounded-xl w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-[#fcf9f8] rounded-xl w-1/3 mb-2"></div>
                    <div className="h-12 bg-[#fcf9f8] rounded-xl w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <>
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1]">
            <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-6">{t("Asosiy ma'lumotlar")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-[#747686] text-[13px] font-medium mb-1">{t('Ism')}</p>
                {isEditing ? (
                  <input 
                    type="text"
                    maxLength={30}
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full p-3 rounded-xl bg-[#f0f2f5] border-none focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:outline-none transition-all text-[#1c1b1b] font-medium"
                  />
                ) : (
                  <p className="text-[#1c1b1b] font-semibold text-[16px] px-3 py-3 bg-[#fcf9f8] rounded-xl">{formData.firstName || 'Belgilanmagan'}</p>
                )}
              </div>
              <div>
                <p className="text-[#747686] text-[13px] font-medium mb-1">{t('Familiya')}</p>
                {isEditing ? (
                  <input 
                    type="text"
                    maxLength={30}
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full p-3 rounded-xl bg-[#f0f2f5] border-none focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:outline-none transition-all text-[#1c1b1b] font-medium"
                  />
                ) : (
                  <p className="text-[#1c1b1b] font-semibold text-[16px] px-3 py-3 bg-[#fcf9f8] rounded-xl">{formData.lastName || 'Belgilanmagan'}</p>
                )}
              </div>
              <div>
                <p className="text-[#747686] text-[13px] font-medium mb-1">{t('Elektron pochta')}</p>
                <p className="text-[#1c1b1b] font-semibold text-[16px] truncate max-w-full px-3 py-3 bg-[#fcf9f8] rounded-xl" title={currentUser.email}>{currentUser.email}</p>
              </div>
              <div>
                <p className="text-[#747686] text-[13px] font-medium mb-1">{t('Yosh')}</p>
                {isEditing ? (
                  <input 
                    type="number"
                    min={1}
                    max={120}
                    maxLength={3}
                    value={formData.age}
                    onChange={handleAgeChange}
                    onInput={(e) => {
                      if (e.target.value.length > 3) e.target.value = e.target.value.slice(0, 3);
                    }}
                    placeholder="16"
                    className="w-full p-3 rounded-xl bg-[#f0f2f5] border-none focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:outline-none transition-all text-[#1c1b1b] font-medium"
                  />
                ) : (
                  <p className="text-[#1c1b1b] font-semibold text-[16px] px-3 py-3 bg-[#fcf9f8] rounded-xl">{formData.age ? `${formData.age} yosh` : 'Belgilanmagan'}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <p className="text-[#747686] text-[13px] font-medium mb-1">{t("Holati va sinfi/kursi")}</p>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-1/3">
                      <select
                        value={formData.studentType}
                        onChange={(e) => setFormData({...formData, studentType: e.target.value})}
                        className="w-full p-3 rounded-xl bg-[#f0f2f5] border-none focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:outline-none transition-all text-[#1c1b1b] font-medium appearance-none cursor-pointer"
                      >
                        <option value="Maktab o'quvchisi">{t("Maktab o'quvchisi")}</option>
                        <option value="Talaba">{t("Talaba")}</option>
                        <option value="Boshqa">{t("Boshqa")}</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none">expand_more</span>
                    </div>
                    <input 
                      type="text"
                      maxLength={40}
                      value={formData.studentDetail}
                      onChange={(e) => setFormData({...formData, studentDetail: e.target.value})}
                      placeholder={formData.studentType === "Maktab o'quvchisi" ? t("Nechanchi sinfda o'qiysiz? (masalan, 10-sinf)") : formData.studentType === "Talaba" ? t("Nechanchi kurs / Yo'nalish? (masalan, 2-kurs)") : t("Kasbingiz yoki holatingiz")}
                      className="w-full sm:w-2/3 p-3 rounded-xl bg-[#f0f2f5] border-none focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:outline-none transition-all text-[#1c1b1b] font-medium"
                    />
                  </div>
                ) : (
                  <p className="text-[#1c1b1b] font-semibold text-[16px] px-3 py-3 bg-[#fcf9f8] rounded-xl">
                    {formData.studentType} {formData.studentDetail ? `(${formData.studentDetail})` : ''}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Interests & Social Media Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff9800]">interests</span>
                Qiziqishlar va Tarmoqlar
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Interests */}
              <div>
                <p className="text-[#747686] text-[13px] font-bold uppercase tracking-wider mb-3">{t("Sizning qiziqishlaringiz")}</p>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 max-h-[260px] overflow-y-auto p-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl custom-scrollbar">
                    {predefinedInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => {
                          const ints = formData.interests.includes(interest)
                            ? formData.interests.filter(i => i !== interest)
                            : [...formData.interests, interest];
                          setFormData({ ...formData, interests: ints });
                        }}
                        className={`px-3.5 py-1.5 rounded-xl border text-[13px] font-bold transition-all ${
                          formData.interests.includes(interest) 
                            ? 'border-[#274ed5] bg-[#e8edff] text-[#274ed5] shadow-xs scale-[1.02]' 
                            : 'border-[#e5e2e1] bg-white text-[#444654] hover:border-[#274ed5]/40'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.interests && formData.interests.length > 0 ? (
                      formData.interests.map(i => (
                        <span key={i} className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#f0f4ff] to-[#f8f9ff] text-[#274ed5] border border-[#274ed5]/15 text-[13px] font-bold shadow-xs">
                          #{i}
                        </span>
                      ))
                    ) : (
                      <p className="text-[#1c1b1b] font-semibold text-[15px]">{t('Belgilanmagan')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Social Media Brands */}
              <div>
                <p className="text-[#747686] text-[13px] font-bold uppercase tracking-wider mb-3">{t("Sevimli ijtimoiy tarmoqlar")}</p>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {predefinedSocialMedia.map(social => (
                      <button
                        key={social}
                        onClick={() => {
                          const socs = formData.favoriteSocialMedia.includes(social)
                            ? formData.favoriteSocialMedia.filter(s => s !== social)
                            : [...formData.favoriteSocialMedia, social];
                          setFormData({ ...formData, favoriteSocialMedia: socs });
                        }}
                        className={`px-3.5 py-2 rounded-xl border text-[13px] font-bold transition-all flex items-center gap-2 ${
                          formData.favoriteSocialMedia.includes(social) 
                            ? 'border-[#274ed5] bg-[#e8edff] text-[#274ed5] shadow-xs' 
                            : 'border-[#e5e2e1] bg-[#f0f2f5] text-[#444654] hover:border-[#274ed5]/40'
                        }`}
                      >
                        {SOCIAL_ICONS[social] ? SOCIAL_ICONS[social].icon : null}
                        {social}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {formData.favoriteSocialMedia && formData.favoriteSocialMedia.length > 0 ? (
                      formData.favoriteSocialMedia.map(s => {
                        const brand = SOCIAL_ICONS[s];
                        return (
                          <span 
                            key={s} 
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all border border-black/5 shadow-xs"
                            style={{
                              backgroundColor: brand ? brand.bg : '#e8edff',
                              color: brand ? brand.color : '#274ed5'
                            }}
                          >
                            {brand ? brand.icon : null}
                            {s}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-[#1c1b1b] font-semibold text-[15px]">{t('Belgilanmagan')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Persona Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">psychology</span>
                AI Xarakteri va Bio
              </h3>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[#747686] text-[13px] font-bold uppercase tracking-wider mb-3">{t("Sizga qanday AI o'qituvchi yoqadi?")}</p>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {predefinedPersonas.map(persona => {
                      const isSelected = formData.aiPersona === persona.id;
                      return (
                        <button
                          key={persona.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, aiPersona: persona.id })}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                            isSelected 
                              ? 'border-2 border-[#274ed5] bg-[#f0f4ff] shadow-sm' 
                              : 'border-[#e5e2e1] bg-white hover:border-[#274ed5]/40 hover:bg-[#fcf9f8]'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${isSelected ? 'bg-[#274ed5] text-white' : 'bg-[#f0f2f5] text-[#444654]'}`}>
                            <span className="material-symbols-outlined text-[22px]">
                              {persona.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className={`font-extrabold text-[14px] truncate ${isSelected ? 'text-[#274ed5]' : 'text-[#1c1b1b]'}`}>
                                {persona.label}
                              </h4>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[#274ed5] text-[18px] shrink-0">check_circle</span>
                              )}
                            </div>
                            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isSelected ? 'text-[#274ed5]/90 font-medium' : 'text-[#747686]'}`}>
                              {persona.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {formData.aiPersona ? (
                      (() => {
                        const persona = predefinedPersonas.find(p => p.id === formData.aiPersona);
                        if (!persona) return <p className="text-[#1c1b1b] font-semibold text-[16px]">{formData.aiPersona}</p>;
                        return (
                          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#e8edff] to-[#f4f7ff] text-[#274ed5] border border-[#274ed5]/30 shadow-xs">
                            <div className="w-10 h-10 rounded-xl bg-[#274ed5] text-white flex items-center justify-center shrink-0 shadow-xs">
                              <span className="material-symbols-outlined text-[22px]">{persona.icon}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-[15px]">{persona.label}</p>
                                <span className="px-2 py-0.5 rounded-full bg-[#274ed5] text-white text-[10px] font-bold">Faol</span>
                              </div>
                              <p className="text-[12px] opacity-90 font-medium">{persona.desc}</p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-[#1c1b1b] font-semibold text-[15px]">{t('Belgilanmagan')}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[#747686] text-[13px] font-bold uppercase tracking-wider">{t("O'zingiz haqingizda (Bio)")}</p>
                  {isEditing && (
                    <span className={`text-[12px] font-semibold ${formData.bio.length > 300 ? 'text-red-500' : 'text-[#747686]'}`}>
                      {formData.bio.length}/300
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value.substring(0, 300)})}
                    placeholder={t("Masalan: Men aniq fanlarga qiziqaman va kelajakda dasturchi bo'lmoqchiman...")}
                    className="w-full p-4 rounded-xl bg-[#f0f2f5] border-none focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:outline-none transition-all text-[#1c1b1b] font-medium resize-none"
                    rows="3"
                  />
                ) : (
                  <p className="text-[#1c1b1b] text-[15px] font-medium leading-relaxed bg-[#f0f2f5] p-4 rounded-xl">
                    {formData.bio || 'Belgilanmagan'}
                  </p>
                )}
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6 w-full animate-fade-in mx-auto">
          {/* AI Personalization Toggle */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e2e1] flex items-center justify-between relative overflow-hidden">
            <div className="pr-4">
              <h3 className="text-[18px] font-bold text-[#1c1b1b] mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">psychology_alt</span>
                AI Personalizatsiyasi
                {!isProUser && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Pro Tarif
                  </span>
                )}
              </h3>
              <p className="text-[14px] text-[#747686]">
                AI tizimi sizni o'rganib chiqib shaxsiy ma'lumotlaringiz asosida yondashishini yoqish yoki o'chirish.
              </p>
            </div>
            <div 
              onClick={() => {
                if (!isProUser) setShowProModal(true);
              }}
              className="relative z-10 shrink-0"
            >
              <label className={`inline-flex items-center ${!isProUser ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isProUser ? formData.isAiPersonalized : false}
                  disabled={!isProUser}
                  onChange={(e) => handleToggleAiSetting('isAiPersonalized', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274ed5]"></div>
              </label>
            </div>
          </div>

          {/* AI Memory Toggle */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e2e1] flex items-center justify-between relative overflow-hidden">
            <div className="pr-4">
              <h3 className="text-[18px] font-bold text-[#1c1b1b] mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">memory</span>
                AI Xotirasi (Ma'lumot yig'ish)
                {!isProUser && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Pro Tarif
                  </span>
                )}
              </h3>
              <p className="text-[14px] text-[#747686]">
                AI siz bilan suhbatlashganda siz haqingizda muhim ma'lumotlarni eslab qolishiga ruxsat berish.
              </p>
            </div>
            <div 
              onClick={() => {
                if (!isProUser) setShowProModal(true);
              }}
              className="relative z-10 shrink-0"
            >
              <label className={`inline-flex items-center ${!isProUser ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isProUser ? formData.isMemoryEnabled : false}
                  disabled={!isProUser}
                  onChange={(e) => handleToggleAiSetting('isMemoryEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274ed5]"></div>
              </label>
            </div>
          </div>

          {/* AI Memory Summary Viewer */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e2e1] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="pr-4">
              <h2 className="text-[18px] font-bold text-[#1c1b1b] mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">edit_note</span>
                AI Xotirasi (Siz haqingizda nimalarni biladi?)
                {!isProUser && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Pro Tarif
                  </span>
                )}
              </h2>
              <p className="text-[14px] text-[#747686]">
                AI yig'gan xotira xulosasini ko'rish va tahrirlash.
              </p>
            </div>
            <button 
              onClick={handleOpenMemoryModal}
              className={`relative z-10 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
                isProUser 
                  ? 'text-[#274ed5] bg-[#f0f4ff] hover:bg-[#d1dcff]' 
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isProUser ? 'edit' : 'lock'}
              </span>
              {isProUser ? 'Tahrirlash' : 'Pro ga o\'tish'}
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-[12px] text-[#747686] max-w-2xl mx-auto leading-relaxed">
              <strong>Eslatma:</strong> Agar tumblerlar o'chiq holatda bo'lsa ham, AI sizni ozroq bo'lsa ham tushunishi uchun juda qisqacha ma'lumot (ismingiz, darajangiz kabi ochiq ma'lumotlar) ishlatilishi mumkin. Bu ma'lumotlar to'liq xavfsiz va maxfiylik qonun-qoidalariga muvofiq saqlanadi. Hech qanday shaxsiy yashirin ma'lumot ruxsatingizsiz to'planmaydi.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'yonalish' && (
        <div className="flex flex-col gap-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e5e2e1] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#1c1b1b]">
                  Ta'lim Yo'nalishlari va Diagnostik Test Natijalari
                </h3>
                <p className="text-xs md:text-sm text-[#747686] mt-1 font-medium">
                  Siz topshirgan diagnostika testlari, olingan ballar va aktiv ta'lim yo'nalishlaringiz.
                </p>
              </div>
            </div>

            {/* PRO Multi-Track Notice Banner */}
            {!isProUser && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">workspace_premium</span>
                <div className="text-xs leading-relaxed font-medium">
                  <strong className="font-bold text-amber-900 block mb-0.5">Barcha 3 ta yo'nalishni bir vaqtda faollashtirish:</strong>
                  Hozirgi bepul (FREE) tarifingizda 1 ta yo'nalish bo'yicha shug'ullanish faol. IELTS, SAT va Milliy Sertifikat yo'nalishlarining barchasini bir vaqtda faollashtirish va 3 tasini ham birdek olib borish uchun <strong>PRO tarif</strong> talab etiladi.
                </div>
              </div>
            )}

            {/* 3 Main Tracks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { 
                  id: 'IELTS', 
                  title: 'IELTS Academic', 
                  flag: '🇬🇧', 
                  desc: 'Ingliz tili darajasi va akademik tayyorgarlik',
                  key: 'IELTS'
                },
                { 
                  id: 'SAT', 
                  title: 'Digital SAT', 
                  flag: '🇺🇸', 
                  desc: 'Matematika hamda Reading & Writing modullari',
                  key: 'SAT'
                },
                { 
                  id: 'MS', 
                  title: 'Milliy Sertifikat', 
                  flag: '🇺🇿', 
                  desc: "O'zbekiston Milliy Sertifikat va DTM mezonlari",
                  key: 'MS'
                }
              ].map(track => {
                const testData = diagnosticStatus?.[track.key];
                const isCompleted = Boolean(testData?.completed || testData?.estimated_score);
                const score = testData?.estimated_score;
                const band = testData?.estimated_band || testData?.estimated_level;

                return (
                  <div 
                    key={track.id}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between relative ${
                      isCompleted 
                        ? 'border-blue-200 bg-blue-50/40 shadow-xs' 
                        : 'border-[#e5e2e1] bg-white hover:border-[#274ed5]/40'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-2xl">{track.flag}</span>
                        {isCompleted ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            ✓ Topshirilgan
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                            Topshirilmagan
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-[#1c1b1b] text-base mb-1">{track.title}</h4>
                      <p className="text-xs text-[#747686] mb-4 font-medium">{track.desc}</p>

                      {/* Test Result Score Section */}
                      {isCompleted ? (
                        <div className="bg-white p-3.5 rounded-xl border border-blue-100 mb-4 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#747686] font-semibold">Diagnostik Natija:</span>
                            <span className="font-extrabold text-[#274ed5] text-sm">
                              {score ? `${score}` : 'Mavjud'}
                            </span>
                          </div>
                          {band && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#747686] font-semibold">Baholash / Daraja:</span>
                              <span className="font-bold text-slate-800">{band}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 mb-4 text-xs text-slate-500 font-medium text-center">
                          Hali diagnostik test topshirilmagan.
                        </div>
                      )}
                    </div>

                    <div>
                      {isCompleted ? (
                        <button
                          onClick={() => navigate(`/knowza-ai/planner`)}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-[#274ed5] text-[#274ed5] hover:bg-blue-50"
                        >
                          <span>Natijani va Rejani ko'rish</span>
                          <span>➔</span>
                        </button>
                      ) : isProUser ? (
                        <button
                          onClick={() => navigate(`/knowza-ai/diagnostic?examType=${track.id}`)}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#274ed5] text-white hover:bg-[#1f42ba] shadow-xs"
                        >
                          <span>Testni topshirish</span>
                          <span>➔</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowProModal(true)}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white hover:opacity-95 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">stars</span>
                          <span>PRO tarifga o'tish</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tarif' && (
        <div className="flex flex-col gap-6">
          {/* Subscription & Tariff Section */}
          <div className="flex flex-col gap-6">
            {/* Current Plan */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2e1] relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-[#747686] text-[13px] font-medium mb-1">Joriy Ta'rif</p>
                <h3 className="text-[24px] font-bold text-[#1c1b1b] mb-1">
                  {currentUser?.is_premium ? "Pro Ta'rif" : "Bepul Ta'rif"}
                </h3>
                <p className="text-[14px] text-[#747686]">
                  {currentUser?.is_premium 
                    ? "Sizda barcha premium imkoniyatlar yoqilgan. Keyingi to'lov: 2026-08-19" 
                    : "Siz hozirda bepul ta'rifdasiz. Ko'proq imkoniyatlar uchun Pro ga o'ting."}
                </p>
              </div>
              {!currentUser?.is_premium ? (
                <button 
                  onClick={() => navigate('/knowza-ai/pro')}
                  className="px-6 py-3 rounded-xl text-white font-bold bg-[#274ed5] hover:bg-[#1f42ba] transition-colors flex items-center gap-2 mt-2 md:mt-0"
                >
                  <span className="material-symbols-outlined">workspace_premium</span>
                  Pro ga o'tish
                </button>
              ) : (
                <button 
                  className="px-6 py-3 rounded-xl text-[#274ed5] font-bold bg-[#e8edff] hover:bg-[#d1dcff] transition-colors flex items-center gap-2 mt-2 md:mt-0"
                >
                  Ta'rifni boshqarish
                </button>
              )}
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-[#e5e2e1] overflow-hidden">
              <div className="p-6 border-b border-[#e5e2e1]">
                <h3 className="text-[18px] font-bold text-[#1c1b1b]">To'lovlar tarixi</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fcf9f8] text-[#747686] text-[13px] uppercase">
                      <th className="p-4 font-semibold w-[25%]">{t("Ta'rif")}</th>
                      <th className="p-4 font-semibold w-[20%]">Holati</th>
                      <th className="p-4 font-semibold w-[25%]">Sanalar</th>
                      <th className="p-4 font-semibold w-[15%]">Narx</th>
                      <th className="p-4 font-semibold w-[15%]">To'lov turi</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-[#1c1b1b]">
                    {isLoadingPurchases ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-[#747686]">
                          Yuklanmoqda...
                        </td>
                      </tr>
                    ) : purchases.length > 0 ? (
                      purchases.map((purchase) => {
                        const isFree = purchase.money_spent == 0 && purchase.stars_used == 0;
                        const isExpired = purchase.status === 'expired' || purchase.status === 'refunded';
                        const amount = isFree ? "0 UZS" : (purchase.money_spent > 0 ? `${purchase.money_spent} UZS` : `${purchase.stars_used} Yulduzcha`);
                        const paymentMethod = isFree ? "-" : (purchase.purchase_type === 'stars' ? "Ichki hisob" : "Karta");
                        
                        return (
                          <tr key={purchase.id} className="border-b border-[#e5e2e1] hover:bg-[#fcf9f8] transition-colors">
                            <td className="p-4 font-bold flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-[#9e9e9e]' : 'bg-[#4CAF50]'}`}></span>
                              {purchase.plan_type_name}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-lg text-[12px] font-bold ${
                                isExpired ? 'bg-[#f0f2f5] text-[#747686]' : 'bg-[#e8f5e9] text-[#2e7d32]'
                              }`}>
                                {isExpired ? 'Tugagan' : 'Faol'}
                              </span>
                            </td>
                            <td className="p-4 text-[#747686]">
                              {dayjs(purchase.granted_date).format('DD MMM, YYYY')} <br/> 
                              <span className="text-[12px]">- {dayjs(purchase.expiry_date).format('DD MMM, YYYY')}</span>
                            </td>
                            <td className="p-4 font-semibold">{amount}</td>
                            <td className="p-4 text-[#747686]">{paymentMethod}</td>
                            <td className="p-4">
                              <button 
                                onClick={() => {
                                  setSelectedPurchase(purchase);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="text-[#274ed5] hover:text-[#1f42ba] font-semibold text-[13px] bg-[#e8edff] px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Chekni ko'rish
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-[#747686]">
                          Sizda hali to'lovlar tarixi yo'q.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-[12px] text-[#747686] max-w-3xl mx-auto leading-relaxed">
                <strong>Yuridik eslatma:</strong> "KNOWZA LMS" va "KNOWZA AI" loyihalari "KNOWZA" kompaniyasiga tegishli mustaqil ta'lim platformalari hisoblanadi. Shunga qaramay, barcha moliyaviy aylanmalar, to'lov qabullari hamda soliq hisobotlari yagona yuridik muassasa orqali amalga oshiriladi. Shu munosabat bilan, platformalardagi har qanday xizmatlar uchun taqdim etiluvchi elektron chek va kvitansiyalar bevosita "KNOWZA" kompaniyasi nomidan rasmiylashtiriladi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Memory Edit Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#1c1b1b]/60 backdrop-blur-sm" onClick={() => setShowMemoryModal(false)}></div>
          <div className="bg-white border border-[#e5e2e1] rounded-3xl p-6 md:p-8 max-w-2xl w-full relative z-10 shadow-2xl transform transition-all">
            <button 
              onClick={() => setShowMemoryModal(false)}
              className="absolute top-4 right-4 text-[#747686] hover:text-[#1c1b1b] transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#274ed5] text-[32px]">edit_note</span>
              <h2 className="text-2xl font-bold text-[#1c1b1b]">AI Xotirasi</h2>
            </div>
            <textarea
              className="w-full h-64 bg-[#fcf9f8] border border-[#c4c5d7] focus:border-[#274ed5] rounded-xl p-4 text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#274ed5] resize-none transition-all duration-300 text-[15px] leading-relaxed"
              value={formData.aiMemorySummary}
              onChange={(e) => setFormData({...formData, aiMemorySummary: e.target.value})}
              placeholder="AI siz haqingizda bilishi kerak bo'lgan ma'lumotlarni yozing..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowMemoryModal(false)}
                className="px-6 py-2.5 rounded-xl text-[#444654] font-semibold bg-[#e5e2e1] hover:bg-[#d5d2d1] transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={handleSaveMemory}
                disabled={isSaving || (formData.aiMemorySummary || '') === (currentUser?.ai_memory_summary || '')}
                className="px-6 py-2.5 rounded-xl text-white font-bold bg-[#274ed5] hover:bg-[#1f42ba] transition-colors disabled:opacity-50 disabled:bg-[#c4c5d7] flex items-center gap-2 shadow-sm"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">save</span>
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRO Modal Component */}
      <ProUpgradeModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)} 
      />

      {/* Goal Edit Modal */}
      <GoalEditModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoals={formData.goals}
        onSave={async (newGoals) => {
          setFormData(prev => ({ ...prev, goals: newGoals }));
          try {
            await updateProfile({ target_goals: newGoals });
            await refreshProfile();
          } catch (error) {
            console.error("Xatolik maqsadlarni saqlashda:", error);
            alert("Maqsadlarni saqlashda xatolik yuz berdi!");
          }
        }}
        isPro={currentUser?.is_pro || false}
        onProLimitReached={() => setShowProModal(true)}
      />

      <ReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        purchase={selectedPurchase}
        user={currentUser}
      />
    </div>
    </>
  );
};

export default KnowzaAIProfile;