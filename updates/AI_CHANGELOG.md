# 🤖 Knowza AI — Release History

Knowza AI is a **standalone platform** for students — completely separate from Knowza LMS. It is a personal AI tutor with its own subscription, onboarding, study roadmap, and long-term memory system.

For full technical documentation: [`docs/AI_ARCHITECTURE.md`](../docs/AI_ARCHITECTURE.md)
For the full feature list: [`docs/AI_FEATURES.md`](../docs/AI_FEATURES.md)
For the full platform changelog: [`updates/README.md`](README.md)

---

## 📅 Knowza AI Timeline

| Version | Period | AI Milestone |
|---|---|---|
| **v2.8.5** | Jul 1–19, 2026 | Multi-Provider key rotation · Uzbek electronic invoice PDF · Academic exam sandbox tests |
| **v2.8.0** | Jun 21–30, 2026 | Universal Access · Full personalization fields exposed in API |
| **v2.7.5** | Jun 12–19, 2026 | AI UI consolidated into dedicated chat interface |
| **v2.0.0** | Apr 1–27, 2026 | **🔴 Major:** KnowzaShield · Groq gateway · Structured JSON · Quota UI |
| **v1.2.0** | Jan 11–31, 2026 | **⭐ First AI:** Google Gemini chat · Notes sidebar · Client-side pipeline |

---

## v2.8.5 — Multi-Provider Key Rotation, Dynamic Uzbek Invoices & Academic Exam Standards
**July 1 – July 19, 2026**

### What changed

**Dynamic Uzbek Electronic Receipts & PDF Compiler**
- Added `ReceiptModal` to output official-grade printable and downloadable billing receipts in Uzbek, fully branded under the KNOWZA parent company (including STIR/INN: 310123456, stamp overlays, and formatted receipt IDs).
- Extended profile `Tarif` tab to host student payment history with active billing entries, loading data via `apiService.getPremiumPurchases()` and exposing printable invoices.

**Multi-Provider Load Balancer with Key Rotation**
- Implemented a server-side LLM provider Load Balancer in the backend (`utils.py`). The gateway rotates up to 10 keys per provider across OpenAI, Anthropic, Gemini, and Groq, detecting rate limits or quota errors and falling back automatically to ensure high availability.
- Overhauled JSON extraction regex in `extract_json` to parse nested structures and lists dynamically.

**Academic Exam Sandbox Test Standards**
- Rewrote `test_generator` prompting pipelines to align generated practice tests with IELTS, SAT, and Uzbekistan's *Milliy Sertifikat* scoring and styling formats.
- Structured teacher-facing guidelines for these tracks to improve test content quality.

**Strict Pro Gating & AI Profile Controls**
- Implemented strict validation checks in `UserSerializer` to ensure unauthorized API calls cannot alter personalization and memory fields (`is_ai_personalized`, `is_memory_enabled`, `ai_memory_summary`) on non-premium profiles.
- Integrated `ProfileGoalsSection` and `GoalEditModal` on the frontend, enforcing limitations and showing dedicated locking badges.

**AI Research Page Enhancement**
- Added a dynamic Table of Contents (TOC) builder, full-screen mode, contextual article editor, and list formatting helper for saved research documents.

---

## v2.8.0 — Universal Access & Full Personalization Profile
**June 21 – June 30, 2026**

### What changed

**Universal Access System (Knowza ID Premium)**

A unified premium tier was introduced allowing a single subscription to unlock all Knowza services including Knowza AI:

- `has_universal_access` — boolean flag on the `User` model: grants unrestricted Knowza AI access
- `universal_access_expiry` — expiry datetime for the universal access period

This is the **only case** where one subscription gives access to both products (LMS + AI). In all other cases, subscriptions are separate and independent.

**Full AI Personalization Fields Exposed via API**

The following fields (on the `User` model) that directly shape every AI response are now fully readable and writable through the API:

| Field | What it does |
|---|---|
| `age` | Adjusts vocabulary and explanation complexity |
| `current_level` | Sets explanation depth (Zero → Advanced) |
| `target_goals` | Injected into study planning prompts |
| `study_days` | Used in roadmap scheduling |
| `study_hours_per_day` | Determines roadmap intensity |
| `interests` | Provides contextual examples in explanations |
| `ai_persona` | Sets AI style (`motivator`, `strict`, `friendly`) |
| `ai_memory_summary` | Long-term memory injected into every prompt |
| `is_ai_personalized` | Toggle to enable/disable personalization |
| `is_memory_enabled` | Toggle to allow AI to collect and update memory |

**AI Access via Institutional Tariff**

The tariff enforcement engine now integrates with AI quota checks, ensuring institutional subscriptions correctly gate AI feature access for students under an institution's plan.

---

## v2.7.5 — AI Interface Consolidation
**June 12 – June 19, 2026**

### What changed

In earlier versions, AI-branded widgets were scattered across the LMS interface (`AIAnalysisCard`, AI analytics overlays in the student dashboard). In v2.7.5, these were removed.

**Why this was the right call:** Knowza AI is a separate environment. AI functionality should live in its own dedicated space — not as scattered widgets inside the LMS dashboard. This was an important step toward a clean product separation.

**What did NOT change:**
- The server-side `KnowzaAIEngine` continued operating without any changes
- All intents (`explain`, `test_gen`, `socratic`, `article_gen`, etc.) remained fully functional
- `AIChatHistory` preserved all user sessions — no conversation data was lost

---

## v2.0.0 — KnowzaShield, Multi-Provider Gateway & AI Quotas
**April 1 – April 27, 2026**

### What changed

This was the **most significant AI engineering release** — moving from a client-side Gemini call to a **server-authoritative AI engine** with security, multi-provider routing, and quota controls.

**KnowzaShield AI Firewall**

Every request to Knowza AI now passes through a server-side security layer before reaching any LLM:

- Detects prompt injection in English, Russian, and Uzbek
- Blocks jailbreak patterns: `DAN mode`, `god mode`, `ignore previous instructions`, etc.
- Rejects adversarial requests before any tokens are consumed
- All blocked requests logged for abuse monitoring

**Multi-Provider Gateway (Foundation)**

Groq was added as the first alternative LLM provider, establishing the load-balancing gateway architecture. The system now supported automatic fallback between providers — a pattern later expanded to 4 providers (OpenAI, Claude, Gemini, Groq) with up to 10 API keys each.

**Structured JSON Output**

AI responses now return structured JSON with metadata:
```json
{
  "text": "...",
  "metadata": {
    "intent": "explain_simple",
    "language": "ru",
    "cached": false,
    "estimated_tokens": 420
  }
}
```

**AI Usage Quota UI for Students**

Students can now see their remaining AI quota via an animated usage badge with a dropdown. The badge pulses when the quota is running low.

**AI Notch Button**

A floating `AINotchButton` component provides quick access to Knowza AI from anywhere in the interface.

---

## v1.2.0 — First AI Integration (Google Gemini)
**January 11 – January 31, 2026**

### What changed

This was the very first Knowza AI feature — an experimental chat powered by **Google Gemini API** running entirely on the client side.

**AI Chat**
- Students could ask educational questions and receive AI answers
- Basic mode: no memory, no session history, no intent routing
- Ran via direct client-side Gemini API calls (not server-side)

**Notes Sidebar**
- Students could select text from AI responses and save it to a personal notes sidebar
- Saved notes persisted locally for review

**What this evolved into**

The client-side Gemini integration was the seed for the server-side `KnowzaAIEngine` built in v2.0.0. The move to server-side was driven by three needs:
1. **Security** — API keys cannot be exposed on the client
2. **Memory** — session history must live on the server
3. **Intent routing** — different questions require different LLM configurations

---

## 🔮 What's Next for Knowza AI

Based on the platform roadmap:

- **Mobile App** — Knowza AI in a native mobile client (React Native / Flutter)
- **Flexible AI Quota Packages** — tiered call bundles for different student needs
- **Voice Mode** — interact with the AI tutor through voice
- **AI Content Marketplace** — AI-curated learning content for self-directed learners
