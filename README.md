# Career Catalyst 🚀

Career Catalyst is an advanced, AI-powered platform designed to hyper-optimize resumes for Applicant Tracking Systems (ATS). By deeply analyzing target Job Descriptions (JDs), Career Catalyst surgically tailors resumes using semantic matching, enforces quantifiable impact metrics (the STAR method), and dynamically adjusts its writing tone based on the candidate's exact years of experience.

## ✨ Key Features

* **Intelligent ATS Scoring:** Evaluates resumes against must-have technical skills, soft skills, and SDLC practices.
* **Semantic Fuzzy Matching:** Employs advanced fuzzy string matching (via `rapidfuzz`) to accurately identify missing skills, accounting for synonyms and abbreviations (e.g., `NodeJS` vs `Node.js`).
* **Zero-Latency Tone Calculation:** A localized, non-AI calculation engine determines a candidate's Years of Experience (YoE) to seamlessly shift the generated resume's tone (Junior vs. Senior Executive) without triggering "AI uncanny valley" red flags.
* **Bonus Skill Injection:** Automatically identifies "Good-to-Have" skills from the JD and weaves them into the generated resume to maximize the candidate's ATS rank.
* **Cover Letter Generation:** Generates highly targeted cover letters customized for the specific job and candidate.
* **Robust Verification Shields:** Prevents AI hallucinations by strictly dropping mathematically impossible metrics and blocking the injection of backend skills into frontend-focused project bullets.
* **PDF LaTeX Compilation:** Automatically sanitizes complex characters and compiles the final tailored resume directly to a high-quality PDF using Tectonic.

## 🏗️ Architecture

This is a full-stack monorepo consisting of:

* **Frontend (`/frontend`)**: A modern React application featuring interactive 3D UI elements and Supabase Authentication.
* **Backend (`/resume-engine`)**: A high-performance Python FastAPI server.
    * **AI Engine**: Powered by Groq/Gemini for structured JSON generation.
    * **Queue & Rate Limiting**: Redis is utilized for distributed token bucketing and API key rotation to handle scale gracefully.
    * **Testing**: Features a comprehensive, mocked internal `pytest` suite simulating extreme edge cases.

## 🚀 Getting Started

### 1. Backend Setup (`/resume-engine`)
The backend requires Python 3.10+ and a local Redis server running.

```bash
cd resume-engine

# Create a virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload
```

### 2. Frontend Setup (`/frontend`)
The frontend requires Node.js.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🧪 Testing

The Python backend features an automated testing suite that uses `pytest` and `pytest-mock` to rigorously validate the LaTeX sanitizer, ATS scoring logic, fuzzy matching, and tone calculations without spending real API tokens.

To run the suite:
```bash
cd resume-engine
venv\Scripts\pytest -v tests/
```

## 📄 License
This project is proprietary.
