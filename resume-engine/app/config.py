"""
Centralized configuration for the Career Catalyst Resume Engine.
Single source of truth for all service settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# LLM CONFIGURATION
# ==========================================
LLM_MODEL = "gemini-3.5-flash-lite"
LLM_MAX_OUTPUT_TOKENS = 8192
LLM_MAX_OUTPUT_TOKENS_SMALL = 4096  # For smaller outputs (JD analysis, evaluation)
LLM_TEMPERATURE = 0.2
LLM_TEMPERATURE_STRICT = 0.0  # For strict data extraction (evaluation)
LLM_MAX_RETRIES = 5

# ==========================================
# API KEYS
# ==========================================
GOOGLE_API_KEYS_RAW = os.getenv("GOOGLE_API_KEYS", os.getenv("GOOGLE_API_KEY", ""))
GOOGLE_API_KEYS = [k.strip() for k in GOOGLE_API_KEYS_RAW.split(",") if k.strip()]

if not GOOGLE_API_KEYS:
    raise ValueError("CRITICAL: Neither GOOGLE_API_KEYS nor GOOGLE_API_KEY environment variables are set.")

# ==========================================
# REDIS CONFIGURATION
# ==========================================
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_KEY_LOCK_TTL = 60  # seconds to lock a rate-limited API key
REDIS_KEY_PREFIX = "gemini_lock:"

# ==========================================
# CACHING
# ==========================================
JD_CACHE_TTL = 86400  # 24 hours
TASK_EXPIRY = 3600  # 1 hour

# ==========================================
# PATHS
# ==========================================
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent  # resume-engine/
APP_DIR = BASE_DIR / "app"
PROMPTS_DIR = APP_DIR / "prompts"
TEMPLATES_DIR = APP_DIR / "templates"
