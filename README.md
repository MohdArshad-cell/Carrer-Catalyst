<div align="center">
  
# 🚀 Career Catalyst
### AI-Powered Resume Tailoring & ATS Optimization Platform

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
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started (Local Setup)](#-getting-started)
- [Automated Testing](#-automated-testing)

---

## 💡 About The Project

**Career Catalyst** is a state-of-the-art, full-stack application designed to instantly hyper-optimize resumes to pass Applicant Tracking Systems (ATS). Instead of just blindly injecting keywords, it uses intelligent LLM orchestration (Groq/Gemini), mathematical fuzzy matching, and dynamic tone scaling to rewrite resumes exactly how senior technical recruiters want to read them. 

Once the resume is perfectly tailored, the engine compiles it down to a highly professional, ATS-friendly PDF using the Tectonic LaTeX compiler.

---

## ✨ Key Features

### 🧠 Intelligent ATS Optimization
- **Semantic Fuzzy Matching:** Uses `rapidfuzz` mathematical algorithms to detect missing technical skills by accounting for synonyms, misspellings, and abbreviations (e.g., matching `NodeJS` with `Node.js`). 
- **Bonus Skill Injection:** Intelligently identifies "Good-to-Have" skills from Job Descriptions and seamlessly weaves them into the generated resume to secure top ATS rankings.
- **Dynamic Tone Calculator:** Automatically calculates the candidate's exact Years of Experience (YoE) using local Python algorithms and shifts the AI's writing persona (e.g., from an "Ambitious Junior" to a "Strategic Leader") avoiding the "AI Uncanny Valley".
- **XYZ / STAR Formula Enforcement:** Forces the AI to write bullets using action verbs that demonstrate architectural magnitude and business context, rather than just listing tasks.

### 🛡️ Hallucination Shields
- **Metric Verification Shield:** A regex-based post-processor that guarantees the AI never invents fake metrics or timelines, preserving perfect truthfulness.
- **Context Boundaries:** Prevents the AI from injecting backend tools into frontend projects, maintaining the logical flow of the candidate's actual history.

### ⚙️ High-Performance Infrastructure
- **Distributed Token Bucketing:** Uses Redis to manage API rate limits across a pool of LLM API keys.
- **Flawless LaTeX Compilation:** Advanced character sanitization ensures that complex symbols (like C++, C#, $, %) are safely escaped before the LaTeX engine generates the final PDF.
- **Cover Letter Generation:** Dynamically generates targeted, markdown-stripped cover letters perfectly aligned with the tailored resume.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
- **Framework:** React.js
- **Styling & UI:** Tailwind CSS, 3D interactive UI elements
- **Authentication:** Supabase Auth

### Backend (`/resume-engine`)
- **API Framework:** FastAPI
- **AI/LLMs:** Groq SDK, Google Generative AI (Gemini Flash)
- **Data & Queueing:** Redis
- **Algorithms:** `rapidfuzz` (Fuzzy String Matching)
- **Compiler:** Tectonic (LaTeX to PDF)

---

## 🏗️ System Architecture

1. **User Input:** User uploads their base JSON resume and a target Job Description URL/Text via the React frontend.
2. **Auth & Gateway:** Supabase verifies the session, and the request is passed to the FastAPI backend.
3. **Queue & LLM Load Balancing:** Redis locks the request to an available LLM API key using token bucketing to prevent rate-limit crashes.
4. **JD Analysis:** The AI extracts required skills, soft skills, and SDLC practices.
5. **Algorithmic Processing:** Python `rapidfuzz` calculates missing skills, and the YoE calculator determines the candidate tone.
6. **Surgical Tailoring:** The LLM rewrites the resume based on missing skills, strict STAR instructions, and context boundaries.
7. **Compilation:** The JSON output is converted to `.tex`, sanitized for special characters, and compiled to PDF by Tectonic.
8. **Delivery:** The tailored PDF and Cover Letter are returned to the frontend.

---

## 📂 Project Structure

```text
Career Catalyst/
├── frontend/                 # React Application
│   ├── src/                  # React Components & Pages
│   └── package.json          # Node dependencies
├── resume-engine/            # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py           # FastAPI Entrypoint
│   │   ├── models.py         # Pydantic Schemas
│   │   ├── prompts/          # AI System Instructions
│   │   └── services/         # Core Logic (Tailor, ATS, Cover Letter)
│   ├── tests/                # Pytest Test Suite
│   ├── requirements.txt      # Python dependencies
│   └── pytest.ini            # Pytest configuration
└── README.md                 # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- Redis Server (running locally on port `6379`)
- [Tectonic LaTeX Compiler](https://tectonic-typesetting.github.io/en-US/) installed and added to PATH.

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd resume-engine

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate   # (On Windows)
# source venv/bin/activate (On Mac/Linux)

# Install required dependencies
pip install -r requirements.txt

# Create a .env file and add your keys:
# GROQ_API_KEY=your_key
# GEMINI_API_KEY=your_key
# REDIS_URL=redis://localhost:6379

# Start the server (runs on http://localhost:8000)
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Create a .env.local file for Supabase keys
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# Start the development server
npm run dev
```

---

## 🧪 Automated Testing

The backend includes a rigorous, zero-API-cost test suite using `pytest` and `pytest-mock`. It tests string sanitization, fuzzy matching algorithms, mathematical ATS scoring, and AI markdown-stripping fallback logic.

To execute the test suite:

```bash
cd resume-engine

# Ensure your virtual environment is active
venv\Scripts\pytest -v tests/
```

---

*Built for the future of recruiting.* 🚀
