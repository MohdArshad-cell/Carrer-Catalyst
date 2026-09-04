import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Try GOOGLE_API_KEYS
    keys = os.getenv("GOOGLE_API_KEYS", "")
    api_key = keys.split(",")[0].strip() if keys else ""

genai.configure(api_key=api_key)

print("Available models supporting generateContent:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
