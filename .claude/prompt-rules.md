# Quy chuẩn Prompt Engineering

## Nguyên tắc cốt lõi

1. **Prompt không được hardcode trong source code** — lưu trong file `.md` riêng
2. **System prompt phải load từ file** khi khởi động Agent
3. **Prompt cho JSON output** phải khai báo schema rõ ràng
4. **Không log nội dung prompt** hoặc dữ liệu nhạy cảm

---

## Vị trí lưu Prompt

```
backend/src/prompts/
  teacher-system.md     ← System prompt cho Teacher Agent
  student-system.md     ← System prompt cho Student chatbot
  tool-rules.md         ← Hướng dẫn LLM dùng tool (optional, nhúng vào teacher-system)
```

Load trong agent:

```javascript
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const TEACHER_PROMPT = await readFile(join(__dir, '../../prompts/teacher-system.md'), 'utf-8');
```

---

## Cấu trúc System Prompt

```markdown
# Role
Bạn là [vai trò cụ thể] dành cho [đối tượng].

# Nhiệm vụ
- Nhiệm vụ 1
- Nhiệm vụ 2

# Giới hạn
- Điều không được làm 1
- Điều không được làm 2

# Quy tắc trả lời
- Ngôn ngữ: tiếng Việt
- Độ dài: tối đa X từ

# Tools (nếu có)
Khi người dùng yêu cầu tìm/lưu câu hỏi hoặc xem thống kê, hãy dùng tool thay vì tự tạo dữ liệu.
```

---

## Prompt cho JSON Output (`generateJSON`)

Phải khai báo đủ 3 thành phần:

```javascript
const prompt = `
[Role]: Bạn là giáo viên Toán lớp 3.

[Context]: 
Dữ liệu lớp học:
- Điểm trung bình: ${avg}/10
- Tổng học sinh: ${totalStudents}
- Phân bố: 0–4: ${dist['0-4']}, 4–6: ${dist['4-6']}, 6–8: ${dist['6-8']}, 8–10: ${dist['8-10']}

[Task]: Đưa ra CHÍNH XÁC 3 lời khuyên ngắn gọn, thực tế.

[Output Format]:
Trả về JSON theo đúng format sau, không thêm text ngoài JSON:
{"advices": [{"title": "...", "detail": "..."}, ...]}
`;
```

**Quy tắc:**
- Số lượng kết quả: luôn chỉ định rõ ("CHÍNH XÁC 3", không phải "một vài")
- Schema JSON: khai báo đầy đủ tên field và kiểu dữ liệu
- "không thêm text ngoài JSON": tránh LLM bọc thêm markdown
- Temperature 0.1 cho generateJSON (ổn định)

---

## Fallback cho AI Failures

Mọi AI call trong service phải có fallback:

```javascript
export const getAiAdvice = async (avg, totalStudents, dist) => {
  try {
    const result = await generateJSON(buildPrompt(avg, totalStudents, dist));
    return result.advices || [];
  } catch {
    return FALLBACK_ADVICES;  // hardcoded tiếng Việt, không throw
  }
};

const FALLBACK_ADVICES = [
  { title: 'Củng cố kiến thức nền', detail: 'Dành thời gian ôn lại các phép tính cơ bản.' },
  { title: 'Tăng hoạt động thực hành', detail: 'Lồng ghép trò chơi toán học để tăng hứng thú.' },
  { title: 'Phân hóa bài tập', detail: 'Giao bài theo mức độ phù hợp từng học sinh.' },
];
```

---

## Tool Calling Prompt (Teacher System)

System prompt cho Teacher Agent cần hướng dẫn LLM khi nào dùng tool:

```markdown
# Khi nào dùng Tool

- Giáo viên yêu cầu tìm câu hỏi → dùng `search_question_bank`
- Giáo viên muốn lưu câu hỏi vào ngân hàng → dùng `save_questions_to_bank`
- Giáo viên hỏi về kết quả/điểm của lớp → dùng `get_student_stats`

Không tự bịa dữ liệu học sinh hoặc câu hỏi khi có tool có thể lấy từ hệ thống.
Sau khi tool trả kết quả, tổng hợp và trình bày cho giáo viên dễ hiểu.
```

---

## Prompt cho Question Generation

```javascript
const prompt = `Bạn là giáo viên Toán lớp 3. Hãy tạo ${numQuestions} câu hỏi trắc nghiệm về chủ đề '${lessonTitle}'.
${examDescription ? `Yêu cầu: ${examDescription}` : ''}

Quy tắc:
- Mỗi câu có đúng 4 đáp án
- Chỉ 1 đáp án đúng (isCorrected = 1), 3 đáp án còn lại sai (isCorrected = 0)
- Câu hỏi phù hợp trình độ học sinh 8–9 tuổi
- Nội dung về Toán lớp 3 Việt Nam (cộng, trừ, nhân, chia, đo lường, hình học cơ bản)

Trả về JSON:
{"questions": [{"questionContent": "...", "explanation": "...", "answers": [{"content": "...", "isCorrected": 0}]}]}`;
```

---

## Model Settings

| Usecase | Function | Temperature | Notes |
|---------|----------|-------------|-------|
| Chat streaming | `streamChat()` | 0.7 | Conversational |
| JSON generation | `generateJSON()` | 0.1 | Deterministic |
| Teacher agent call 1 | `chatCompletion()` | 0.3 | Tool detection |
| Teacher agent call 2 | `streamChat()` | 0.7 | Final response |

Default model: `openai/gpt-oss-120b:free` (OpenRouter).
Nếu model không hỗ trợ tool calling → đổi model cho Teacher Agent riêng (chỉ teacher agent).

---

## Giới hạn Response

- Student: tối đa 150 từ/câu trả lời — ghi trong system prompt
- Teacher (chat thường): tối đa 200 từ/câu trả lời
- Tool result: không giới hạn từ (trả đủ dữ liệu từ DB)
