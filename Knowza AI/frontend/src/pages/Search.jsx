import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Seo from '../../components/Seo';
import { useTranslation } from 'react-i18next';

const allCourses = [
  { 
    id: 1, 
    title: 'Kvadrat tenglamalar — Algebra 8-sinf', 
    desc: "Kvadrat tenglama - ax² + bx + c = 0 ko'rinishidagi tenglama bo'lib, bu yerda a, b, c - berilgan sonlar (a ≠ 0), x - noma'lum son. Kvadrat tenglamalarni yechish uchun diskriminant (D = b² - 4ac) topiladi.", 
    subject: 'Matematika', 
    unit: '4.1', 
    type: 'Nazariya', 
    icon: 'functions', 
    gradient: 'from-[#274ed5] to-[#4669f0]',
    sourceInfo: 'Davlat darsligi, 8-sinf, 47-bet',
    isFeatured: true 
  },
  { 
    id: 101, 
    title: "Viyet teoremasi va uni qo'llash", 
    desc: "", 
    subject: 'Matematika', 
    unit: '4.1', 
    type: 'Video darslik', 
    icon: 'play_circle', 
    bgColor: 'bg-[#e8edff]', 
    iconColor: 'text-[#274ed5]',
    meta: '12 daqiqa • Ustoz: Alisher Karimov' 
  },
  { 
    id: 102, 
    title: "Kvadrat tenglamalarga doir amaliy mashqlar", 
    desc: "", 
    subject: 'Matematika', 
    unit: '4.1', 
    type: 'Test', 
    icon: 'assignment', 
    bgColor: 'bg-[#e6f4ea]', 
    iconColor: 'text-[#137333]',
    meta: '15 ta savol • Qiyinlik: O\'rta' 
  },
  { 
    id: 103, 
    title: "To'la va chala kvadrat tenglamalar farqi", 
    desc: "", 
    subject: 'Matematika', 
    unit: '4.1', 
    type: 'Maqola', 
    icon: 'article', 
    bgColor: 'bg-[#f3f4f6]', 
    iconColor: 'text-[#4b5563]',
    meta: '4 daqiqa o\'qish' 
  },
  { 
    id: 2, 
    title: 'Trigonometriya asoslari', 
    desc: 'Sin, cos, tan funksiyalari', 
    subject: 'Matematika', 
    unit: '5.1', 
    type: 'Nazariya', 
    icon: 'architecture', 
    gradient: 'from-[#7c4dff] to-[#b47cff]',
    sourceInfo: 'Davlat darsligi, 9-sinf, 12-bet',
    isFeatured: true 
  },
  { 
    id: 3, 
    title: 'IELTS Writing Task 1', 
    desc: 'Grafik va jadvallarni tasvirlash strategiyasi', 
    subject: 'Ingliz tili', 
    unit: '2.3', 
    type: 'Nazariya', 
    icon: 'edit_note', 
    gradient: 'from-[#e04f16] to-[#ff7043]',
    sourceInfo: 'Cambridge IELTS 16, Test 1',
    isFeatured: true 
  },
];

const studentPlan = {
  currentCourse: allCourses[0],
  nextCourses: [allCourses[4], allCourses[5]]
};

const subjects = ['Barcha fanlar', 'Matematika', 'IELTS', 'Ingliz tili'];

const KnowzaAISearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSubject, setActiveSubject] = useState('Barcha fanlar');
  const [visibleCount, setVisibleCount] = useState(4);

  const filtered = allCourses.filter(course => {
    const matchesSubject = activeSubject === 'Barcha fanlar' || activeSubject === t('Barcha fanlar') || course.subject === activeSubject || (activeSubject === 'IELTS' && course.title.includes('IELTS'));
    const matchesSearch = !searchQuery.trim() || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const featuredResult = filtered.find(c => c.isFeatured);
  const otherResults = filtered.filter(c => c.id !== featuredResult?.id).slice(0, visibleCount);
  const hasMore = visibleCount < filtered.filter(c => c.id !== featuredResult?.id).length;

  const handleSearch = (e) => {
    e.preventDefault();
    setVisibleCount(4); 
  };

  const isSearchActive = searchQuery.trim() !== '' || activeSubject !== 'Barcha fanlar';

  return (
    <>
      <Seo 
        title={t("Kutubxona | Knowza AI")}
        description={t("Fanga oid barcha o'quv materiallari, darsliklar, testlar va video darslarni oson qidiring.")}
        icon="/banner/Knowza-logo-mini.png"
      />
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {isSearchActive ? (
            <>
              <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">
                {t("Qidiruv: ")}{searchQuery || (activeSubject === 'Barcha fanlar' ? t('Barcha fanlar') : activeSubject)}
              </h2>
              <p className="text-[14px] leading-[20px] text-[#444654]">
                {t("Topilgan natijalar: ")}{filtered.length}{t(" ta material")}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[28px] leading-[36px] font-bold text-[#1c1b1b]">{t("Kutubxona va O'quv Plani")}</h2>
              <p className="text-[14px] leading-[20px] text-[#444654]">
                {t("Shaxsiy o'quv rejangiz va barcha fanlar to'plami")}
              </p>
            </>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-3xl flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[#1c1b1b] text-[20px]">search</span>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(4); }}
              className="w-full pl-12 pr-14 py-4 bg-white border border-[#c4c5d7] rounded-2xl focus:ring-2 focus:ring-[#274ed5] focus:border-[#274ed5] outline-none text-[#1c1b1b] text-[16px] shadow-[0px_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#747686]" 
              placeholder={t("Mavzu, fan yoki kalit so'zni yozing...")} 
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => { setSearchQuery(''); setVisibleCount(4); }}
                className="absolute right-12 inset-y-0 flex items-center text-[#747686] hover:text-[#1c1b1b] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
            <button type="button" className="absolute right-4 inset-y-0 flex items-center text-[#747686] hover:text-[#1c1b1b] transition-colors">
              <span className="material-symbols-outlined">mic</span>
            </button>
          </form>
        </div>
      </section>

      {!isSearchActive ? (
        <>
          {/* Student Plan View */}
          <div className="mt-4 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#274ed5]">school</span>
                {t("Sizning O'quv Rejangiz")}
              </h3>
              
              {/* Featured Current Course */}
              <div 
                onClick={() => navigate(`/knowza-ai/lesson/${studentPlan.currentCourse.id}`)}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${studentPlan.currentCourse.gradient} p-8 md:p-10 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow flex flex-col justify-between group min-h-[260px]`}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[13px] font-semibold border border-white/30">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
                    {t("Joriy mavzu")}
                  </div>
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>{studentPlan.currentCourse.icon}</span>
                  </div>
                </div>
                
                <div className="relative z-10 mt-12">
                  <div className="flex items-center gap-3 mb-3 text-white/90 text-sm font-medium">
                    <span className="px-2 py-1 bg-white/10 rounded-md">{studentPlan.currentCourse.subject}</span>
                    <span>•</span>
                    <span>{t("Birlik: ")}{studentPlan.currentCourse.unit}</span>
                  </div>
                  <h2 className="text-[32px] md:text-[40px] leading-[1.2] font-black mb-2 tracking-tight">
                    {studentPlan.currentCourse.title}
                  </h2>
                  <p className="text-white/80 text-[16px] md:text-[18px] font-medium max-w-lg">
                    {studentPlan.currentCourse.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Courses in Plan */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[16px] font-bold text-[#747686] uppercase tracking-wider">{t("Kelgusi mavzular")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentPlan.nextCourses.map(course => (
                  <button 
                    key={course.id}
                    onClick={() => navigate(`/knowza-ai/lesson/${course.id}`)}
                    className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-[#e5e2e1] hover:border-[#274ed5]/30 hover:shadow-[0px_4px_20px_rgba(39,78,213,0.08)] transition-all flex items-center gap-5 w-full text-left group"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${course.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{course.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-[#8e8f99]">{course.subject} • {course.unit}</span>
                      </div>
                      <h4 className="text-[17px] leading-[22px] font-bold text-[#1c1b1b] group-hover:text-[#274ed5] transition-colors truncate">{course.title}</h4>
                      <p className="text-[13px] leading-[18px] text-[#444654] mt-1 line-clamp-1">{course.desc}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#fcf9f8] flex items-center justify-center group-hover:bg-[#e8edff] transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[#747686] group-hover:text-[#274ed5] text-[20px]">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Filter Chips */}
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar mt-2 pb-2">
            {subjects.map(subj => (
              <button 
                key={subj}
                onClick={() => { setActiveSubject(subj); setVisibleCount(4); }}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-semibold text-[14px] leading-[20px] transition-colors ${
                  activeSubject === subj 
                    ? 'bg-[#274ed5] text-white shadow-sm' 
                    : 'bg-white text-[#444654] border border-[#c4c5d7] hover:bg-[#fcf9f8]'
                }`}
              >
                {subj}
              </button>
            ))}
            <button className="whitespace-nowrap px-4 py-2 rounded-full font-semibold text-[14px] leading-[20px] transition-colors bg-white text-[#444654] border border-[#c4c5d7] hover:bg-[#fcf9f8] flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">tune</span> {t("Filtrlar")}
            </button>
          </div>

          {/* Search Results Display */}
          {filtered.length > 0 ? (
            <div className="flex flex-col xl:flex-row gap-8 mt-4 items-start">
              
              {/* Featured Result (Asosiy Manba) */}
              {featuredResult && (
                <div className="w-full xl:w-2/3 flex flex-col md:flex-row gap-8">
                  {/* Left Big Icon Box */}
                  <div className="w-full md:w-[320px] h-[360px] bg-[#274ed5] rounded-3xl p-8 flex flex-col justify-center items-center shadow-md relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex justify-center items-center mb-8 border border-white/30 z-10">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {featuredResult.icon}
                      </span>
                    </div>
                    <div className="absolute bottom-8 left-8 z-10 flex gap-2">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[12px] font-semibold px-3 py-1 rounded-lg border border-white/20">
                        {featuredResult.subject} • {featuredResult.unit}
                      </span>
                    </div>
                    <h3 className="absolute bottom-16 left-8 z-10 text-white font-bold text-[24px] leading-tight max-w-[80%]">
                      {featuredResult.title.split('—')[0]}
                      <br/>
                      asoslari
                    </h3>
                  </div>

                  {/* Right Details Box */}
                  <div className="flex-1 flex flex-col justify-center gap-4 py-4 pr-4">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-2 bg-[#fcf9f8] px-3 py-1.5 rounded-lg border border-[#e5e2e1]">
                        <span className="material-symbols-outlined text-[#274ed5] text-[16px]">menu_book</span>
                        <span className="text-[#444654] font-bold text-[11px] tracking-wider uppercase">{t("ASOSIY MANBA")}</span>
                      </div>
                      <button className="text-[#444654] hover:text-[#1c1b1b] transition-colors">
                        <span className="material-symbols-outlined text-[24px]">bookmark_border</span>
                      </button>
                    </div>

                    <h2 className="text-[28px] font-bold text-[#1c1b1b] leading-tight mt-2">
                      {featuredResult.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-[#747686] text-[14px]">
                      <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                      <p>{t("Manba: ")}{featuredResult.sourceInfo}</p>
                    </div>

                    <p className="text-[#444654] text-[15px] leading-relaxed mt-2">
                      {featuredResult.desc}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-[#e5e2e1]">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-[#f0eded] rounded-lg text-[#444654] text-[12px] font-medium">
                          {t("Birlik: ")}{featuredResult.unit}
                        </span>
                        <span className="px-3 py-1 bg-[#f0eded] rounded-lg text-[#444654] text-[12px] font-medium">
                          {featuredResult.type}
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate(`/knowza-ai/lesson/${featuredResult.id}`)}
                        className="text-[#274ed5] font-semibold text-[15px] flex items-center gap-2 hover:underline group"
                      >
                        {t("O'qishni boshlash")}
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Results List */}
              <div className="w-full xl:w-1/3 flex flex-col gap-4 border-t xl:border-t-0 xl:border-l border-[#e5e2e1] pt-6 xl:pt-0 xl:pl-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[18px] font-bold text-[#1c1b1b]">{t("So'nggi natijalar")}</h3>
                  <button className="text-[#274ed5] text-[14px] font-semibold flex items-center hover:underline">
                    {t("Barchasi ")}<span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {otherResults.map(item => (
                    <div key={item.id} className="flex items-start gap-4 group cursor-pointer" onClick={() => navigate(`/knowza-ai/lesson/${item.id}`)}>
                      <div className={`w-14 h-14 ${item.bgColor || 'bg-gray-100'} rounded-xl flex items-center justify-center shrink-0`}>
                        <span className={`material-symbols-outlined ${item.iconColor || 'text-gray-600'} text-[24px]`}>
                          {item.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h4 className="text-[16px] font-bold text-[#1c1b1b] group-hover:text-[#274ed5] transition-colors leading-tight mb-1 truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#747686]">
                          <span className="material-symbols-outlined text-[14px]">{item.type === 'Video darslik' ? 'play_circle' : item.type === 'Test' ? 'quiz' : 'article'}</span>
                          <span className="truncate">{item.type} • {item.meta}</span>
                        </div>
                      </div>
                      <button className="text-[#747686] hover:text-[#1c1b1b] p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 4)}
                    className="w-full py-3 mt-4 border border-[#c4c5d7] rounded-xl text-[#444654] font-semibold text-[14px] hover:bg-[#fcf9f8] transition-colors flex justify-center items-center gap-1"
                  >
                    {t("Yana ko'rsatish ")}<span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white rounded-3xl border border-[#e5e2e1] mt-4">
              <span className="material-symbols-outlined text-[64px] text-[#c4c5d7]">search_off</span>
              <h3 className="text-[20px] font-bold text-[#1c1b1b] mt-4">{t("Kutubxonadan topilmadi")}</h3>
              <p className="text-[14px] text-[#444654] mt-2 max-w-md mx-auto">{t("Siz qidirayotgan mavzu kutubxonamizda hozircha mavjud emas. Boshqa kalit so'z bilan izlab ko'ring.")}</p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default KnowzaAISearch;
