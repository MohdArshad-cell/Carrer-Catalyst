"""
Unified LLM Client for Career Catalyst.
Replaces 3 separate call_gemini_api() / key rotation / JSON parsing implementations
with a single, battle-tested module used by all services.
"""
import json
import re
import time
from functools import lru_cache
from pathlib import Path

import redis
import google.generativeai as genai

from app.config import (
    GOOGLE_API_KEYS, LLM_MODEL, LLM_MAX_OUTPUT_TOKENS,
    LLM_TEMPERATURE, LLM_MAX_RETRIES,
    REDIS_HOST, REDIS_PORT, REDIS_KEY_LOCK_TTL, REDIS_KEY_PREFIX,
    PROMPTS_DIR,
)


# ==========================================
# 1. REDIS-BACKED API KEY ROTATION
# ==========================================
_redis_client = None

def _get_redis():
    """Lazy Redis connection — won't crash if Redis is down."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            _redis_client.ping()
        except Exception as e:
            print(f"⚠️ Redis unavailable ({e}). Falling back to round-robin key rotation.")
            _redis_client = False  # Sentinel: attempted but failed
    return _redis_client if _redis_client else None


# Simple round-robin fallback counter
_round_robin_idx = 0


def get_api_key() -> str:
    """Get the next available (non-rate-limited) API key."""
    global _round_robin_idx
    
    r = _get_redis()
    if r:
        # Redis-backed: skip keys that are locked
        for key in GOOGLE_API_KEYS:
            if not r.exists(f"{REDIS_KEY_PREFIX}{key}"):
                return key
        # All keys locked — wait with backoff instead of hard sleep(2)
        print("⚠️ All API keys rate-limited. Using first key with short backoff.")
        time.sleep(0.5)
        return GOOGLE_API_KEYS[0]
    else:
        # Round-robin fallback (no Redis)
        key = GOOGLE_API_KEYS[_round_robin_idx % len(GOOGLE_API_KEYS)]
        _round_robin_idx += 1
        return key


def lock_api_key(key: str):
    """Mark a key as rate-limited in Redis for REDIS_KEY_LOCK_TTL seconds."""
    r = _get_redis()
    if r:
        try:
            r.setex(f"{REDIS_KEY_PREFIX}{key}", REDIS_KEY_LOCK_TTL, "locked")
        except Exception:
            pass  # Non-critical — next call will just retry the key


def get_redis_client():
    """Expose Redis client for services that need direct cache access (e.g., JD caching)."""
    return _get_redis()


# ==========================================
# 2. GEMINI API — SINGLE IMPLEMENTATION
# ==========================================
# Cache model instances per API key to avoid re-initialization
_model_cache: dict = {}


def _get_model(api_key: str) -> genai.GenerativeModel:
    """Get or create a cached GenerativeModel for the given API key."""
    if api_key not in _model_cache:
        genai.configure(api_key=api_key)
        _model_cache[api_key] = genai.GenerativeModel(model_name=LLM_MODEL)
    else:
        # Reconfigure in case a different key was used last
        genai.configure(api_key=api_key)
    return _model_cache[api_key]


def call_llm(
    prompt: str,
    *,
    schema=None,
    force_json: bool = True,
    temperature: float = None,
    max_output_tokens: int = None,
    max_retries: int = None,
) -> str:
    """
    Call the Gemini API with automatic key rotation, retry, and rate-limit handling.
    
    Args:
        prompt: The prompt text.
        schema: Optional Pydantic model — its JSON schema will be appended to the prompt.
        force_json: If True, request JSON response mime type.
        temperature: Override default temperature.
        max_output_tokens: Override default max tokens.
        max_retries: Override default retry count.
    
    Returns:
        Raw response text from the LLM.
    """
    _temperature = temperature if temperature is not None else LLM_TEMPERATURE
    _max_tokens = max_output_tokens or LLM_MAX_OUTPUT_TOKENS
    _max_retries = max_retries or LLM_MAX_RETRIES

    config_kwargs = {
        "max_output_tokens": _max_tokens,
        "temperature": _temperature,
    }
    if force_json:
        config_kwargs["response_mime_type"] = "application/json"

    if schema:
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        prompt = (
            prompt
            + "\n\nCRITICAL INSTRUCTION: You MUST return a raw, highly structured JSON object "
            "that exactly matches this OpenAPI schema. Do NOT wrap it in markdown backticks:\n"
            + schema_json
        )

    gen_config = genai.types.GenerationConfig(**config_kwargs)

    for attempt in range(_max_retries):
        api_key = get_api_key()
        model = _get_model(api_key)

        try:
            response = model.generate_content(prompt, generation_config=gen_config)
            return response.text
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg:
                print(f"⚠️ Rate limit hit (attempt {attempt + 1}/{_max_retries}). Locking key & rotating...")
                lock_api_key(api_key)
                # Exponential backoff: 0.5s, 1s, 2s, 4s...
                backoff = min(0.5 * (2 ** attempt), 8)
                time.sleep(backoff)
                continue

            print(f"❌ Gemini API Error (attempt {attempt + 1}): {str(e)}")
            if attempt == _max_retries - 1:
                raise RuntimeError(
                    f"Gemini failed permanently after {_max_retries} attempts: {str(e)}"
                ) from e

    raise RuntimeError(f"API Rate Limit: All {_max_retries} attempts exhausted.")


def call_llm_structured(
    prompt: str,
    *,
    response_schema=None,
    temperature: float = 0.0,
    max_output_tokens: int = None,
    max_retries: int = None,
) -> dict:
    """
    Call the Gemini API with native structured output (response_schema).
    Returns parsed dict directly. Used by evaluate_service.
    """
    _max_tokens = max_output_tokens or LLM_MAX_OUTPUT_TOKENS
    _max_retries = max_retries or LLM_MAX_RETRIES

    config_kwargs = {
        "temperature": temperature,
        "response_mime_type": "application/json",
    }
    if response_schema:
        config_kwargs["response_schema"] = response_schema

    for attempt in range(_max_retries):
        api_key = get_api_key()
        model = _get_model(api_key)

        try:
            response = model.generate_content(prompt, generation_config=config_kwargs)
            return json.loads(response.text)
        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg:
                print(f"⚠️ Rate limit hit (attempt {attempt + 1}/{_max_retries}). Locking key & rotating...")
                lock_api_key(api_key)
                backoff = min(0.5 * (2 ** attempt), 8)
                time.sleep(backoff)
                continue

            print(f"❌ Gemini Structured API Error (attempt {attempt + 1}): {str(e)}")
            if attempt == _max_retries - 1:
                raise RuntimeError(
                    f"Structured API failed after {_max_retries} attempts: {str(e)}"
                ) from e

    raise RuntimeError(f"Structured API: All {_max_retries} attempts exhausted.")


# ==========================================
# 3. JSON PARSING UTILITY
# ==========================================
def parse_ai_json(raw_text: str) -> dict:
    """
    Parse AI-generated JSON, handling markdown code fences and other quirks.
    Replaces extract_and_parse_ai_json() from tailor_service.
    """
    # Try direct parse first (fastest path)
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences: ```json ... ``` or ``` ... ```
    tick = chr(96)
    pattern = r'' + tick * 3 + r'(?:json)?\n?'
    clean_text = re.sub(pattern, '', raw_text).replace(tick * 3, '').strip()
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError as e:
        print(f"❌ FATAL JSON ERROR. Raw Output:\n{raw_text[:500]}")
        raise RuntimeError("CRITICAL: AI returned malformed JSON.") from e


# ==========================================
# 4. PROMPT FILE LOADER WITH CACHING
# ==========================================
@lru_cache(maxsize=32)
def load_prompt(service_name: str, filename: str) -> str:
    """
    Load a prompt file from app/prompts/{service_name}/{filename}.
    Results are cached in memory after first read.
    """
    file_path = PROMPTS_DIR / service_name / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Missing prompt file at: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()
