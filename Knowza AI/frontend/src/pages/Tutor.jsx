import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Seo from '../../components/Seo';
import apiService from '../../data/apiService';

const SUGGESTED_PROMPTS = {
  IELTS: [
    "IELTS Writing Task 2 inshoimni tekshirib, Band ball berib xatolarimni ko'rsat",
    "IELTS Speaking Part 2 'Describe a difficult decision' bo'yicha 8.0+ javob ber",
    "Writing Task 1 Bar Chart uchun eng kuchli kirish va umumiy xulosa frazalari",
    "Reading Matching Headings va True/False/Not Given uchun 100% ishlaydigan taktika"
  ],
  SAT: [
    "SAT Digital Math Module 2 dagi murakkab tenglamalar va geometriya yechimlari",
    "SAT Reading & Writing Words in Context bo'yicha eng ko'p tushadigan so'zlar",
    "Desmos kalkulyatoridan SAT Math da maksimal samarali foydalanish sirlari",
    "SAT Writing Boundaries & Transitions qoidalarini misollar bilan tushuntir"
  ],
  'Milliy Sertifikat': [
    "Milliy Sertifikat Ona tili va Adabiyot insho mezonlari bo'yicha A+ namuna",
    "Matematika Milliy Sertifikatdagi murakkab mantiqiy misollar yechimi",
    "Ingliz tili Milliy Sertifikat C1 daraja grammatik mashqlar va tahlili",
    "Tarix / Fizika bo'yicha testlarda eng ko'p chalg'itadigan savollar va yechimlari"
  ]
};

const KnowzaAITutor = () => {
  const { t } = useTranslation();
  const chatEndRef = useRef(null);
  const [selectedExam, setSelectedExam] = useState('IELTS');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Salom! Men sizning **Shaxsiy AI Tutor (Murabbiy)** ingizman. 🎓\n\nIELTS, SAT yoki Milliy Sertifikat bo'yicha istalgan savolingizni bering! Inshoingizni tekshirishim, maslahat berishim yoki murakkab mavzularni sodda tushuntirib berishim mumkin.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const promptContext = `Yo'nalish: ${selectedExam}. Savol: ${textToSend.trim()}`;
      const res = await apiService.knowzaAIChat(promptContext, null, 'tutor');

      let aiResponseText = '';
      if (typeof res === 'string') {
        aiResponseText = res;
      } else if (res && (res.response || res.content || res.message || res.data)) {
        aiResponseText = res.response || res.content || res.message || (typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
      } else {
        aiResponseText = "Javob olindi. Mashqlarni bajarishda davom eting!";
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Tutor response error:", err);
      toast.error(err?.message || t("Javob olishda muammo bo'ldi. Iltimos qaytadan urinib ko'ring."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t("Javob nusxalandi!"));
  };

  const handleSpeakText = (id, text) => {
    if ('speechSynthesis' in window) {
      if (speakingMessageId === id) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
      utterance.lang = 'en-US';
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      setSpeakingMessageId(id);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error(t("Ovozli eshitish brauzeringizda qo'llab-quvvatlanmaydi."));
    }
  };

  return (
    <>
      <Seo 
        title={t("AI Tutor — Sun'iy Intellekt Murabbiy | Knowza AI")} 
        description={t("AI Tutor bilan IELTS, SAT va Milliy Sertifikat bo'yicha barcha savollaringizga bir necha soniyada professional javob oling.")} 
      />

      <div className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-60px)] w-full max-w-5xl mx-auto bg-white rounded-[28px] md:rounded-[36px] border border-[#e5e2e1] shadow-xs overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#fcf9f8] border-b border-[#e5e2e1] flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white flex items-center justify-center border border-white/20 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#1c1b1b] leading-tight">{t("AI Tutor (Shaxsiy Murabbiy)")}</h2>
              <p className="text-[12px] text-[#444654] font-medium">{t("Istalgan savolingizni yozing — AI darhol yordam beradi")}</p>
            </div>
          </div>

          {/* Exam Selector */}
          <div className="flex items-center gap-1 bg-[#e5e2e1] p-1 rounded-2xl">
            {['IELTS', 'SAT', 'Milliy Sertifikat'].map((exam) => (
              <button
                key={exam}
                onClick={() => setSelectedExam(exam)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                  selectedExam === exam
                    ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white shadow-xs'
                    : 'text-[#444654] hover:text-[#1c1b1b]'
                }`}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#F5F6FA]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] md:max-w-[80%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div className={`w-8 h-8 rounded-2xl shrink-0 flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-[#1c1b1b] text-white'
                  : 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white border border-white/20'
              }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {msg.role === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>

              <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-[22px] text-[14px] leading-relaxed relative group ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white rounded-tr-none'
                    : 'bg-white text-[#1c1b1b] border border-[#e5e2e1] rounded-tl-none shadow-xs'
                }`}>
                  <div className="prose prose-sm max-w-none break-words text-inherit">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Actions for Assistant */}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-[#e5e2e1] flex items-center gap-2 text-[#747686]">
                      <button
                        onClick={() => handleCopyText(msg.text)}
                        className="p-1 hover:text-[#274ed5] transition-colors rounded-lg flex items-center gap-1 text-[12px] font-semibold"
                        title={t("Nusxalash")}
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        <span>{t("Nusxalash")}</span>
                      </button>
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.text)}
                        className={`p-1 transition-colors rounded-lg flex items-center gap-1 text-[12px] font-semibold ${
                          speakingMessageId === msg.id ? 'text-[#274ed5] font-bold' : 'hover:text-[#274ed5]'
                        }`}
                        title={t("Eshitish")}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {speakingMessageId === msg.id ? 'volume_off' : 'volume_up'}
                        </span>
                        <span>{speakingMessageId === msg.id ? t("To'xtatish") : t("Eshitish")}</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-[#747686] px-1 font-medium">{msg.time}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div className="p-4 bg-white rounded-[22px] rounded-tl-none border border-[#e5e2e1] flex items-center gap-2 text-[#274ed5]">
                <span className="w-2 h-2 rounded-full bg-[#274ed5] animate-ping"></span>
                <span className="text-[13px] font-bold">{t("AI Tutor o'ylanmoqda...")}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-white border-t border-[#e5e2e1] flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
          {SUGGESTED_PROMPTS[selectedExam]?.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 bg-[#fcf9f8] hover:bg-[#e8edff] text-[#274ed5] border border-[#c4d4ff] rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#e5e2e1] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-[#fcf9f8] p-2 rounded-2xl border border-[#e5e2e1] focus-within:border-[#274ed5] transition-all"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t("AI Tutor'ga savolingizni yozing (masalan: Inshoimni tekshir yoki IELTS strategiyasini tushuntir)...")}
              className="flex-1 bg-transparent px-3 py-2 text-[14px] text-[#1c1b1b] placeholder:text-[#747686] outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1f42ba] via-[#274ed5] to-[#4f75ff] text-white flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shrink-0 border border-white/20"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>

      </div>
    </>
  );
};

export default KnowzaAITutor;
