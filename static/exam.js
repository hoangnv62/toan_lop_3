window.submitExam = submitExam;
window.loadExamResult = loadExamResult
window.renderExam = renderExam;
window.selectAnswer = selectAnswer;
export let currentSelectedExamId = null;
export let currentQuestions = [];
export let selectedAnswers = {};
let currentExam = null;
let timerId = null;
let secondsPassed = 0;
import { showToast, showScore } from './commonUtils.js';

// ================= FETCH EXAM =================
export async function fetchExam(examId) {
    try {
        const res = await fetch(`/api/exams/${examId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data;
    } catch (err) {
        console.error("Lỗi tải đề:", err);
        showToast("Lỗi tải đề: " + err.message, "warning");
    }
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
        showToast("Chưa chọn đáp án nào!", "warning");
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
        console.error("Lỗi nộp bài:", json);
        showToast("Lỗi nộp bài: " + (json.msg || "Không rõ"), "warning");
        return;
    } else {
        console.log("Kết quả:", json);
        showToast("Nộp bài thành công!", "success");
        setTimeout(() => {
            showScore(json.total, json.score, null);
        }, 50000);
    }
    location.reload();
}

export async function loadExamResult() {
    const params = new URLSearchParams(window.location.search);
    const examId = params.get("examId");

    const res = await fetch(`/api/student/exam-result/${examId}`);
    const data = await res.json();

    document.getElementById("exam-title").textContent =
        `${data.lesson_name} - ${data.exam_name}`;

    document.getElementById("exam-meta").textContent =
        `Thời gian làm bài: ${data.time_spent} phút | Nộp lúc: ${new Date(data.submitted_at).toLocaleString("vi-VN")}`;

    renderExamResult(data.questions);
}

function renderExamResult(questions) {
    const container = document.getElementById("question-list");
    container.innerHTML = "";

    questions.forEach((q, idx) => {
        let html = `
            <div class="question">
                <div class="question-title">
                    Câu ${idx + 1}: ${q.content}
                </div>
        `;

        q.answers.forEach(a => {
            let cls = "answer";
            if (a.is_correct) cls += " correct";
            if (a.is_selected && !a.is_correct) cls += " wrong";
            if (a.is_selected) cls += " selected";

            html += `
                <div class="${cls}">
                    ${a.content}
                    ${a.is_selected ? " (Bạn chọn)" : ""}
                    ${a.is_correct ? " ✔" : ""}
                </div>
            `;
        });

        html += "</div>";
        container.innerHTML += html;
    });
}