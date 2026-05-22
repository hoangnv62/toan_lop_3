import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

app_secret_key = os.getenv("SECRET_KEY", "math_secret_key")

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASS", "")
DB_NAME     = os.getenv("DB_NAME", "math_learning")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    "?charset=utf8mb4"
)

DEFAULT_MODEL  = "models/gemini-2.5-flash"
_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def gemini_generate(prompt: str) -> str:
    response = _client.models.generate_content(
        model=DEFAULT_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return response.text
