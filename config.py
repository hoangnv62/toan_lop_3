import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app_secret_key = os.getenv("SECRET_KEY", "math_secret_key")

db_config = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "elearning_math_db"),
}

# Cấu hình AI
api_key = os.getenv("GEMINI_API_KEY")
model = None
if api_key:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
    except:
        model = genai.GenerativeModel("gemini-1.5-flash")
