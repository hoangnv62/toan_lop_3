import XLSX from 'xlsx';
import { generateJSON } from '../utils/ai.js';
import { AppError } from '../utils/error.utils.js';

export const generateQuestions = async (numQuestions, lessonTitle, examDescription) => {
  const prompt = `Bạn là giáo viên Toán lớp 3. Hãy tạo ${numQuestions} câu hỏi trắc nghiệm về chủ đề '${lessonTitle}'. ${examDescription}
Mỗi câu hỏi có đúng 4 đáp án, trong đó chỉ 1 đáp án đúng (isCorrected = 1), 3 đáp án còn lại sai (isCorrected = 0).
Trả về JSON: {"questions": [{"questionContent": "...", "explanation": "...", "answers": [{"content": "...", "isCorrected": 0}, ...]}, ...]}`;

  try {
    const result = await generateJSON(prompt);
    return result.questions || [];
  } catch (e) {
    throw new AppError(String(e), 500);
  }
};

export const importFromExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const rows = rawRows.map(r => {
    const normalized = {};
    for (const [k, v] of Object.entries(r)) {
      normalized[k.trim().toLowerCase()] = v;
    }
    return normalized;
  });

  const required = ['câu hỏi', 'đáp án a', 'đáp án b', 'đáp án c', 'đáp án d', 'đáp án đúng'];
  if (rows.length > 0) {
    const missing = required.filter(c => !(c in rows[0]));
    if (missing.length) throw new AppError(`File thiếu cột: ${missing.join(', ')}`, 400);
  }

  const questions = [];
  const errors = [];
  const labelMap = { a: 0, b: 1, c: 2, d: 3 };

  rows.forEach((row, i) => {
    const content = String(row['câu hỏi'] || '').trim();
    if (!content || content === 'nan') return;
    const correctLabel = String(row['đáp án đúng'] || '').trim().toLowerCase();
    if (!(correctLabel in labelMap)) {
      errors.push(`Dòng ${i + 2}: đáp án đúng phải là a/b/c/d`);
      return;
    }
    const correctIdx = labelMap[correctLabel];
    const answersRaw = ['a', 'b', 'c', 'd'].map(x => String(row[`đáp án ${x}`] || '').trim());
    const explanation = String(row['giải thích'] || '').trim().replace(/^nan$/, '');
    questions.push({
      questionContent: content,
      explanation,
      answers: answersRaw.map((c, j) => ({ content: c, isCorrected: j === correctIdx ? 1 : 0 })),
    });
  });

  return { questions, errors };
};
