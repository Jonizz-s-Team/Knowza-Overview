import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiService from '../../data/apiService';
import { useAuth } from '../../context/AuthContext';
import { usePlannerContext } from '../../context/PlannerContext';

const EXAM_OPTIONS = [
  {
    id: 'ielts',
    name: 'IELTS Academic',
    subtitle: 'Listening, Reading, Writing, Speaking',
    color: '#2563eb',
    bgLight: '#eff6ff'
  },
  {
    id: 'sat',
    name: 'Digital SAT',
    subtitle: 'Math & Reading/Writing Modules',
    color: '#0d9488',
    bgLight: '#f0fdfa'
  },
  {
    id: 'ms',
    name: 'Milliy Sertifikat (DTM)',
    subtitle: 'Mutaxassislik & Majburiy fanlar',
    color: '#d97706',
    bgLight: '#fffbeb'
  }
];

const ExamTrackModal = ({ isOpen, onClose, onSuccess, isBlocking = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout } = useAuth();
  const { startPlannerGeneration } = usePlannerContext() || {};

  const [selectedTrack, setSelectedTrack] = useState('ielts');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const selectedOption = EXAM_OPTIONS.find(o => o.id === selectedTrack) || EXAM_OPTIONS[0];

      // Formulate goal object
      const newGoal = {
        name: selectedOption.name,
        type: selectedOption.id,
        createdAt: new Date().toISOString()
      };

      const existingGoals = Array.isArray(currentUser?.target_goals) ? currentUser.target_goals : [];
      const updatedGoals = [newGoal, ...existingGoals.filter(g => {
        const name = (typeof g === 'string' ? g : g.name || g.type || '').toLowerCase();
        return !name.includes(selectedOption.id);
      })];

      if (updateProfile) {
        await updateProfile({ target_goals: updatedGoals });
      }

      toast.success(t("Imtihon turi saqlandi! Diagnostik test boshlanmoqda..."));
      if (onSuccess) onSuccess(selectedTrack);
      if (onClose) onClose();
      
      navigate(`/knowza-ai/diagnostic?examType=${selectedTrack}`);
    } catch (err) {
      console.error("Exam track confirmation error:", err);
      toast.error(err?.message || t("Ma'lumot saqlashda xatolik yuz berdi"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout('/knowza-ai/login');
      } else {
        navigate('/knowza-ai/login');
      }
    } catch (e) {
      navigate('/knowza-ai/login');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '36px 36px 30px',
          boxShadow: 'none',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Top Centered Warning Icon */}
        <div 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            backgroundColor: '#fffbe6',
            border: '1px solid #ffe58f',
            color: '#d48806',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: 'none'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Modal Title (No Emojis) */}
        <h3 
          style={{
            fontSize: '21px',
            fontWeight: '800',
            color: '#0f172a',
            marginBottom: '12px',
            lineHeight: '1.3'
          }}
        >
          {t("Iltimos, Imtihon Turini Tanlang!")}
        </h3>

        {/* Modal Description */}
        <p 
          style={{
            fontSize: '15px',
            color: '#475569',
            lineHeight: '1.65',
            marginBottom: '24px',
            fontWeight: '500'
          }}
        >
          {t("Siz tanlagan imtihon turiga (IELTS, SAT, Milliy Sertifikat) qarab bilimingiz va aniq darajangizni (Level) aniqlash uchun diagnostik test olinadi.")}
        </p>

        {/* Track Selection List (No Icons, Constant 2px Border for Zero Layout Shift) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', textAlign: 'left' }}>
          {EXAM_OPTIONS.map((opt) => {
            const isSelected = selectedTrack === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedTrack(opt.id)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: `2px solid ${isSelected ? opt.color : '#e2e8f0'}`,
                  backgroundColor: isSelected ? opt.bgLight : '#f8fafc',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{opt.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{opt.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Modal Action Buttons */}
        <div 
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button 
            type="button"
            onClick={handleLogout}
            style={{
              flex: '1 1 150px',
              height: '48px',
              padding: '0 20px',
              borderRadius: '14px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: 'none'
            }}
          >
            {t("Tizimdan Chiqish")}
          </button>

          <button 
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              flex: '1 1 150px',
              height: '48px',
              padding: '0 20px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? t("Tayyorlanmoqda...") : t("Testni Boshlash")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamTrackModal;
