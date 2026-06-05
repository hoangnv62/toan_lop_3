import {query, queryOne} from '../config/database.js';
import {generateJSON} from '../utils/llm.utils.js';

export const getTeacherDashboard = async (teacherId) => {
    const summary = await queryOne(
        `SELECT (SELECT COUNT(*)
                 FROM users u
                          JOIN classes c ON u.class_id = c.id
                 WHERE c.teacher_id = :tid
                   AND u.role = 'student')                             AS totalStudents,
                (SELECT COUNT(*) FROM classes WHERE teacher_id = :tid) AS totalClasses,
                (SELECT COUNT(*) FROM lessons WHERE teacher_id = :tid) AS totalLessons,
                (SELECT COUNT(*)
                 FROM exams e
                          JOIN lessons l ON e.lesson_id = l.id
                 WHERE l.teacher_id = :tid)                            AS totalExams`,
        {tid: teacherId}
    );

    const scoreRows = await query(
        `SELECT sa.student_id                                                                               AS studentId,
                u.full_name                                                                                 AS studentName,
                ROUND(SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 10.0 / NULLIF(COUNT(q.id), 0), 1) AS avgScore
         FROM student_answers sa
                  JOIN answers a ON sa.answer_id = a.id
                  JOIN questions q ON a.question_id = q.id
                  JOIN exams e ON sa.exam_id = e.id
                  JOIN lessons l ON e.lesson_id = l.id
                  JOIN users u ON u.id = sa.student_id
         WHERE l.teacher_id = :tid
         GROUP BY sa.student_id
         ORDER BY avgScore DESC`,
        {tid: teacherId}
    );

    const dist = {'0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0};
    let passCount = 0, failCount = 0;
    for (const s of scoreRows) {
        const v = parseFloat(s.avgScore || 0);
        if (v < 4) {
            dist['0-4']++;
            failCount++;
        } else if (v < 6) {
            dist['4-6']++;
            failCount++;
        } else if (v < 8) {
            dist['6-8']++;
            passCount++;
        } else {
            dist['8-10']++;
            passCount++;
        }
        s.avgScore = parseFloat(s.avgScore || 0);
    }

    const classAvgRows = await query(
        `SELECT c.class_name AS className, ROUND(AVG(t.student_avg), 2) AS avgScore
         FROM classes c
                  LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student'
                  LEFT JOIN (SELECT sa.student_id,
                                    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 10.0 /
                                    NULLIF(COUNT(q.id), 0) AS student_avg
                             FROM student_answers sa
                                      JOIN answers a ON sa.answer_id = a.id
                                      JOIN questions q ON a.question_id = q.id
                             GROUP BY sa.student_id) t ON t.student_id = u.id
         WHERE c.teacher_id = :tid
         GROUP BY c.id, c.class_name
         ORDER BY avgScore DESC`,
        {tid: teacherId}
    );
    const classAvgScores = classAvgRows.map(r => ({
        ...r,
        avgScore: r.avgScore != null ? parseFloat(r.avgScore) : null,
    }));

    return {
        summary,
        scoreDistribution: dist,
        passRate: {pass: passCount, fail: failCount},
        topStudents: scoreRows.slice(0, 5),
        classAvgScores,
    };
};

export const getAiAdvice = async (avg, totalStudents, dist) => {
    const prompt = `Bạn là trợ lý giáo dục chuyên về Toán lớp 3.
Dữ liệu lớp học:
- Điểm trung bình: ${avg}
- Tổng số học sinh: ${totalStudents}
- Phân bố điểm: 0–4: ${dist['0-4'] || 0}, 4–6: ${dist['4-6'] || 0}, 6–8: ${dist['6-8'] || 0}, 8–10: ${dist['8-10'] || 0}
Đưa ra CHÍNH XÁC 3 lời khuyên ngắn gọn, thực tế cho giáo viên Toán lớp 3.
Trả về JSON: {"advices": [{"title": "...", "detail": "..."}, ...]}`;

    try {
        const result = await generateJSON(prompt);
        return result.advices || [];
    } catch {
        return [
            {title: 'Củng cố kiến thức nền', detail: 'Dành thời gian ôn lại các phép tính cơ bản cho nhóm học sinh yếu.'},
            {title: 'Tăng hoạt động thực hành', detail: 'Lồng ghép trò chơi toán học để tăng hứng thú học tập.'},
            {title: 'Phân hóa bài tập', detail: 'Giao bài theo mức độ để học sinh khá giỏi và trung bình đều tiến bộ.'},
        ];
    }
};
