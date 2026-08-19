import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Seo from '../../components/Seo';
import { useTranslation } from 'react-i18next';
import OnboardingLanguageSwitcher from '../../components/common/OnboardingLanguageSwitcher';

const KnowzaAILogin = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('Muvaffaqiyatli kirdingiz!'));
      navigate('/knowza-ai/dashboard');
    } catch {
      toast.error(t('Xatolik yuz berdi. E-pochta yoki parol noto\'g\'ri.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo 
        title={t("Sign In | Knowza AI — Intelligent Study Platform")}
        description={t("Log in to Knowza AI to access your personalized AI Tutor, research tools, and study roadmap.")}
        image="/banner/knowza_ai_weblink.png"
        icon="/banner/Knowza-logo-mini.png"
      />
      
      <div className="min-h-screen h-screen w-full bg-[#e8edff] text-[#1c1b1b] font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center p-6 sm:p-8 lg:p-10 selection:bg-[#274ed5] selection:text-white overflow-hidden">

        {/* ─── WIDE 2-COLUMN MODAL CARD (50/50 SPLIT) ─── */}
        <div className="w-full max-w-[1240px] min-h-[680px] max-h-[680px] h-[680px] bg-white rounded-[32px] border-2 border-[#b8caeb] shadow-2xl shadow-[#274ed5]/10 grid grid-cols-1 lg:grid-cols-12 overflow-hidden m-auto">
          
          {/* ─── LEFT COLUMN: FULL SEAMLESS COVER BANNER (6/12 - 50%) ─── */}
          <div className="lg:col-span-6 relative flex flex-col justify-end p-6 sm:p-10 text-white overflow-hidden min-h-[300px] lg:h-full bg-slate-900">

            {/* Background Banner Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url('/banner/knowza_ai_loginpage.png')` }}
            />

            {/* Gradient Overlay for Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent pointer-events-none z-10"></div>

            {/* Text Content Overlay */}
            <div className="relative z-20 text-center w-full pb-4">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                {t("Knowza AI Portali")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200/90 max-w-md mx-auto font-medium leading-relaxed">
                {t("Sun'iy intellektga asoslangan shaxsiy ta'lim portalingizga kiring va bilim olishda yangi bosqichga ko'tariling.")}
              </p>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: FORM CONTROLS (6/12 - 50%) ─── */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between bg-white relative">
            
            {/* Top Right Language Switcher */}
            <div className="flex items-center justify-end mb-2">
              <OnboardingLanguageSwitcher />
            </div>

            {/* Main Login Form Content */}
            <div className="my-auto max-w-md w-full mx-auto space-y-6">
              
              <div className="text-center">
                <div className="w-14 h-14 bg-[#e8edff] rounded-2xl flex items-center justify-center mb-3 mx-auto border border-[#274ed5]/20 shadow-sm">
                  <span className="material-symbols-outlined text-[28px] text-[#274ed5]">login</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight mb-1">
                  {t("Tizimga kirish")}
                </h1>
                <p className="text-xs sm:text-sm text-[#444654] font-medium leading-relaxed">
                  {t("Knowza AI portali orqali ta'limni davom ettiring")}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
                    {t("E-pochta")}
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] outline-none text-[#1c1b1b] text-sm font-semibold transition-all placeholder:text-[#747686] pl-10"
                      placeholder={t("Sizning e-pochtangiz")}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] text-[18px]">
                      mail
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#1c1b1b] uppercase tracking-wider mb-1">
                    {t("Parol")}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e5e2e1] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] outline-none text-[#1c1b1b] text-sm font-semibold transition-all placeholder:text-[#747686] pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] text-[18px]">
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
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 disabled:opacity-50 hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 shadow-none mt-2"
                >
                  {loading ? t('Kirilmoqda...') : t('Kirish')}
                  {!loading && (
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-xs sm:text-sm text-[#444654] font-medium">
                  {t("Akkauntingiz yo'qmi?")}{' '}
                  <Link to="/knowza-ai/onboarding" className="text-[#274ed5] font-extrabold hover:underline">
                    {t("Ro'yxatdan o'tish")}
                  </Link>
                </p>
              </div>

            </div>

            {/* Bottom Footer Spacing */}
            <div className="h-4"></div>

          </div>

        </div>

      </div>
    </>
  );
};

export default KnowzaAILogin;
