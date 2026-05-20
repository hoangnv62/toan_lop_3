import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

app_secret_key = os.getenv("SECRET_KEY", "math_secret_key")

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "math_elearning"),
}

# Cấu hình AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# model = None
# if :
#     genai.configure(api_key=api_key)
#     try:
#         model = genai.GenerativeModel("models/gemini-2.5-flash")
#     except:
#         model = genai.GenerativeModel("gemini-1.5-flash")

DEFAULT_MODEL = "models/gemini-2.5-flash"
_client = genai.Client(api_key=GEMINI_API_KEY)


def gemini_generate(prompt: str):
    config = {"response_mime_type": "application/json"}
    response = _client.models.generate_content(
        model=DEFAULT_MODEL, contents=prompt, config=config
    )
    return response.text


def check_gemini():
    try:
        gemini_generate("ping")
    except Exception:
        raise RuntimeError("❌ Gemini API key không hợp lệ")
