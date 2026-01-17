window.openExamModal = openExamModal;
window.renderExam = renderExam;
window.closeExamModal = closeExamModal;
window.submitExam = submitExam;
window.selectAnswer = selectAnswer;   // ⭐ BẮT BUỘC PHẢI CÓ
window.saveQuestions = saveQuestions;
import { currentSelectedLessonId, currentSelectedLessonTitle } from './lessons.js';
import { renderQuestions } from './question.js';
import { loadLessons } from './lessons.js';
export let currentSelectedExamId = null;
export let currentQuestions = [];
export let selectedAnswers = {};
let currentExam = null;
let timerId = null;
let secondsPassed = 0;

// ================= FETCH EXAM =================
export async function fetchExam(examId) {
    try {
        const res = await fetch(`/api/exams/${examId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data;
    } catch (err) {
        console.error("Lỗi tải đề:", err);
        alert("Không tải được đề thi!");
    }
}

// ================= MODAL =================
export async function openExamModal(examId) {
    if (examId == null) {
        renderQuestions([]);
        document.getElementById('exam-name').value = '';
        document.getElementById('exam-description').value = '';
        document.getElementById('num-questions').value = 0;
        document.getElementById('exam-modal').classList.add('active');
        return;
    }
    try {
        const exam = await fetchExam(examId);
        currentSelectedExamId = examId;
        currentQuestions = exam.questions;

        renderQuestions(currentQuestions);
        document.getElementById('exam-name').value = exam.name || '';
        document.getElementById('exam-description').value = exam.description || '';
        document.getElementById('num-questions').value = exam.questions.length;
        document.getElementById('exam-modal').classList.add('active');
    } catch (e) {
        alert("Không thể mở đề!");
    }
}

export function closeExamModal() {
    currentSelectedExamId = null;
    currentQuestions = [];
    document.getElementById('exam-modal').classList.remove('active');
}

// ================= SAVE QUESTIONS =================
export async function saveQuestions() {
    if (!currentQuestions.length) {
        alert("Chưa có câu hỏi!");
        return;
    }

    const body = {
        name: document.getElementById('exam-name').value,
        description: document.getElementById('exam-description').value,
        questions: currentQuestions
    };

    const url = currentSelectedExamId
        ? `/api/lessons/${currentSelectedLessonId}/exams/${currentSelectedExamId}`
        : `/api/lessons/${currentSelectedLessonId}/exams`;

    const method = currentSelectedExamId ? "PUT" : "POST";

    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());

    alert("Lưu thành công!");
    closeExamModal();
    loadLessons();  // reload danh sách bài học để hiện exam mới
}

// ================= RENDER EXAM =================
export async function renderExam(examId) {
    selectedAnswers = {};
    secondsPassed = 0;
    currentExam = examId;

    document.getElementById("lesson-view").style.display = "none";
    document.getElementById("exam-view").style.display = "block";

    clearInterval(timerId);
    timerId = setInterval(() => {
        secondsPassed++;
        document.getElementById("timer").textContent =
            `${String(Math.floor(secondsPassed / 60)).padStart(2, "0")}:${String(secondsPassed % 60).padStart(2, "0")}`;
    }, 1000);

    const container = document.getElementById("questions-container");
    container.innerHTML = "Đang tải...";

    const res = await fetch(`/api/exams/${examId}`, { credentials: "include" });
    const json = await res.json();
    const exam = json.data;

    document.getElementById("exam-title-display").textContent = exam.name;

    container.innerHTML = exam.questions.map((q, i) => `
        <div class="question-card">
            <div class="question-title">Câu ${i + 1}: ${q.questionContent}</div>
            ${q.svgCode ? `<div>${q.svgCode}</div>` : ""}
            <div class="answers-list">
                ${q.answers.map(a => `
                    <label class="answer-item">
                        <input type="radio" name="q-${q.questionId}"
                               onclick="selectAnswer(${q.questionId}, ${a.answerId})">
                        ${a.content}
                    </label>
                `).join("")}
            </div>
        </div>
    `).join("");
}

// ================= SAVE ANSWER =================
function selectAnswer(questionId, answerId) {
    selectedAnswers[questionId] = answerId;
    console.log("Đã chọn:", selectedAnswers);
}

// ================= SUBMIT =================
export async function submitExam() {
    if (!Object.keys(selectedAnswers).length) {
        alert("Bạn chưa chọn đáp án!");
        return;
    }

    const res = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            examId: currentExam,
            answers: selectedAnswers,
            timeSpent: secondsPassed
        })
    });

    const json = await res.json();
    if (json.status !== "success") {
        return alert("Lỗi nộp bài: " + (json.msg || "Không rõ"));
    } else {
        console.log("Kết quả:", json);
        const score = json.score * (10 / json.total);
        alert(`Hoàn thành! Điểm: ${score.toFixed(2)} / 10.00`);
    }
    location.reload();
}
