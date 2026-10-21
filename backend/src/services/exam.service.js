import * as examRepo from '../repositories/exam.repository.js';
import * as classRepo from '../repositories/class.repository.js';
import * as lessonRepo from '../repositories/lesson.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import {NotFoundError, ConflictError, ForbiddenError, BadRequestError} from '../utils/error.utils.js';
import {generateJSON} from '../utils/llm.utils.js';
import {buildExamPdf} from './pdf.service.js';
import {formatDate, formatDateTime} from '../utils/date.utils.js';

// Giáo viên chỉ xem được đề của mình — trước đây ai đăng nhập là giáo viên cũng đọc được đề
// (kèm đáp án) của giáo viên khác qua GET /api/exams/:id.
export const getExamForTeacher = async (examId, teacherId) => {
    const exam = await examRepo.findByIdWithTeacher(examId, teacherId);
    if (!exam) throw new NotFoundError('Đề thi không tồn tại hoặc không thuộc quyền quản lý của bạn');
    return getExam(examId);
};

// Dạng đầy đủ (kèm đáp án đúng + giải thích) — CHỈ dành cho giáo viên sở hữu đề.
const getExam = async (examId) => {
    const exam = await examRepo.findWithQuestions(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    return {
        name: exam.name,
        description: exam.description,
        dateCreated: formatDate(exam.date_created),
        timeLimit: null,
        questions: exam.questions.map(q => ({
            questionId: q.id,
            questionContent: q.content,
            explanation: q.explanation,
            answers: q.answers.map(a => ({
                answerId: a.id,
                content: a.content,
                isCorrected: a.is_correct,
            })),
        })),
    };
};

// Cho tới giờ mở đề và nộp tới hạn nộp + thời gian làm bài (+1 phút cho mạng chậm): học sinh
// bắt đầu sát hạn vẫn được nộp đủ thời gian, nhưng không ai mở đề sau hạn rồi làm tiếp được.
const SUBMIT_GRACE_MS = 60 * 1000;

const findStudentAssignment = async (examId, studentId) => {
    const assignment = await classRepo.findClassExamForStudent(studentId, examId);
    if (!assignment) throw new ForbiddenError('Bài tập không được giao cho lớp của bạn');
    if (assignment.open_time && new Date(assignment.open_time) > new Date()) {
        throw new ForbiddenError('Chưa đến giờ mở đề');
    }
    return assignment;
};

const deadlineMs = (assignment) =>
    assignment.deadline ? new Date(assignment.deadline).getTime() : Infinity;

// Học sinh làm bài: BỎ đáp án đúng và giải thích — trước đây trả nguyên, mở DevTools là thấy
// đáp án (giải thích kiểu "25 + 23 = 48" cũng lộ luôn).
export const getExamForStudent = async (examId, studentId) => {
    const assignment = await findStudentAssignment(examId, studentId);
    if (deadlineMs(assignment) < Date.now()) throw new ForbiddenError('Bài tập đã hết hạn nộp');
    const exam = await getExam(examId);
    return {
        ...exam,
        timeLimit: parseInt(assignment.time_limit),
        questions: exam.questions.map(q => ({
            questionId: q.questionId,
            questionContent: q.questionContent,
            answers: q.answers.map(({ answerId, content }) => ({ answerId, content })),
        })),
    };
};

export const getAssignments = async (examId, teacherId) => {
    const rows = await classRepo.findClassExamsByExamAndTeacher(examId, teacherId);
    return rows.map(r => ({
        ...r,
        assigned: Boolean(r.assigned),
        deadline: formatDateTime(r.deadline),
        assigned_at: formatDateTime(r.assigned_at),
        open_time: formatDateTime(r.open_time),
        time_limit: r.time_limit != null ? parseInt(r.time_limit) : null,
    }));
};

export const createExam = async (lessonId, name, description, questions) => {
    return examRepo.createExam(lessonId, name, description, questions);
};

export const createExamForTeacher = async (teacherId, lessonId, name, description, questions) => {
    const lesson = await lessonRepo.findById(lessonId);
    if (!lesson || lesson.teacher_id !== teacherId) throw new ForbiddenError('Bài học không thuộc quyền quản lý của bạn');
    return examRepo.createExam(lessonId, name, description, questions);
};

// Danh sách đề của giáo viên. lessonId = null thì lấy hết mọi bài học.
export const getExamsForTeacher = async (teacherId, lessonId = null) => {
    if (lessonId != null) {
        const lesson = await lessonRepo.findById(lessonId);
        if (!lesson || lesson.teacher_id !== teacherId) {
            throw new ForbiddenError('Bài học không thuộc quyền quản lý của bạn');
        }
    }
    const rows = await examRepo.findByTeacher(teacherId, lessonId ?? null);
    return rows.map(r => ({
        examId: Number(r.id),
        examName: r.name,
        description: r.description || '',
        lessonId: Number(r.lesson_id),
        lessonTitle: r.lesson_title,
        questionCount: Number(r.question_count || 0),
        // GROUP_CONCAT trả về null khi đề chưa giao cho lớp nào.
        assignedClasses: r.assigned_classes ? r.assigned_classes.split(',') : [],
        dateCreated: formatDate(r.date_created),
    }));
};

export const getStatsForTeacher = async (examId, teacherId) => {
    const exam = await examRepo.findByIdWithTeacher(examId, teacherId);
    if (!exam) throw new NotFoundError('Đề thi không tồn tại hoặc không thuộc quyền quản lý của bạn');
    return getStats(examId);
};

export const updateExam = async (examId, lessonId, name, description, questions) => {
    const exam = await examRepo.findById(examId);
    if (!exam || exam.lesson_id !== lessonId) throw new NotFoundError('Bài tập không tồn tại');
    await examRepo.updateExam(examId, name, description, questions);
};

export const deleteExam = async (examId) => {
    const exam = await examRepo.findById(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    await examRepo.deleteExam(examId);
};

export const cloneExam = async (examId) => {
    const exam = await examRepo.findById(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    return examRepo.cloneExam(examId);
};

// Mỗi câu đúng 1 đáp án, và đáp án phải thuộc đúng câu của đề này. Trước đây chấm bằng cách
// đếm mọi đáp án đúng gửi lên: gửi cả 4 đáp án mỗi câu là chắc 10/10, gửi lặp thì vượt 10.
const validateSubmittedAnswers = async (examId, answers) => {
    const questionOf = new Map(
        (await examRepo.findAnswerQuestionPairs(examId)).map(r => [Number(r.answer_id), Number(r.question_id)])
    );
    const seenQuestions = new Set();
    for (const { questionId, answerId } of answers) {
        if (questionOf.get(answerId) !== questionId) {
            throw new BadRequestError('Có câu trả lời không thuộc đề thi này');
        }
        if (seenQuestions.has(questionId)) throw new BadRequestError('Mỗi câu chỉ được chọn một đáp án');
        seenQuestions.add(questionId);
    }
};

export const submitExam = async (examId, studentId, answers, timeSpent) => {
    const assignment = await findStudentAssignment(examId, studentId);
    const submitUntil = deadlineMs(assignment) + Number(assignment.time_limit) * 1000 + SUBMIT_GRACE_MS;
    if (submitUntil < Date.now()) throw new ForbiddenError('Bài tập đã hết hạn nộp');
    if (await examRepo.hasSubmitted(studentId, examId)) throw new ConflictError('Bạn đã nộp bài rồi!');
    await validateSubmittedAnswers(examId, answers);
    return examRepo.submitExam(studentId, examId, answers, timeSpent);
};

export const getResult = async (examId, studentId) => {
    const data = await examRepo.getExamResult(examId, studentId);
    if (!data) throw new NotFoundError('Bài tập không tồn tại');
    return data;
};

export const getStats = async (examId) => {
    const exam = await examRepo.findById(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    const raw = await examRepo.getStats(examId);
    const {scores, total_students, question_rows} = raw;

    const dist = {'0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0};
    for (const s of scores) {
        if (s < 4) dist['0-4']++;
        else if (s < 6) dist['4-6']++;
        else if (s < 8) dist['6-8']++;
        else dist['8-10']++;
    }

    const questionStats = question_rows.map(qr => {
        const ta = parseInt(qr.totalAnswered || 0);
        const cc = parseInt(qr.correctCount || 0);
        return {
            questionId: qr.questionId,
            content: qr.content,
            totalAnswered: ta,
            correctCount: cc,
            correctRate: ta > 0 ? parseFloat((cc / ta * 100).toFixed(1)) : 0,
        };
    });

    return {
        examName: exam.name,
        totalStudents: total_students,
        completedStudents: scores.length,
        avgScore: scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0,
        distribution: dist,
        questions: questionStats,
    };
};

export const generateAiFeedback = async (examId, studentId) => {
    const data = await getResult(examId, studentId);
    const wrong = (data.questions || []).filter(q => !q.isCorrect);
    if (!wrong.length) return 'Xuất sắc! Em đã trả lời đúng tất cả các câu hỏi. Hãy tiếp tục phát huy nhé!';

    const lines = wrong.map(q => {
        const correct = (q.answers || []).find(a => a.isCorrected == 1)?.content || '';
        const chosen = (q.answers || []).find(a => a.isSelected && a.isCorrected != 1)?.content || 'không rõ';
        return `- "${q.questionContent}"\n  Đáp án đúng: ${correct} | Em chọn: ${chosen}`;
    });

    const prompt = `Bạn là giáo viên Toán lớp 3 đang nhận xét bài làm của học sinh.
Bài kiểm tra: ${data.examName || 'Toán lớp 3'}
Kết quả: ${data.score}/10 — đúng ${data.correct}/${data.total} câu.

Các câu trả lời sai:
${lines.join('\n')}

Viết 1 đoạn nhận xét (2-4 câu) bằng tiếng Việt, thân thiện dành cho học sinh lớp 3.
Trả về JSON: {"feedback": "..."}`;

    const result = await generateJSON(prompt);
    return result.feedback || '';
};

export const analyzeExamStats = async (examId) => {
    const stats = await getStats(examId);
    if (!stats.completedStudents) return [];

    const qs = stats.questions || [];
    let hard = qs.filter(q => q.totalAnswered > 0 && q.correctRate < 50);
    if (!hard.length) hard = [...qs].sort((a, b) => a.correctRate - b.correctRate).slice(0, 3);

    const hardSummary = hard.map((q, i) =>
        `- Câu ${i + 1}: "${q.content.slice(0, 80)}" — tỉ lệ đúng ${q.correctRate}% (${q.correctCount}/${q.totalAnswered} HS)`
    ).join('\n');

    const dist = stats.distribution || {};
    const prompt = `Bạn là chuyên gia giáo dục Toán lớp 3. Phân tích kết quả bài kiểm tra:
Tên bài: ${stats.examName}
Học sinh nộp bài: ${stats.completedStudents}/${stats.totalStudents}
Điểm trung bình: ${stats.avgScore}/10
Phân bố: 0-4: ${dist['0-4'] || 0} HS, 4-6: ${dist['4-6'] || 0} HS, 6-8: ${dist['6-8'] || 0} HS, 8-10: ${dist['8-10'] || 0} HS.

Câu hỏi học sinh làm sai nhiều nhất:
${hardSummary}

Đưa ra CHÍNH XÁC 3 nhận xét và lời khuyên thực tế cho giáo viên Toán lớp 3.
Trả về JSON: {"insights": [{"title": "...", "detail": "..."}, ...]}`;

    const result = await generateJSON(prompt);
    return result.insights || [];
};

export const saveComment = async (examId, studentId, teacherId, comment) => {
    await examRepo.upsertComment(examId, studentId, teacherId, comment);
};

export const exportPdf = async (examId, variantsCount, duration) => {
    const exam = await examRepo.findWithQuestions(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    const questions = exam.questions.map(q => ({
        question_id: q.id,
        content: q.content,
        answers: q.answers.map(a => ({
            answer_id: a.id,
            content: a.content,
            is_correct: Boolean(a.is_correct),
        })),
    }));
    return buildExamPdf(exam.name, duration, questions, variantsCount);
};

// Học sinh chỉ xem được đề đã giao cho lớp mình, và chỉ thấy bạn cùng lớp.
export const getClassResultsForStudent = async (examId, studentId) => {
    const exam = await examRepo.findById(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    const student = await userRepo.findById(studentId);
    const assignment = student?.class_id
        && await classRepo.findClassExamByClassAndExam(student.class_id, examId);
    if (!assignment) throw new ForbiddenError('Bài tập không được giao cho lớp của bạn');
    const rows = await examRepo.getExportData(examId, student.class_id);
    return {examName: exam.name, rows};
};

// Giáo viên phải sở hữu đề (qua bài học); có classId thì lớp cũng phải của mình và chỉ lấy
// học sinh lớp đó — đề giao cho nhiều lớp mà không lọc thì trang chi tiết lớp trộn cả lớp khác.
export const getResultsForTeacher = async (examId, teacherId, classId = null) => {
    const exam = await examRepo.findById(examId);
    if (!exam) throw new NotFoundError('Bài tập không tồn tại');
    const lesson = await lessonRepo.findById(exam.lesson_id);
    if (lesson?.teacher_id !== teacherId) throw new ForbiddenError('Bài tập không thuộc quyền quản lý của bạn');
    if (classId != null && !(await classRepo.findByIdAndTeacher(classId, teacherId))) {
        throw new ForbiddenError('Lớp không thuộc quyền quản lý của bạn');
    }
    const rows = await examRepo.getExportData(examId, classId);
    return {examName: exam.name, rows};
};
