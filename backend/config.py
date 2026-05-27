import os
from dotenv import load_dotenv
import instructor
from openai import OpenAI

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

DEFAULT_MODEL = "openai/gpt-oss-120b:free"

_base_client = instructor.from_openai(
    OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        timeout=60,
        max_retries=1,
    ),
    mode=instructor.Mode.JSON,
)


class _ChatModel:
    def __init__(self, model: str):
        self.model = model

    def generate(self, prompt: str, response_model=None):
        kwargs = dict(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            top_p=0.7,
        )
        if response_model is not None:
            kwargs["response_model"] = response_model
            return _base_client.chat.completions.create(**kwargs)
        response = _base_client.chat.completions.create(
            **kwargs,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content


def init_chat_model(model: str = DEFAULT_MODEL) -> _ChatModel:
    return _ChatModel(model)
