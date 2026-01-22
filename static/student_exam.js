import { showToast, showScore } from './commonUtils.js';
import { fetchExam } from './apis/examService.js';

let selectedAnswers = {};
let timerId = null;
let secondsPassed = 0;
let examId = null;

window.submitExam = submitExam;
window.selectAnswer = selectAnswer;  // Expose để onclick inline hoạt động

document.addEventListener("DOMContentLoaded", async () => {
    examId = getExamIdFromUrl();
    await renderExam();
});

function getExamIdFromUrl() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1];
}

async function submitExam() {
    if (!Object.keys(selectedAnswers).length) {
        showToast("Chưa chọn đáp án nào!", "warning");
        return;
    }

    // Dừng timer ngay khi nộp
    clearInterval(timerId);

    try {
        const res = await fetch("/api/student/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                examId: examId,  // Sửa từ currentExam
                answers: selectedAnswers,
                timeSpent: secondsPassed
            })
        });

        const json = await res.json();

        if (json.status !== "success") {
            console.error("Lỗi nộp bài:", json);
            showToast("Lỗi nộp bài: " + (json.msg || "Không rõ"), "warning");
            // Khởi động lại timer nếu nộp lỗi (tùy chọn)
            startTimer();
            return;
        }

        console.log("Kết quả:", json);
        showToast("Nộp bài thành công!", "success");

        // Hiển thị điểm số NGAY LẬP TỨC
        showScore(json.total, json.score, null);

        setTimeout(() => {
            window.location.href = "/student";
        }, 5000);

    } catch (error) {
        console.error("Lỗi kết nối:", error);
        showToast("Lỗi kết nối khi nộp bài!", "warning");
        startTimer();  // Khởi động lại timer nếu lỗi
    }
}

function startTimer() {
    timerId = setInterval(() => {
        secondsPassed++;
        document.getElementById("timer").textContent =
            `${String(Math.floor(secondsPassed / 60)).padStart(2, "0")}:${String(secondsPassed % 60).padStart(2, "0")}`;
    }, 1000);
}

// ================= SAVE ANSWER =================
function selectAnswer(questionId, answerId) {
    selectedAnswers[questionId] = answerId;
    console.log("Đã chọn:", selectedAnswers);
}

// ================= RENDER EXAM =================
export async function renderExam() {
    selectedAnswers = {};
    secondsPassed = 0;
    clearInterval(timerId);
    startTimer();  // Bắt đầu timer

    const container = document.getElementById("questions-container");
    if (!container) {
        console.error("Không tìm thấy #questions-container");
        return;
    }
    container.innerHTML = "Đang tải...";

    try {
        const res = await fetchExam(examId);
        const exam = res.data;

        document.getElementById("exam-title-display").textContent = exam.name || "Đề thi";

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
    } catch (error) {
        console.error("Lỗi tải đề thi:", error);
        container.innerHTML = "Lỗi tải đề thi. Vui lòng thử lại.";
        showToast("Không tải được đề thi!", "warning");
    }
}