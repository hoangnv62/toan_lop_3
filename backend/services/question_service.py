import pandas as pd
from io import BytesIO
from typing import Literal
from pydantic import BaseModel
from config import init_chat_model
from errors import AppError


class _Answer(BaseModel):
    content: str
    isCorrected: Literal[0, 1]

class _Question(BaseModel):
    questionContent: str
    explanation: str
    answers: list[_Answer]

class _QuestionsResult(BaseModel):
    questions: list[_Question]


def generate_questions(num_questions: int, lesson_title: str, exam_description: str) -> list:
    prompt = f"""
    Bạn là giáo viên Toán lớp 3. Hãy tạo {num_questions} câu hỏi trắc nghiệm về chủ đề '{lesson_title}'. {exam_description}
    Mỗi câu hỏi có đúng 4 đáp án, trong đó chỉ 1 đáp án đúng (isCorrected = 1), 3 đáp án còn lại sai (isCorrected = 0).
    """
    try:
        ai = init_chat_model()
        result = ai.generate(prompt, response_model=_QuestionsResult)
        return [q.model_dump() for q in result.questions]
    except Exception as e:
        raise AppError(str(e), 500)


def import_from_excel(file_bytes: bytes) -> tuple[list, list]:
    df = pd.read_excel(BytesIO(file_bytes))
    df.columns = df.columns.str.strip().str.lower()
    required = ["câu hỏi", "đáp án a", "đáp án b", "đáp án c", "đáp án d", "đáp án đúng"]
    missing  = [c for c in required if c not in df.columns]
    if missing:
        raise AppError(f"File thiếu cột: {', '.join(missing)}", 400)

    questions  = []
    errors     = []
    label_map  = {"a": 0, "b": 1, "c": 2, "d": 3}

    for i, row in df.iterrows():
        content = str(row["câu hỏi"]).strip()
        if not content or content == "nan":
            continue
        correct_label = str(row["đáp án đúng"]).strip().lower()
        if correct_label not in label_map:
            errors.append(f"Dòng {i + 2}: đáp án đúng phải là a/b/c/d")
            continue
        correct_idx = label_map[correct_label]
        answers_raw = [str(row[f"đáp án {x}"]).strip() for x in ("a", "b", "c", "d")]
        explanation = str(row.get("giải thích", "")).strip()
        if explanation == "nan":
            explanation = ""
        questions.append({
            "questionContent": content,
            "explanation":     explanation,
            "answers": [
                {"content": c, "isCorrected": 1 if j == correct_idx else 0}
                for j, c in enumerate(answers_raw)
            ],
        })

    return questions, errors
