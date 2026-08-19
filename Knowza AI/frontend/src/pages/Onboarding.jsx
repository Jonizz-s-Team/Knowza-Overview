import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import apiService from '../../data/apiService';
import Seo from '../../components/Seo';

import OnboardingLanguageSwitcher from '../../components/common/OnboardingLanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const analysisSteps = [
  "Shaxsiy profilingiz tahlil qilinmoqda...",
  "Kognitiv o'rganish uslubingiz aniqlanmoqda...",
  "Zaif va kuchli ko'nikmalar taqsimlanmoqda...",
  "Optimal kunlik yuklama hisoblanmoqda...",
  "IELTS/SAT maqsadlari bo'yicha darslar tayyorlanmoqda..."
];

const KnowzaAIOnboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [completedStepsIndex, setCompletedStepsIndex] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    country: 'O\'zbekiston',
    city: '',
    interests: [],
    favoriteSocialMedia: [],
    aiPersona: '',
    bio: ''
  });

  const predefinedPersonas = [
    { id: 'qattiqqol', label: 'Qattiqqo\'l', icon: 'gavel', desc: 'Talabchan va qattiq intizomga asoslangan' },
    { id: 'dostona', label: 'Do\'stona', icon: 'handshake', desc: 'O\'rtoqdek gaplashadi va tushunishga harakat qiladi' },
    { id: 'motivator', label: 'Motivator', icon: 'local_fire_department', desc: 'Ruhlantirib, olg\'a intilishga undaydi' },
    { id: 'hazilkash', label: 'Hazilkash', icon: 'sentiment_very_satisfied', desc: 'Mavzularni kulgili va qiziqarli tushuntiradi' },
    { id: 'faylasuf', label: 'Faylasuf', icon: 'psychology_alt', desc: 'Chuqur ma\'noli va mulohazali yondashuv' },
    { id: 'jiddiy', label: 'Jiddiy O\'qituvchi', icon: 'school', desc: 'Rasmiy, aniq va professional uslub' }
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

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getLocation = () => {
    if ("geolocation" in navigator) {
      toast.info(t("onboarding_flow.loc_detecting"));
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            country: (data.address?.country || 'O\'zbekiston').substring(0, 50),
            city: (data.address?.city || data.address?.town || data.address?.county || data.address?.state || '').substring(0, 50)
          }));
          clearFieldError('country');
          clearFieldError('city');
          toast.success(t("onboarding_flow.loc_success"));
        } catch (err) {
          console.error(err);
          toast.error(t("onboarding_flow.loc_fail"));
        }
      }, () => {
        toast.error(t("onboarding_flow.loc_denied"));
      });
    } else {
      toast.error(t("onboarding_flow.loc_unsupported"));
    }
  };

  const handlePrev = () => {
    setErrors({});
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleNext = () => {
    const newErrors = {};

    // STEP 1: Personal Info & Location Validation
    if (step === 1) {
      const cleanFirst = formData.firstName.trim();
      const cleanLast = formData.lastName.trim();

      if (!cleanFirst || cleanFirst.length < 2) {
        newErrors.firstName = t("Ismingiz kamida 2 ta harf bo'lishi kerak");
      } else if (cleanFirst.length > 30) {
        newErrors.firstName = t("Ism 30 ta belgidan oshmasligi kerak");
      }

      if (!cleanLast || cleanLast.length < 2) {
        newErrors.lastName = t("Familiyangiz kamida 2 ta harf bo'lishi kerak");
      } else if (cleanLast.length > 30) {
        newErrors.lastName = t("Familiya 30 ta belgidan oshmasligi kerak");
      }

      const parsedAge = parseInt(formData.age, 10);
      if (!formData.age || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 100) {
        newErrors.age = t("Yoshingizni to'g'ri kiriting (10-100)");
      }

      if (!formData.country.trim()) {
        newErrors.country = t("Davlatni kiriting");
      }

      if (!formData.city.trim()) {
        newErrors.city = t("Shahar/tumanniy kiriting");
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(t("onboarding_flow.fill_red_fields"));
        return;
      }
    }

    // STEP 2: Interests & Social Media (Optional)
    if (step === 2) {
      // Both interests and social media are optional - pass through
    }

    // STEP 3: AI Persona & Bio (Optional)
    if (step === 3) {
      if (formData.bio.length > 300) {
        newErrors.bio = t("onboarding_flow.err_bio");
        setErrors(newErrors);
        return toast.error(t("onboarding_flow.err_bio"));
      }
    }

    // STEP 4: Credentials (Email & Password)
    if (step === 4) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
        newErrors.email = t("To'g'ri email manzil kiriting");
      }

      const pass = formData.password;
      const hasLetter = /[A-Za-z]/.test(pass);
      const hasDigit = /[0-9]/.test(pass);

      if (!pass || pass.length < 8) {
        newErrors.password = t("Parol kamida 8 ta belgi bo'lishi kerak");
      } else if (!hasLetter || !hasDigit) {
        newErrors.password = t("Parolda harflar va kamida bitta raqam bo'lishi shart (masalan: Knowza123)");
      }

      if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = t("Parollar bir-biriga mos kelmadi");
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(t("onboarding_flow.fill_red_fields"));
        return;
      }
    }
    
    setErrors({});
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      submitAll();
    }
  };

  const submitAll = async () => {
    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      await register({
        name: fullName,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone_number: formData.phone.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        address: `${formData.country.trim() || ''}, ${formData.city.trim() || ''}`.replace(/^,\s*|,\s*$/g, ''),
        class_group: `Yoshi: ${formData.age} | ${formData.city.trim()}`,
        role: 'student',
        target_goals: [],
        interests: formData.interests,
        favorite_social_media: formData.favoriteSocialMedia,
        ai_persona: formData.aiPersona,
        bio: formData.bio.trim()
      });

      const ageGradeShort = `Yoshi: ${formData.age}, ${formData.city}`.substring(0, 50);

      await apiService.saveKnowzaAIOnboarding({
        age_or_grade: ageGradeShort,
        global_goal: 'IELTS Ingliz tili',
        current_level: "basic", 
        subject_focus: 'IELTS',
        phone: formData.phone,
        school: '',
        country: formData.country,
        city: formData.city,
        time_commitment: 'Various',
        target_score: ''
      });

      setStep(5);
      setCompletedStepsIndex([]);
      setAnalysisProgress(10);
      
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisText(t(analysisSteps[i]));
        setAnalysisProgress(Math.round(((i + 1) / analysisSteps.length) * 100));
        setCompletedStepsIndex(prev => [...prev, i]);
        await new Promise(r => setTimeout(r, 1300));
      }

      toast.success(t("onboarding_flow.success_register"));
      navigate('/knowza-ai/diagnostic');

    } catch (err) {
      console.error("Onboarding submission failed:", err);
      toast.error(err?.message || t("onboarding_flow.err_general"));
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Personal Info (First Name, Last Name, Age, Location, Phone)
  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 py-1 w-full my-auto"
    >
      <div className="text-center mb-3">
        <div className="w-13 h-13 bg-[#e8edff] rounded-2xl flex items-center justify-center mb-2 mx-auto border border-[#274ed5]/20 shadow-sm">
          <span className="material-symbols-outlined text-[26px] text-[#274ed5]">person_add</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight mb-1">
          {t("Xush kelibsiz!")}
        </h2>
        <p className="text-xs sm:text-sm text-[#444654] max-w-md mx-auto font-medium leading-relaxed">
          {t("Shaxsiy profilingiz va joylashuvingizni kiriting")}
        </p>
      </div>
      
      <div className="space-y-2.5 max-w-md w-full mx-auto">

        {/* Ism va Familiya - 2 ustunli */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
              {t("Ism")} *
            </label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={30}
                value={formData.firstName} 
                onChange={e => {
                  setFormData({...formData, firstName: e.target.value.substring(0, 30)});
                  clearFieldError('firstName');
                }} 
                className={`w-full px-3.5 py-2.5 rounded-xl outline-none font-semibold text-sm transition-all text-[#1c1b1b] pl-9 ${
                  errors.firstName 
                    ? 'bg-red-50 border-2 border-red-500 text-red-900 placeholder:text-red-300' 
                    : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] placeholder:text-[#747686]'
                }`}
                placeholder={t("Azizbek")} 
              />
              <span className={`material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[17px] ${errors.firstName ? 'text-red-500' : 'text-[#747686]'}`}>
                badge
              </span>
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">error</span>
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
              {t("Familiya")} *
            </label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={30}
                value={formData.lastName} 
                onChange={e => {
                  setFormData({...formData, lastName: e.target.value.substring(0, 30)});
                  clearFieldError('lastName');
                }} 
                className={`w-full px-3.5 py-2.5 rounded-xl outline-none font-semibold text-sm transition-all text-[#1c1b1b] pl-9 ${
                  errors.lastName 
                    ? 'bg-red-50 border-2 border-red-500 text-red-900 placeholder:text-red-300' 
                    : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] placeholder:text-[#747686]'
                }`}
                placeholder={t("Aliyev")} 
              />
              <span className={`material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[17px] ${errors.lastName ? 'text-red-500' : 'text-[#747686]'}`}>
                person
              </span>
            </div>
            {errors.lastName && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">error</span>
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Yoshi */}
        <div>
          <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
            {t("Yoshingiz (10-100)")} *
          </label>
          <div className="relative">
            <input 
              type="number" 
              min={10}
              max={100}
              value={formData.age} 
              onChange={e => {
                const val = e.target.value;
                if (val.length <= 3) {
                  setFormData({...formData, age: val});
                  clearFieldError('age');
                }
              }} 
              className={`w-full px-4 py-2.5 rounded-xl outline-none font-semibold text-sm transition-all text-[#1c1b1b] pl-9 ${
                errors.age 
                  ? 'bg-red-50 border-2 border-red-500 text-red-900' 
                  : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] placeholder:text-[#747686]'
              }`}
              placeholder="18" 
            />
            <span className={`material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[17px] ${errors.age ? 'text-red-500' : 'text-[#747686]'}`}>
              cake
            </span>
          </div>
          {errors.age && (
            <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">error</span>
              {errors.age}
            </p>
          )}
        </div>

        {/* Avtomatik joylashuv aniqlash tugmasi */}
        <button 
          onClick={getLocation} 
          type="button"
          className="w-full py-2 bg-[#e8edff] border border-[#274ed5]/20 text-[#274ed5] text-xs font-extrabold rounded-xl flex justify-center items-center gap-2 hover:bg-[#dde4ff] transition-all"
        >
          <span className="material-symbols-outlined text-[17px]">my_location</span>
          {t("Joylashuvni avtomatik aniqlash")}
        </button>

        {/* Davlat + Shahar - yon-yon */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
              {t("Davlat")} *
            </label>
            <input 
              type="text" 
              maxLength={50}
              value={formData.country} 
              onChange={e => {
                setFormData({...formData, country: e.target.value.substring(0, 50)});
                clearFieldError('country');
              }} 
              className={`w-full px-3.5 py-2.5 rounded-xl outline-none font-semibold text-sm transition-all ${
                errors.country 
                  ? 'bg-red-50 border-2 border-red-500 text-red-900' 
                  : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] text-[#1c1b1b]'
              }`}
              placeholder={t("O'zbekiston")} 
            />
            {errors.country && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5">
                {errors.country}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
              {t("Shahar / Tuman")} *
            </label>
            <input 
              type="text" 
              maxLength={50}
              value={formData.city} 
              onChange={e => {
                setFormData({...formData, city: e.target.value.substring(0, 50)});
                clearFieldError('city');
              }} 
              className={`w-full px-3.5 py-2.5 rounded-xl outline-none font-semibold text-sm transition-all ${
                errors.city 
                  ? 'bg-red-50 border-2 border-red-500 text-red-900' 
                  : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] text-[#1c1b1b]'
              }`}
              placeholder={t("Toshkent shahri")} 
            />
            {errors.city && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5">
                {errors.city}
              </p>
            )}
          </div>
        </div>

        {/* Telefon raqami */}
        <div>
          <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
            {t("Telefon raqam (Ixtiyoriy)")}
          </label>
          <div className="relative">
            <input 
              type="text" 
              maxLength={20}
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value.substring(0, 20)})} 
              className="w-full px-4 py-2.5 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] outline-none text-[#1c1b1b] text-sm font-semibold transition-all placeholder:text-[#747686] pl-9" 
              placeholder="+998 90 123 45 67" 
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#747686] text-[17px]">
              call
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );

  // STEP 2: Interests & Social Media
  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 py-1 w-full my-auto"
    >
      <div className="text-center mb-3">
        <div className="w-13 h-13 bg-[#e8edff] rounded-2xl flex items-center justify-center mb-2 mx-auto border border-[#274ed5]/20 shadow-sm">
          <span className="material-symbols-outlined text-[26px] text-[#274ed5]">interests</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight mb-1">
          {t("Qiziqishlaringiz")}
        </h2>
        <p className="text-xs sm:text-sm text-[#444654] max-w-md mx-auto font-medium leading-relaxed">
          {t("AI sizga eng mos materiallarni topishi uchun sevimli qiziqishlaringizni tanlang.")}
        </p>
      </div>
      
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <label className="block text-[11px] font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1.5">
            {t("Qiziqishlaringiz (Ixtiyoriy)")}
          </label>
          <div className={`flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-3 rounded-xl custom-scrollbar ${
            errors.interests ? 'bg-red-50 border-2 border-red-500' : 'bg-[#fcf9f8] border border-[#e5e2e1]'
          }`}>
            {predefinedInterests.map(interest => {
              const isSelected = formData.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => {
                    const ints = isSelected
                      ? formData.interests.filter(i => i !== interest)
                      : [...formData.interests, interest];
                    setFormData({ ...formData, interests: ints });
                    clearFieldError('interests');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    isSelected 
                      ? 'bg-[#274ed5] text-white' 
                      : 'bg-white border border-[#e5e2e1] text-[#444654] hover:border-[#274ed5]/50'
                  }`}
                >
                  {isSelected && <span className="material-symbols-outlined text-[13px]">check</span>}
                  {t(interest)}
                </button>
              );
            })}
          </div>
          {errors.interests && (
            <p className="text-red-500 text-[11px] font-bold mt-1">
              {errors.interests}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1.5">
            {t("Eng ko'p ishlatadigan ijtimoiy tarmoqlaringiz (Ixtiyoriy)")}
          </label>
          <div className={`flex flex-wrap gap-1.5 p-2 rounded-xl ${
            errors.favoriteSocialMedia ? 'bg-red-50 border-2 border-red-500' : ''
          }`}>
            {predefinedSocialMedia.map(social => {
              const isSelected = formData.favoriteSocialMedia.includes(social);
              return (
                <button
                  key={social}
                  type="button"
                  onClick={() => {
                    const socs = isSelected
                      ? formData.favoriteSocialMedia.filter(s => s !== social)
                      : [...formData.favoriteSocialMedia, social];
                    setFormData({ ...formData, favoriteSocialMedia: socs });
                    clearFieldError('favoriteSocialMedia');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    isSelected 
                      ? 'bg-[#274ed5] text-white' 
                      : 'bg-white border border-[#e5e2e1] text-[#444654] hover:border-[#274ed5]/50'
                  }`}
                >
                  {isSelected && <span className="material-symbols-outlined text-[13px]">check</span>}
                  {social}
                </button>
              );
            })}
          </div>
          {errors.favoriteSocialMedia && (
            <p className="text-red-500 text-[11px] font-bold mt-1">
              {errors.favoriteSocialMedia}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  // STEP 3: AI Persona & Bio
  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 py-1 w-full my-auto"
    >
      <div className="text-center mb-3">
        <div className="w-13 h-13 bg-[#e8edff] rounded-2xl flex items-center justify-center mb-2 mx-auto border border-[#274ed5]/20 shadow-sm">
          <span className="material-symbols-outlined text-[26px] text-[#274ed5]">psychology</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight mb-1">
          {t("AI Xarakteri va Bio")}
        </h2>
        <p className="text-xs sm:text-sm text-[#444654] max-w-md mx-auto font-medium leading-relaxed">
          {t("O'zingizga qanday AI o'qituvchi yoqishini tanlang va qisqacha o'zingiz haqingizda yozing.")}
        </p>
      </div>
      
      <div className="space-y-3.5 max-w-2xl mx-auto">
        <div>
          <label className="block text-[11px] font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-2">
            {t("AI qanday bo'lishini xohlaysiz? (Ixtiyoriy)")}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {predefinedPersonas.map(persona => {
              const isSelected = formData.aiPersona === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, aiPersona: persona.id });
                    clearFieldError('aiPersona');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex gap-3 items-start ${
                    isSelected 
                      ? 'border-[#274ed5] bg-[#e8edff]' 
                      : (errors.aiPersona ? 'border-red-500 bg-red-50/30' : 'border-[#e5e2e1] bg-white hover:border-[#274ed5]/40')
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#274ed5] text-white' : 'bg-[#e8edff] text-[#274ed5]'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {persona.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className={`font-extrabold text-xs mb-0.5 ${isSelected ? 'text-[#274ed5]' : 'text-[#1c1b1b]'}`}>
                      {t(persona.label)}
                    </h4>
                    <p className={`text-[11px] leading-snug font-medium ${isSelected ? 'text-[#274ed5]/90' : 'text-[#747686]'}`}>
                      {t(persona.desc)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.aiPersona && (
            <p className="text-red-500 text-[11px] font-bold mt-1">
              {errors.aiPersona}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[11px] font-extrabold text-[#1c1b1b] uppercase tracking-wider">
              {t("O'zingiz haqingizda (Bio)")}
            </label>
            <span className={`text-[11px] font-bold ${formData.bio.length > 300 ? 'text-red-500' : 'text-[#747686]'}`}>
              {formData.bio.length}/300
            </span>
          </div>
          <textarea 
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value.substring(0, 300)})}
            placeholder={t("Masalan: Men aniq fanlarga qiziqaman va kelajakda dasturchi bo'lmoqchiman...")}
            className="w-full p-3 rounded-xl bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] outline-none transition-all text-[#1c1b1b] font-medium resize-none text-xs"
            rows="3"
          />
        </div>
      </div>
    </motion.div>
  );

  // STEP 4: Account Credentials (Email, Password, Confirm Password)
  const renderStep4 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 py-1 w-full my-auto"
    >
      <div className="text-center mb-3">
        <div className="w-13 h-13 bg-[#e8edff] rounded-2xl flex items-center justify-center mb-2 mx-auto border border-[#274ed5]/20 shadow-sm">
          <span className="material-symbols-outlined text-[26px] text-[#274ed5]">lock_reset</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight mb-1">
          {t("Hisob ma'lumotlari")}
        </h2>
        <p className="text-xs sm:text-sm text-[#444654] max-w-md mx-auto font-medium leading-relaxed">
          {t("Tizimga kirish uchun email va maxfiy parolingizni belgilang.")}
        </p>
      </div>

      <div className="space-y-3 max-w-md w-full mx-auto">
        
        {/* Email */}
        <div>
          <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
            {t("Email manzil")} *
          </label>
          <div className="relative">
            <input 
              type="email" 
              maxLength={80}
              value={formData.email} 
              onChange={e => {
                setFormData({...formData, email: e.target.value.substring(0, 80)});
                clearFieldError('email');
              }} 
              className={`w-full px-4 py-2.5 sm:py-3 rounded-xl outline-none font-semibold text-sm transition-all text-[#1c1b1b] pl-10 ${
                errors.email 
                  ? 'bg-red-50 border-2 border-red-500 text-red-900 placeholder:text-red-300' 
                  : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] placeholder:text-[#747686]'
              }`}
              placeholder="azizbek@gmail.com" 
            />
            <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] ${errors.email ? 'text-red-500' : 'text-[#747686]'}`}>
              mail
            </span>
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Parol */}
        <div>
          <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
            {t("Parol (Kamida 8 ta belgi, harf va raqam)")} *
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              maxLength={50}
              value={formData.password} 
              onChange={e => {
                setFormData({...formData, password: e.target.value.substring(0, 50)});
                clearFieldError('password');
              }} 
              className={`w-full px-4 py-2.5 sm:py-3 rounded-xl outline-none font-semibold text-sm transition-all text-[#1c1b1b] pl-10 pr-10 ${
                errors.password 
                  ? 'bg-red-50 border-2 border-red-500 text-red-900 placeholder:text-red-300' 
                  : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] placeholder:text-[#747686]'
              }`}
              placeholder="••••••••" 
            />
            <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] ${errors.password ? 'text-red-500' : 'text-[#747686]'}`}>
              lock
            </span>
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#1c1b1b] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {/* Real-time Password Rules Indicators */}
          <div className="flex flex-wrap gap-2 mt-2">
            <div className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              formData.password.length >= 8 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
            }`}>
              <span className="material-symbols-outlined text-[13px]">
                {formData.password.length >= 8 ? 'check_circle' : 'cancel'}
              </span>
              8+ belgi
            </div>

            <div className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              (/[A-Za-z]/.test(formData.password) && /[0-9]/.test(formData.password)) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
            }`}>
              <span className="material-symbols-outlined text-[13px]">
                {(/[A-Za-z]/.test(formData.password) && /[0-9]/.test(formData.password)) ? 'check_circle' : 'cancel'}
              </span>
              Harf va raqam
            </div>
          </div>

          {errors.password && (
            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {errors.password}
            </p>
          )}
        </div>

        {/* Parolni tasdiqlash */}
        <div>
          <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
            {t("Parolni tasdiqlang")} *
          </label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              maxLength={50}
              value={formData.confirmPassword} 
              onChange={e => {
                setFormData({...formData, confirmPassword: e.target.value.substring(0, 50)});
                clearFieldError('confirmPassword');
              }} 
              className={`w-full px-4 py-2.5 sm:py-3 rounded-xl outline-none font-semibold text-sm transition-all text-[#1c1b1b] pl-10 pr-10 ${
                errors.confirmPassword 
                  ? 'bg-red-50 border-2 border-red-500 text-red-900 placeholder:text-red-300' 
                  : 'bg-[#fcf9f8] border border-[#e5e2e1] focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] placeholder:text-[#747686]'
              }`}
              placeholder="••••••••" 
            />
            <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] ${errors.confirmPassword ? 'text-red-500' : 'text-[#747686]'}`}>
              check_circle
            </span>
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#1c1b1b] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showConfirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {formData.confirmPassword && (
            <div className={`mt-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 w-fit transition-all ${
              formData.confirmPassword === formData.password ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              <span className="material-symbols-outlined text-[13px]">
                {formData.confirmPassword === formData.password ? 'check_circle' : 'error'}
              </span>
              {formData.confirmPassword === formData.password ? "Parollar mos keldi" : "Parollar mos kelmadi"}
            </div>
          )}

          {errors.confirmPassword && (
            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="pt-2 text-center">
          <p className="text-xs text-[#444654] font-medium">
            {t("Akkauntingiz bormi? ")}{' '}
            <button 
              type="button"
              onClick={() => navigate('/knowza-ai/login')} 
              className="text-[#274ed5] font-extrabold hover:underline cursor-pointer"
            >
              {t("onboarding_flow.login")}
            </button>
          </p>
        </div>

      </div>
    </motion.div>
  );

  // STEP 5: High-Tech AI Horizontal Loader & Neural Synthesis Screen
  const renderStep5 = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-4 my-auto w-full max-w-lg mx-auto"
    >
      {/* Title & Live Progress % */}
      <div className="text-center mb-5 w-full">
        <span className="text-3xl sm:text-4xl font-black text-[#274ed5] tabular-nums">
          {analysisProgress}%
        </span>
        <p className="text-xs sm:text-sm text-[#444654] font-semibold mt-1.5">
          {t("Kognitiv neyron modeli va o'quv dasturi shakllanmoqda")}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#e8edff] rounded-full h-3.5 mb-6 overflow-hidden border border-[#274ed5]/30 p-0.5 shadow-inner">
        <div 
          className="bg-gradient-to-r from-[#1f42ba] via-[#274ed5] to-[#4f75ff] h-full rounded-full transition-all duration-300 shadow-md relative overflow-hidden"
          style={{ width: `${analysisProgress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      
      {/* Live Active Diagnostic Step Indicator */}
      <div className="bg-[#f5f8ff] border border-[#274ed5]/30 p-3.5 rounded-xl w-full text-center mb-5 shadow-xs">
        <div className="flex items-center justify-center gap-2.5">
          <span className="material-symbols-outlined text-[#274ed5] text-[18px] animate-spin shrink-0">
            sync
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-[#274ed5] leading-snug">
            {analysisText || t("Jarayon ishga tushmoqda...")}
          </p>
        </div>
      </div>

      {/* Real-time Step Log Checklist */}
      <div className="w-full bg-[#fcf9f8] border border-[#e5e2e1] rounded-2xl p-4 sm:p-5 text-left shadow-xs">
        <div className="space-y-3">
          {analysisSteps.map((stepItem, idx) => {
            const isDone = completedStepsIndex.includes(idx);
            const isCurrent = analysisText === t(stepItem);
            return (
              <div 
                key={idx} 
                className={`flex items-start gap-2.5 transition-all ${
                  isDone 
                    ? 'text-emerald-700' 
                    : isCurrent 
                    ? 'text-[#274ed5]' 
                    : 'text-[#747686]/50'
                }`}
              >
                {/* Icon */}
                <span className={`material-symbols-outlined text-[18px] shrink-0 mt-px ${
                  isDone ? 'text-emerald-600' : isCurrent ? 'text-[#274ed5] animate-spin' : 'text-slate-300'
                }`}>
                  {isDone ? 'check_circle' : isCurrent ? 'sync' : 'radio_button_unchecked'}
                </span>

                {/* Text - takes up remaining space, wraps naturally */}
                <span className="text-xs sm:text-[13px] font-bold leading-snug flex-1 min-w-0">
                  {t(stepItem)}
                </span>

                {/* Status Badge - fixed width so they all align */}
                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg shrink-0 ${
                  isDone 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : isCurrent 
                    ? 'bg-[#e8edff] text-[#274ed5]' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {isDone ? 'OK' : isCurrent ? '...' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );

  const stepBanners = {
    1: {
      image: '/banner/knowza_ai_step1.png',
      title: 'Mukammal Ingliz Tili Poydevori',
      desc: 'Qoidalarni yodlamasdan, poydevordan boshlab chuqur va aniq tushunib o‘rganing.',
      badge: 'Mukammal Baza'
    },
    2: {
      image: '/banner/knowza_ai_step2.png',
      title: 'Qiziqishlaringizga Moslashtirish',
      desc: 'AI siz yoqtirgan mavzular orqali ta\'lim materiallarini tayyorlaydi.',
      badge: 'Interests & Social'
    },
    3: {
      image: '/banner/knowza_ai_step3.png',
      title: 'Intellektual AI Ustoz',
      desc: 'O’zingizga eng maqbul va yoqimli ta’lim berish uslubini tanlang.',
      badge: 'Persona Tuning'
    },
    4: {
      image: '/banner/knowza_ai_tutor.png',
      title: 'Xavfsiz Akkaunt Yarating',
      desc: 'Email va parolingiz bilan shaxsiy AI o\'quv kabinetingizga ulaning.',
      badge: 'Secure Account'
    },
    5: {
      image: '/banner/knowza_ai_step4.png',
      title: 'Shaxsiy Dastur Yaratilmoqda...',
      desc: 'AI siz uchun eng samarali va optimal ta’lim xaritasini tuzmoqda.',
      badge: 'Building Roadmap'
    }
  };

  const currentBanner = stepBanners[step] || stepBanners[1];

  return (
    <>
      <Seo 
        title={t("Get Started | Knowza AI — Personal Learning Companion")}
        description={t("Join Knowza AI to build your personalized study roadmap and level up with 24/7 AI tutoring.")}
        image="/banner/knowza_ai_weblink.png"
        icon="/banner/Knowza-logo-mini.png"
      />
      
      <div className="min-h-screen h-screen w-full bg-[#e8edff] text-[#1c1b1b] font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-[#274ed5] selection:text-white overflow-hidden">

        {/* ─── WIDE 2-COLUMN MODAL CARD ─── */}
        <div className="w-full max-w-[1360px] min-h-[720px] max-h-[88vh] h-[740px] bg-white rounded-[32px] border-2 border-[#b8caeb] shadow-2xl shadow-[#274ed5]/10 grid grid-cols-1 lg:grid-cols-12 overflow-hidden m-auto">
          
          {/* ─── LEFT COLUMN: FULL SEAMLESS COVER BANNER (6/12 - 50%) ─── */}
          <div className="lg:col-span-6 relative flex flex-col justify-end p-8 sm:p-10 text-white overflow-hidden min-h-[320px] lg:h-full bg-slate-900">

            {/* Dynamic Animated Full Background Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${currentBanner.image})` }}
              />
            </AnimatePresence>

            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent pointer-events-none z-10"></div>

            {/* Text & Dots Overlay at Bottom */}
            <div className="relative z-20 text-center w-full pb-3">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2.5">
                {currentBanner.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-200/90 max-w-md mx-auto font-medium leading-relaxed mb-6">
                {currentBanner.desc}
              </p>

              {/* Banner Footer Indicators */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <div 
                    key={num}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step === num ? 'w-8 bg-white' : (step > num ? 'w-2.5 bg-white/70' : 'w-2.5 bg-white/30')
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: FORM & STEPPER CONTROLS (6/12 - 50%) ─── */}
          <div className="lg:col-span-6 p-6 sm:p-9 flex flex-col justify-between bg-white relative overflow-hidden">
            
            {/* Top Right Language Switcher */}
            {step < 5 && (
              <div className="flex items-center justify-end mb-2 shrink-0">
                <OnboardingLanguageSwitcher />
              </div>
            )}

            {/* Step Form Content with Inner Smooth Scrollbar */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-2 min-h-[420px] max-h-[580px] flex flex-col justify-start">
              <AnimatePresence mode="wait">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
              </AnimatePresence>
            </div>

            {/* Bottom Nav Bar */}
            {step < 5 && (
              <div className="pt-3 border-t border-[#e5e2e1] flex justify-between items-center mt-2 shrink-0">
                <button 
                  onClick={handlePrev} 
                  type="button"
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs border border-[#e5e2e1] text-[#444654] bg-white hover:bg-slate-50 transition-colors ${
                    step === 1 ? 'opacity-0 pointer-events-none' : ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    {t("onboarding_flow.back")}
                  </span>
                </button>
                
                <button 
                  onClick={handleNext} 
                  type="button"
                  disabled={loading}
                  className="px-7 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-extrabold text-sm sm:text-base flex items-center gap-2.5 disabled:opacity-50 hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 shadow-none"
                >
                  {loading ? t("onboarding_flow.waiting") : (step === 4 ? t("onboarding_flow.start_analysis") : t("onboarding_flow.next"))}
                  {!loading && step < 4 && (
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </>
  );
};

export default KnowzaAIOnboarding;

