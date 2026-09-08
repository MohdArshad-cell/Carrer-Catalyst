<div align="center">
  
# 🚀 Career Catalyst
### AI-Powered Resume Tailoring & Full-Stack Career Optimization Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-Queueing-DC382D?logo=redis&logoColor=white)](#)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

*Your unfair advantage in the modern job market.*

</div>

---

## 📖 Table of Contents
- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
  - [Premium SaaS Toolkit](#-premium-saas-toolkit)
  - [Free SEO & Viral Tools](#-free-seo--viral-tools)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Growth Infrastructure](#-growth-infrastructure)
- [Getting Started (Local Setup)](#-getting-started)

---

## 💡 About The Project

**Career Catalyst** is a state-of-the-art, full-stack application designed to instantly hyper-optimize resumes to pass Applicant Tracking Systems (ATS) and provide a comprehensive suite of career acceleration tools. 

Instead of just blindly injecting keywords, it uses intelligent LLM orchestration (Groq/Gemini), mathematical fuzzy matching, and dynamic tone scaling to rewrite resumes exactly how senior technical recruiters want to read them. It also features a built-in token economy, referral mechanics, and dedicated Admin monitoring.

---

## ✨ Key Features

### 💎 Premium SaaS Toolkit (Requires Tokens)
- **AI Resume Tailor:** Uses mathematical `rapidfuzz` algorithms to detect missing technical skills and rewrites bullet points to perfectly match the target Job Description using the STAR/XYZ formula. Compiles to PDF via Tectonic LaTeX.
- **ATS Evaluator:** Get a real-time, mathematical score on your resume's compatibility with Applicant Tracking Systems.
- **Cover Letter Generator:** Dynamically generates targeted, markdown-stripped cover letters.
- **Mock Interview Simulator:** Practice with AI-generated questions tailored to your target job.
- **LinkedIn Profile Optimizer:** Re-writes your headline, 'About' section, and experience to rank higher in LinkedIn Recruiter search algorithms.
- **Cold Outreach Drafter:** Generates personalized, high-converting cold emails/DMs to hiring managers based on their profile and the job description.
- **Career Roadmap:** Analyzes your current resume vs your "dream job" and generates a week-by-week upskilling roadmap.

### 🧲 Free SEO & Viral Tools (Lead Generation)
- **Bullet Rewriter (`/bullet-rewriter`):** Instantly converts a weak resume task into a metric-driven achievement.
- **Job Fit Calculator (`/job-fit`):** Client-side keyword matching tool to score your resume against a job description instantly.
- **Resignation Letter Generator (`/resignation-letter`):** Quick, form-based tool to draft professional resignation letters in various tones.
- **Resume Diff Checker (`/resume-diff`):** Client-side tool that shows exactly what lines were added/removed between an old resume and a tailored one.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
- **Framework:** React.js (React Router v6)
- **Styling & UI:** Tailwind CSS, custom CSS Glassmorphism, 3D interactive elements
- **Authentication:** Supabase Auth (Magic Links, OAuth)

### Backend (`/resume-engine`)
- **API Framework:** FastAPI
- **AI/LLMs:** Groq SDK, Google Generative AI (Gemini Flash)
- **Data & Rate Limiting:** Redis
- **Database:** Supabase PostgreSQL
- **Compiler:** Tectonic (LaTeX to PDF)

---

## 🏗️ System Architecture

1. **User Input:** User interacts with frontend tools (React).
2. **Auth & Gateway:** Supabase verifies the session. Paid endpoints require token deduction via JWT validation. Free endpoints use Redis IP-based rate limiting (e.g., 10 requests/hour).
3. **LLM Orchestration:** FastAPI backend parses requests, loads specific prompt templates, and queries Groq/Gemini.
4. **Data Validation:** Pydantic models strictly validate all JSON outputs from the LLM.
5. **Compilation (For Resumes):** The JSON output is converted to `.tex`, sanitized for special characters (like `%`, `&`, `#`), and compiled to PDF by Tectonic.
6. **Logging:** Every API request logs latency, token cost, and success/failure to a Supabase `generation_logs` table for Admin Dashboard monitoring.

---

## 🚀 Growth Infrastructure

- **Token Economy:** Users receive 15 free tokens upon signup. Each premium AI generation costs 1 token. Additional tokens can be purchased via Stripe.
- **Referral System:** Users have unique referral codes. When a friend signs up using their link (`/signup?ref=CODE`), both users receive 5 bonus tokens.
- **Usage History:** Users have full transparency over their token ledger in the `/history` dashboard.
- **Admin Dashboard:** Real-time visibility into `generation_logs`, live active users, failed API requests, and monthly revenue estimates.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- Redis Server (running locally on port `6379`)
- [Tectonic LaTeX Compiler](https://tectonic-typesetting.github.io/en-US/) installed and added to PATH.

### 1. Supabase Database Setup
Execute the following SQL files in your Supabase SQL Editor:
1. `supabase_migration_phase2.sql` (Initializes `generation_logs`)
2. `supabase_migration_phase5.sql` (Initializes `referrals` and `profiles`)

### 2. Backend Setup
```bash
cd resume-engine
python -m venv venv
venv\Scripts\activate   # (On Windows)
pip install -r requirements.txt

# Create a .env file with:
# GROQ_API_KEY=your_key
# GEMINI_API_KEY=your_key
# REDIS_URL=redis://localhost:6379
# SUPABASE_URL=...
# SUPABASE_KEY=...

uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create a .env file with:
# REACT_APP_SUPABASE_URL=...
# REACT_APP_SUPABASE_ANON_KEY=...
# REACT_APP_API_BASE_URL=http://localhost:8000

npm start
```

---

*Built for the future of recruiting.* 🚀
