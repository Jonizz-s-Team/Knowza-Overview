# 🤖 Knowza AI — Features

Knowza AI is a **standalone platform** for students. It is not connected to school management or teachers. Students access Knowza AI with a **personal account and personal subscription**, receiving a personalized AI tutor and a full suite of self-directed learning tools.

---

## 🔑 Key Fact: Knowza AI is for Students Only

- **Target audience:** Students / learners / self-directed learners
- **Not for:** School administrators or teachers (they have the LMS)
- **Access:** Personal Knowza AI account or existing Knowza account with purchased access
- **Subscription:** Personal (B2C) — completely independent from any school tariff

---

## 🎓 Onboarding — Personal Profile Setup

On first entry, the student fills out their profile (`AIProfile`). Without this, the AI does not know who it is talking to or how to respond.

**What the student provides:**

- **Learning goal** — IELTS, DTM, CEFR, university entrance, or a custom goal
- **Target result** — e.g. `"IELTS 7.5"` or `"DTM 180 points"`
- **Current level** — Zero / Basic / Advanced
- **Primary subject** — Mathematics, English, Physics, etc.
- **AI response language** — Uzbek (Latin), Uzbek (Cyrillic), Russian, Mixed
- **Daily study time** — `"2 hours"`, `"1.5 hours"`
- **Time to reach goal** — `"6 months"`, `"3 months"`
- **Grade or age** — `"11th grade"`, `"17"`
- **City and country** — for regional context

> All of these fields are injected into **every single AI response** for maximum personalization.

---

## 🤖 AI Tutor (Chat)

The core feature of Knowza AI. The student converses with the AI like a personal tutor.

**What it can do:**

- **Simple explanation** — short, clear answer to a question (`EXPLAIN_SIMPLE`)
- **Deep explanation** — comprehensive, multi-angle breakdown of a topic (`EXPLAIN_DEEP`)
- **Simplify** — rewrite a complex text in plain language (`SIMPLIFY`)
- **Deepen** — expand on a previous response with more detail (`DEEPEN`)
- **Help during a test** — hints without spoilers (`TEST_HELP`)
- **Analyze mistakes** — post-exam performance breakdown (`TEST_FEEDBACK`)

**Chat features:**

- Responds in the student's language (auto-detected or set by profile)
- Adapts explanation complexity to `current_level`
- Knows the student's learning goal and contextualizes examples accordingly
- Saves session history — the student can continue a conversation later
- Supports **streaming** — response appears progressively, like ChatGPT

---

## 🧠 Long-Term Memory

Knowza AI remembers each student between sessions and gets smarter over time.

- Every 10 messages the AI automatically updates a **compressed summary** about the user
- In future responses, the AI knows: what the student has already studied, where they struggled, what they enjoy
- The student can enable or disable memory collection in settings
- Memory is stored in `ai_memory_summary` — a private field accessible only to the AI

---

## 🗺 Personalized Learning Roadmap

AI builds an individual study plan for each student.

**How it works:**
1. Student taps "Generate Roadmap"
2. AI analyzes: goal, level, target score, daily time, deadline
3. A `LearningPath` is created — a sequential list of topics to study
4. Each topic (`LearningNode`): name, description, estimated time, status

**Node statuses:**

```
🔒 Locked → ✅ Available → ▶️ In Progress → ✅ Completed
```

- Cannot move to the next topic without finishing prerequisites
- Any node can be regenerated if it doesn't fit the student's needs

---

## 📋 Daily Missions — Task Queue

Every day, Knowza AI generates a personalized task list.

**Task types:**

| Type | Description |
|---|---|
| `lesson` | Study a new topic |
| `test` | Take a test on recently studied material |
| `review` | Revisit previously covered content |
| `practice` | Solve practical exercises |

**Priorities:** `high` / `medium` / `low` — based on skill gaps and deadline proximity

- Tasks are linked to Roadmap nodes — completing a task advances node progress
- Marked as done via a "Complete" action

---

## 🧪 Sandbox Tests (AI-Generated)

The student can request an AI-generated test on any topic at any time.

**Student provides:**
- Topic (`"Quadratic Equations"`, `"Past Perfect"`, `"Newton's Laws"`)
- Difficulty (defaults to profile level if not set)

**Student receives:**
- A full test with questions and answer options
- After submission — automatic error analysis
- Weak topics recorded in `SkillGap` and factored into future daily missions

---

## 🤔 Socratic Coach — Smart Error Breakdown

After a wrong answer, the AI **does not reveal the correct answer immediately**. It asks guiding questions.

**Example:**
- Student answered `2x + 5 = 13` incorrectly
- AI: *"What do you think needs to happen first to isolate x?"*
- Student thinks, tries again — learns actively instead of passively

This approach builds **critical thinking** and improves long-term retention.

---

## 📰 AI Articles with Web Search

The student can ask AI to write a deep educational article on any topic.

**Process:**
1. AI performs a **live web search** (top 3 sources)
2. Finds a **YouTube video** on the topic and appends the link
3. Generates a full article (up to 8192 output tokens)
4. Runs a **Reflection Loop** — verifies accuracy before delivery
5. Caches result in **semantic cache** — similar future requests return instantly

The student can save any article to their personal library (`SavedResearch`).

---

## 📊 Personal Analytics

The Knowza AI dashboard shows the student:

- **Streak** — active learning day series (own system, separate from LMS)
  - Current streak
  - Best streak ever
  - Date of last activity
- **Skill Gaps** — topics with frequent mistakes (`SkillGap`)
  - Topic name
  - Subject
  - Error count
  - Status: `weak` (needs work) / `ok`
- **Goal progress** — how far to the `target_score`

---

## 💾 Personal Library

Students can save AI-generated materials:

- **Saved Research** — saved AI articles on topics
- Available at any time for review
- Can be used as personal study notes

---

## 🔐 Knowza AI Subscription

Knowza AI has its **own separate access system**, completely independent from any school or LMS subscription.

| Tier | What it includes |
|---|---|
| **Free** | Limited AI requests per day |
| **Knowza AI Premium** | Unlimited access, priority LLM routing, long-term memory, full personalization, PDF export |

> **Knowza AI and Knowza LMS are two completely separate products with separate subscriptions.** Being enrolled at a school on Knowza LMS does **NOT** grant Knowza AI access — and a Knowza AI Premium subscription does not include LMS access. There is no shared subscription between them.

---

## 🌍 Language Support

Knowza AI responds in the student's language, detected automatically or set by profile:

- 🇺🇿 Uzbek (Latin script)
- 🇺🇿 Uzbek (Cyrillic script)
- 🇷🇺 Russian
- 🇺🇸 English
- Mixed — combination of languages (common in Uzbekistan)
