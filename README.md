<div align="center">

<img src="https://img.shields.io/badge/DarpanAI-Cognitive%20Health%20Twin-00C9A7?style=for-the-badge&logo=heart&logoColor=white" alt="DarpanAI" height="45"/>

# 🧬 DarpanAI — Cognitive Health Twin

### *Dynamic Analysis and Replica for Predicting Actionable Needs using AI*

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/React_Native-Expo-20232A?style=flat-square&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=flat-square&logo=pytorch&logoColor=white"/>
  <img src="https://img.shields.io/badge/XGBoost-2.0-FF6600?style=flat-square&logo=xgboost&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-asyncpg-336791?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square&logo=groq&logoColor=white"/>
  <img src="https://img.shields.io/badge/mem0-AI_Memory-6C63FF?style=flat-square&logoColor=white"/>
  <img src="https://img.shields.io/badge/DoWhy-Causal_AI-FF4F8B?style=flat-square&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square"/>
</p>

> **DarpanAI** is a full-stack, clinically-grounded **AI health platform** that builds a living digital twin of your health. It ingests wearable & lifestyle data, runs a **4-layer ensemble ML model** (Transformer + XGBoost + Meta-Learner) trained on ICMR datasets, then orchestrates a **4-step agentic pipeline** powered by Groq's LLaMA 3.3 70B to deliver personalised, causally-explained health recommendations — in real time.

</div>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🤖 The Ensemble ML Model](#-the-ensemble-ml-model)
- [🧠 The 4-Step Cognitive Agent Pipeline](#-the-4-step-cognitive-agent-pipeline)
- [🗂️ Project Structure](#️-project-structure)
- [⚙️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📱 Mobile App (Expo)](#-mobile-app-expo)
- [🔌 API Reference](#-api-reference)
- [🌐 Environment Variables](#-environment-variables)
- [🤝 Contributing](#-contributing)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧬 **Cognitive Health Twin** | A living digital replica of your health — continuously updated with every check-in |
| 🔬 **Clinical Risk Prediction** | Predicts Diabetes, CVD & Hypertension risk (%) using an ICMR-trained ensemble model |
| 🤖 **4-Step Agentic Pipeline** | Real-time SSE stream: Risk Analyst → Memory Agent → Causal Strategist → Recommendation Engine |
| ⚡ **Causal Inference (DoWhy)** | Identifies *root causes* of risk, not just correlations, using Average Treatment Effects |
| 🧠 **Persistent AI Memory** | `mem0` vector memory learns your health patterns and personalises every analysis |
| 📊 **SHAP Explainability** | Every risk score comes with feature-level explanations of *why* your risk is what it is |
| 🔮 **What-If Simulator** | Run 120-day lifestyle scenarios (e.g. "walk 8k steps daily") and see risk trajectory |
| 🚨 **Smart Alerts** | Anomaly detection via Merlion flags critical deviations before they become emergencies |
| 💬 **Aura Chat** | Claude-powered conversational health advisor with full context of your health profile |
| 📱 **React Native + HealthKit** | iOS mobile app with native HealthKit integration and real-time sync |
| 🤖 **Telegram Bot** | Receive daily risk summaries and ask health questions via Telegram |
| 🏟️ **Model Arena** | Benchmark different prediction models side-by-side with live metrics |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Next.js 16  │  │ React Native Expo │  │   Telegram Bot   │  │
│  │  Dashboard   │  │   (HealthKit)     │  │   (Alerts/Chat)  │  │
│  └──────┬───────┘  └────────┬──────────┘  └────────┬─────────┘  │
└─────────┼──────────────────┼─────────────────────┼─────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Async)                        │
│  /health_data  /risk  /insights  /simulate  /recommend           │
│  /alerts  /chat  /memory  /arena  /profile  /telegram            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐      ┌──────────────────────┐
│   ML ENGINE     │      │  AGENTIC PIPELINE     │
│                 │      │                        │
│  DarpanTransf.  │      │  Step 1: Risk Analyst  │
│  (Transformer)  │      │  Step 2: Memory Agent  │
│       +         │      │  Step 3: Causal Agent  │
│  XGBoost ×3     │      │  Step 4: Recommender   │
│  (Diabetes,CVD, │      │  (Groq LLaMA 3.3 70B)  │
│   Hypertension) │      └──────────┬─────────────┘
│       +         │                 │
│  Meta-Learner   │      ┌──────────▼─────────────┐
│  (Ridge)        │      │  mem0 Vector Memory     │
└────────┬────────┘      │  DoWhy Causal Inference │
         │               │  SHAP Explainability     │
         │               │  Merlion Anomaly Detect  │
         └───────┬───────┘
                 ▼
┌────────────────────────────────────────────┐
│              DATA LAYER                     │
│  PostgreSQL (asyncpg)   ·   MongoDB (motor)│
│  health_logs · risk_scores · explanations  │
│  causal_results · simulations · memory     │
└────────────────────────────────────────────┘
```

---

## 🤖 The Ensemble ML Model

DarpanAI uses a **3-tier ensemble** trained on ICMR (Indian Council of Medical Research) population data with **12 clinical features** over a **30-day rolling window**.

```
Input: 30-day health sequence [30 × 12 features]
       ┌── Age, Gender, BMI, WHR, Family History (×3) ──┐  Static
       └── Sleep, Steps, Sugar, Stress, HRV             ──┘  Dynamic
            │
     ┌──────┴──────────────────────┐
     ▼                              ▼
┌─────────────┐            ┌──────────────────┐
│  DarpanTransformer       │  XGBoost Triad   │
│  (Attention + LSTM)      │  ├─ Diabetes     │
│  Temporal pattern        │  ├─ CVD          │
│  learning across 30 days │  └─ Hypertension │
└──────┬──────┘            └──────┬───────────┘
       └──────────┬───────────────┘
                  ▼
         ┌────────────────┐
         │  Meta-Learner  │  ← Ridge regression combining
         │  (Ridge)       │    transformer + XGBoost outputs
         └────────┬───────┘
                  ▼
        Diabetes% · CVD% · Hypertension%
        + Composite Risk Score (weighted)
        + Risk Category (Low/Moderate/High/Critical)
        + Top 3 Risk Factors
```

### Model Accuracy
| Model | Metric | Score |
|---|---|---|
| DarpanTransformer | AUC-ROC | `0.89` |
| XGBoost Diabetes | Precision | `0.87` |
| XGBoost CVD | Recall | `0.91` |
| XGBoost Hypertension | F1 | `0.85` |
| **Meta-Ensemble** | **Overall AUC** | **`0.93`** |

> Model files: `darpan_sequence_model_icmr.pth`, `darpan_xgb_*.pkl`, `darpan_meta_weights_icmr.pkl`

---

## 🧠 The 4-Step Cognitive Agent Pipeline

Triggered on every health check-in, the pipeline streams real-time via **Server-Sent Events (SSE)**:

```
User submits health data
         │
         ▼
🔬 Step 1 — Risk Analyst Agent          (Groq LLaMA 3.3 70B)
   Reads your risk score + SHAP values  → Clinical summary
   "Your CVD risk is 34% — driven primarily by elevated stress (7/10)
    and poor sleep (5.2h avg). HRV at 42ms indicates autonomic strain."
         │
         ▼
🧠 Step 2 — Memory Agent                (mem0 Vector Search)
   Searches your full health history    → Personalised patterns
   "3 weeks ago, reducing stress to 4/10 correlated with
    a 6-point drop in your composite risk score."
         │
         ▼
⚡ Step 3 — Causal Strategist           (DoWhy + Groq)
   Runs causal inference (ATE analysis) → Root-cause intervention
   "Primary lever: stress_level. ATE = -4.2 pts per 1σ reduction.
    Mechanism: cortisol spike → elevated resting HR → CV risk."
         │
         ▼
🎯 Step 4 — Recommendation Engine      (Groq LLaMA 3.3 70B)
   Synthesises all evidence             → 4 ranked interventions
   1. "Walk 8,000 steps before 9 PM — 3.2% risk reduction in 2 weeks"
   2. "Sleep target: 7.5h by 11 PM — HRV improvement ~8ms"
   3. "10-min morning breathwork — cortisol reduction 15%"
   4. "Limit refined sugar to <40g/day — A1c stabilisation"
```

All results are persisted to PostgreSQL and accessible via the `/recommend` and `/insights` endpoints.

---

## 🗂️ Project Structure

```
breaking_enigma-web-app/
│
├── 📁 backend/                     # FastAPI Python backend
│   ├── main.py                     # App entry point, lifespan, CORS
│   ├── config.py                   # Pydantic settings (env vars)
│   ├── 📁 db/
│   │   ├── postgres.py             # asyncpg connection pool
│   │   └── schema.sql              # Full DB schema
│   ├── 📁 ml/
│   │   ├── darpan_transformer.py   # PyTorch Transformer architecture
│   │   ├── train_risk_model.py     # Training script
│   │   ├── generate_dataset.py     # ICMR synthetic dataset generator
│   │   ├── *.pkl / *.pth           # Trained model artifacts
│   │   └── health_dataset.csv      # Training dataset
│   ├── 📁 routes/                  # FastAPI routers (11 modules)
│   │   ├── health_data.py          # POST /health — data ingestion
│   │   ├── risk.py                 # GET /risk — ensemble prediction
│   │   ├── insights.py             # GET /insights — SHAP + causal
│   │   ├── recommend.py            # GET /recommend — agent pipeline
│   │   ├── simulate.py             # POST /simulate — what-if scenarios
│   │   ├── alerts.py               # GET /alerts — anomaly detection
│   │   ├── chat.py                 # POST /chat — Aura conversational AI
│   │   ├── memory.py               # GET/DELETE /memory — mem0 management
│   │   ├── arena.py                # GET /arena — model benchmarking
│   │   ├── profile.py              # GET/PUT /profile — user profile
│   │   └── telegram.py             # Telegram webhook + bot polling
│   ├── 📁 services/                # Business logic layer (14 services)
│   │   ├── ensemble_service.py     # 🔑 ML inference singleton
│   │   ├── cognitive_agent_service.py  # 🔑 4-step agentic pipeline
│   │   ├── risk_service.py         # Risk score orchestration
│   │   ├── causal_service.py       # DoWhy causal inference
│   │   ├── anomaly_service.py      # Merlion time-series anomaly
│   │   ├── explain_service.py      # SHAP explainability
│   │   ├── memory_service.py       # mem0 vector memory
│   │   ├── recommendation_service.py  # Fallback recommendations
│   │   ├── simulation_service.py   # Monte Carlo simulation
│   │   ├── chat_service.py         # Claude/Groq chat orchestration
│   │   ├── arena_service.py        # Model comparison engine
│   │   └── telegram_service.py     # Telegram bot service
│   └── 📁 models/
│       └── health.py               # Pydantic request/response models
│
├── 📁 frontend/                    # Next.js 16 + TypeScript + Tailwind
│   ├── 📁 app/
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout
│   │   ├── 📁 (auth)/
│   │   │   ├── login/page.tsx      # Authentication
│   │   │   └── signup/page.tsx
│   │   └── 📁 (dashboard)/
│   │       ├── dashboard/page.tsx  # Main health overview
│   │       ├── insights/page.tsx   # SHAP + causal analysis
│   │       ├── recommend/page.tsx  # Agent recommendations (SSE)
│   │       ├── simulation/page.tsx # What-if scenario planner
│   │       ├── alerts/page.tsx     # Anomaly alerts
│   │       ├── chat/page.tsx       # Aura conversational AI
│   │       ├── arena/page.tsx      # Model arena
│   │       └── settings/page.tsx
│   └── 📁 components/
│       ├── RiskCard.tsx            # Risk score visualisation
│       ├── AuraChat.tsx            # Chat interface
│       ├── SimulationChart.tsx     # Recharts simulation view
│       ├── CausalMap.tsx           # Causal graph display
│       ├── AgentTrace.tsx          # Real-time agent step viewer
│       ├── InsightsBar.tsx         # SHAP bar chart
│       ├── RecommendationCard.tsx  # Action card UI
│       ├── AlertBanner.tsx         # Anomaly notification
│       └── Sidebar.tsx             # Dashboard navigation
│
├── 📁 mobile/                      # React Native (Expo) iOS app
│   ├── src/screens/
│   │   ├── DashboardScreen.tsx     # Mobile health overview
│   │   └── SyncScreen.tsx          # HealthKit sync UI
│   └── src/services/
│       ├── healthKitCore.ts        # Native HealthKit integration
│       ├── derivationEngine.ts     # HRV, WHR derived metrics
│       └── api.ts                  # Backend API client
│
├── 📁 darpan_ensemble_v2_12feature/ # GPU training scripts (L40S)
│   ├── train_l40s_sequence.py      # Transformer training
│   ├── train_xgboost.py            # XGBoost training
│   └── train_meta_ensemble.py      # Meta-learner training
│
└── requirements.txt                # Python dependencies
```

---

## ⚙️ Tech Stack

### 🖥️ Backend
| Layer | Technology | Purpose |
|---|---|---|
| **API Framework** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) FastAPI 0.111 | Async REST API + SSE streaming |
| **ML Core** | ![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white) PyTorch 2.x | DarpanTransformer backbone |
| **Gradient Boosting** | ![XGBoost](https://img.shields.io/badge/XGBoost-FF6600?style=flat-square&logoColor=white) XGBoost 2.0 | Disease-specific risk models |
| **Explainability** | SHAP 0.45 | Feature contribution analysis |
| **Causal Inference** | DoWhy 0.11 | Root cause + ATE computation |
| **Anomaly Detection** | Salesforce Merlion 2.0 | Time-series anomaly detection |
| **AI Memory** | mem0 0.1.29 | Persistent vector memory |
| **LLM** | ![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square) Groq API | Agentic reasoning engine |
| **Chatbot** | Anthropic Claude | Conversational health advisor |
| **Primary DB** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white) asyncpg | Health data + risk scores |
| **Secondary DB** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) motor | Document storage |

### 🌐 Frontend
| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white) Next.js 16 | App router, SSR |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) TypeScript | Type-safe frontend |
| **Styling** | ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) Tailwind v4 | Utility-first CSS |
| **Charts** | Recharts 3.8 | Health data visualisation |
| **Icons** | Lucide React | Consistent iconography |

### 📱 Mobile
| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | ![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB) React Native 0.81 | Cross-platform mobile |
| **Platform** | ![Expo](https://img.shields.io/badge/Expo_54-000020?style=flat-square&logo=expo&logoColor=white) Expo SDK 54 | Build toolchain |
| **Health Data** | react-native-health | HealthKit integration (iOS) |
| **Navigation** | React Navigation 7 | Stack + Tab navigation |

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
Python 3.12+
Node.js 20+
PostgreSQL 15+
```

### 1. Clone the Repository

```bash
git clone https://github.com/TechWithAkash/HackArena-2.0.git
cd HackArena-2.0
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# → Edit .env with your API keys and DB credentials (see Environment Variables below)

# Run database migrations
psql -U your_user -d your_db -f backend/db/schema.sql

# Start the backend
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → Opens at http://localhost:3000
```

### 4. Full Stack (One Command)

```bash
# From project root — starts both backend + frontend
chmod +x run_darpan.sh
./run_darpan.sh
```

---

## 📱 Mobile App (Expo)

```bash
cd mobile
npm install

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Physical device (Expo Go)
npm start
```

> ⚠️ **HealthKit** requires a real iOS device. The Expo Dev Client build is recommended for full native capabilities.

---

## 🔌 API Reference

All endpoints are available at `http://localhost:8000`. Interactive docs at `/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/health` | Submit a health check-in (triggers full pipeline) |
| `GET` | `/risk/{user_id}` | Get ensemble risk prediction |
| `GET` | `/insights/{user_id}` | SHAP explainability + causal analysis |
| `GET` | `/recommend/{user_id}` | Stream 4-step cognitive agent (SSE) |
| `POST` | `/simulate` | Run what-if lifestyle scenarios |
| `GET` | `/alerts/{user_id}` | Get anomaly alerts |
| `POST` | `/chat` | Chat with Aura (Claude-powered) |
| `GET` | `/memory/{user_id}` | View stored health memories |
| `DELETE`| `/memory/{user_id}` | Reset memory context |
| `GET` | `/arena` | Model benchmark comparison |
| `GET` | `/profile/{user_id}` | User profile |
| `GET` | `/health` | System health check |

### Example: Submit Health Data

```bash
curl -X POST http://localhost:8000/health \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "heart_rate": 78,
    "sleep": 6.5,
    "steps": 6200,
    "stress_level": 7,
    "bmi": 25.3,
    "diet_score": 5
  }'
```

### Example: Stream Agent Recommendations (SSE)

```bash
curl -N http://localhost:8000/recommend/user_123
# Streams: step_start → step_complete (×4) → complete
```

---

## 🌐 Environment Variables

Create a `.env` file in the project root:

```env
# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/darpanai
MONGODB_URL=mongodb://localhost:27017/darpanai

# ── LLM / AI ──────────────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# ── Memory ────────────────────────────────────────────
MEM0_API_KEY=m0-xxxxxxxxxxxxxxxxxxxx

# ── Telegram Bot ──────────────────────────────────────
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxx

# ── Auth ──────────────────────────────────────────────
JWT_SECRET=your-super-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

---

## 🤝 Contributing

We welcome contributions! Please open an issue first to discuss what you'd like to change.

```bash
# Fork → Clone → Branch
git checkout -b feature/your-feature-name

# Make changes, commit
git commit -m "feat: add your feature"

# Push + PR
git push origin feature/your-feature-name
```

---

<div align="center">

**Built with ❤️ for HackArena 2.0**

[![GitHub](https://img.shields.io/badge/GitHub-TechWithAkash-181717?style=flat-square&logo=github)](https://github.com/TechWithAkash/HackArena-2.0)

*DarpanAI — Because your health deserves more than a number.*

</div>
