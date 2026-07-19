# 🚀 Update v2.8.5 — B2C Payment History, Uzbek Electronic Receipts, Socratic PDF/Article Exports, AI Provider Load Balancer, and Custom Roadmaps

**Release Period:** July 1 – July 19, 2026  
**Commits:** ~5 (Frontend) · ~5 (Backend)  
**Lines Changed:** +1,650 / −480  

---

## 🎯 Release Goal

Introduce student-facing B2C payment history and printable Electronic Invoice Receipts (*Elektron Chek*) with direct PDF compilation. Overhaul personal profile AI settings with strict backend PRO subscription enforcement, locking memory and personalization behind verification gates. Establish an enterprise-ready Multi-Provider LLM Load Balancer with automatic API key rotation and resilient JSON extracting schemas. Align the AI Test Generator with professional academic standards (IELTS, SAT, Milliy Sertifikat) and customize roadmaps to specific study frequencies. Finally, implement Table of Contents (TOC) rendering, full-screen views, and contextual editing within the AI Research workspace.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Knowza`)

- **Electronic Invoice Receipting (`ReceiptModal.jsx`):** Developed a brand-new component rendering a professional, printable electronic invoice in Uzbek.
  - Features a decorative green "To'langan" (Paid) stamp overlay.
  - Embeds official registry parameters: company name ("KNOWZA" kompaniyasi), STIR (INN): 310123456, and Tashkent address.
  - Automatically formats transactional parameters (e.g., unique transaction ID `KNWZ-YYMMDD-XXXXX`).
  - Supports multiple payment methods: internal accounts (Stars/Yulduzcha), cards (Click/Payme), or free tiers.
  - Integrates a window-printing function with auto-reloads to restore React state cleanly.
- **Profile Page Tabs & Payment History (`Profile.jsx`):** Rebuilt the profile layout into three structured tabs: *Umumiy* (General), *Sozlamalar* (Settings), and *Ta'rif* (Tariff).
  - The *Ta'rif* tab displays the student's active plan, payment history records, and a legal notice detailing billing handling.
  - Integrates direct triggers to open the dynamic `ReceiptModal` for any billing record.
- **PRO Gating for Profile AI Settings:** Locked toggles for *AI Personalization* and *AI Memory*, as well as the memory summary text editor, behind `currentUser.is_premium` validation. Non-premium users are directed to the `ProUpgradeModal`.
- **Advanced AI Research Workspace (`Research.jsx`):**
  - **Dynamic Table of Contents (TOC):** Added a parser that scans headings (`h2`, `h3`), building a clickable, smooth-scrolling internal index.
  - **Contextual Article Editor:** Added editing states, allowing students to modify generated articles inside a rich text area and save changes back to the backend.
  - **PDF Export Pipelines:** Implemented direct PDF download triggers for active documents and in-list actions for saved items.
  - **Interface Controls:** Integrated a full-screen reader view, a deletion confirmation modal, and a list-spacing markdown helper.
- **Revamped Pro Pricing Layout (`Pro.jsx`):** Replaced static tables with glassmorphic cards featuring floating animated color orbs and quick-connect triggers to the Telegram billing desk.

### Backend (`Knowza-Backend`)

- **Multi-Provider LLM Load Balancer (`utils.py`):** Built a load balancer with automatic round-robin fallback.
  - Supports up to 10 API keys per provider across OpenAI, Anthropic, Gemini, and Groq.
  - Detects quota depletion or rate limits and automatically rotates to the next key or fallback provider.
- **Resilient JSON Parser (`extract_json`):** Enhanced extraction regex to parse both JSON objects and array lists from raw LLM responses.
- **Strict Profile Serialization Security (`UserSerializer`):** Hardened AI fields so that direct API requests from non-premium accounts trying to manipulate `is_ai_personalized`, `is_memory_enabled`, or `ai_memory_summary` are blocked and forced to `False`.
- **Academic Sandbox Test Standards (`test_generator`):** Overhauled test generator prompts to calibrate generated questions to IELTS, SAT, and Uzbekistan's *Milliy Sertifikat* standards.
- **Customized Roadmaps (`roadmap_engine.py`):** Integrated `AIProfile`'s new `target_deadline` and `time_commitment` fields, allowing the AI to structure sequential roadmap modules fitting specific weekly study intervals.
- **Premium API Safeguards (`KnowzaAIViewSet`):** Enforced backend checks to reject article generation (`ARTICLE_GEN`) and PDF compilation requests from accounts without active premium entitlements.

---

## 📐 Architecture Notes

- **Multi-Tenant Scoping & Enforcement:** Serializers strictly validate user-scoping, ensuring that students only access their own personalized summaries, roadmap nodes, and saved articles.
- **Separation of Concerns:** Isolated payment logic on the frontend to represent the student-facing B2C billing engine, while backend structures keep LMS institutional billing records strictly isolated.
- **Resiliency Patterns:** The combination of provider key-rotation, fallback models, and the updated JSON regex extractor prevents roadmap and test generation failures.

---

## 🗑 Cleanups

- **Obsolete Templates & Code:** Removed legacy CSS overrides and redundant markup structures in `Profile.jsx` (`e4bb562`, Jul 19).
- **Hardcoded Roadmap Layouts:** Deleted mock structures in the backend roadmap engine, replacing them with dynamic array parsing (`90cdd04`, Jul 13).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~5 |
| Backend Commits | ~5 |
| Total Files Changed | 12 |
| Lines Added | +1,650 |
| Lines Removed | -480 |
| Dynamic Components Added | 2 |
| Supported LLM Providers | 4 (OpenAI, Claude, Gemini, Groq) |
| Supported Exam Frameworks | 3 (IELTS, SAT, Milliy Sertifikat) |
