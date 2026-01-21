import { showToast, convertToDate } from "./commonUtils.js";
import { fetchLesson } from "./apis/lessionService.js";
import { saveExam, deleteExam, fetchExam } from "./apis/examService.js";
import { generateQuestionsByAI } from "./apis/questionService.js";

/* ========= DOM ========= */
const lessonNameEl = document.getElementById("lesson-name");
const examListEl = document.getElementById("exam-list");
const btnCreateExam = document.getElementById("btn-create-exam");

/* Modal */
const modal = document.getElementById("exam-modal");
const btnCloseModal = document.getElementById("btn-close-modal");

const modalLessonTitle = document.getElementById("modal-lesson-title");
const examNameInput = document.getElementById("exam-name");
const examDescInput = document.getElementById("exam-description");
const questionCountSelect = document.getElementById("question-count");

const btnGenerateAI = document.getElementById("btn-generate-ai");
const btnSaveExam = document.getElementById("btn-save-exam");
const btnAddQuestion = document.getElementById("btn-add-question");
const questionListEl = document.getElementById("question-list");

/* ========= STATE ========= */
let lessonId = null;
let lessonTitle = "";
let currentExamId = null;
let currentQuestions = [];

/* ========= INIT ========= */
document.addEventListener("DOMContentLoaded", async () => {
    lessonId = getLessonIdFromUrl();
    await loadLesson();

    btnCreateExam.addEventListener("click", openCreateExamModal);
    btnCloseModal.addEventListener("click", closeModal);
    btnGenerateAI.addEventListener("click", handleGenerateAI);
    btnSaveExam.addEventListener("click", handleSaveExam);
    btnAddQuestion.addEventListener("click", handleAddQuestion);
});

/* ========= LOAD DATA ========= */
async function loadLesson() {
    try {
        const lesson = await fetchLesson(lessonId);
        lessonTitle = lesson.lessonTitle;

        lessonNameEl.textContent = `📘 ${lesson.lessonTitle}`;
        modalLessonTitle.textContent = lesson.lessonTitle;

        renderExamList(lesson.exams);
    } catch {
        showToast("Không tải được bài học", "error");
    }
}

/* ========= RENDER ========= */
function renderExamList(exams) {
    examListEl.innerHTML = "";

    if (!exams || exams.length === 0) {
        examListEl.innerHTML = "<p>Chưa có đề thi nào</p>";
        return;
    }

    exams.forEach((exam) => {
        const item = document.createElement("div");
        item.className = "exam-item";

        item.innerHTML = `
      <div class="exam-info">
        <span class="exam-name">${exam.name}</span>
        <span class="exam-date">${convertToDate(exam.date_created)}</span>
      </div>
      <div class="exam-actions">
        <button class="btn-detail">Chi tiết</button>
        <button class="btn-delete">Xóa</button>
      </div>
    `;

        item.querySelector(".btn-detail")
            .addEventListener("click", () => openExamDetail(exam.id));

        item.querySelector(".btn-delete")
            .addEventListener("click", () => handleDeleteExam(exam.id));

        examListEl.appendChild(item);
    });
}

function renderQuestions() {
    questionListEl.innerHTML = "";

    currentQuestions.forEach((q, qIndex) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question-item";

        qDiv.innerHTML = `
      <input
        class="question-input"
        placeholder="Nhập câu hỏi..."
        value="${q.content || ""}"
        oninput="updateQuestion(${qIndex}, this.value)"
      />

      <textarea
        class="question-explanation"
        placeholder="Giải thích đáp án..."
        oninput="updateExplanation(${qIndex}, this.value)"
      >${q.explanation || ""}</textarea>

      <button id="btn-delete" onclick="removeQuestion(${qIndex})">🗑 Xóa câu hỏi</button>

      <div class="answer-list"></div>
      <button onclick="addAnswer(${qIndex})">➕ Thêm đáp án</button>
    `;

        const answerList = qDiv.querySelector(".answer-list");

        q.answers.forEach((a, aIndex) => {
            const aDiv = document.createElement("div");
            aDiv.className = "answer-item";

            aDiv.innerHTML = `
        <input
          type="radio"
          name="correct-${qIndex}"
          ${a.correct ? "checked" : ""}
          onchange="setCorrectAnswer(${qIndex}, ${aIndex})"
        />

        <input
          placeholder="Đáp án..."
          value="${a.content}"
          oninput="updateAnswer(${qIndex}, ${aIndex}, this.value)"
        />

        <button id="btn-delete" onclick="removeAnswer(${qIndex}, ${aIndex})">x</button>
      `;

            answerList.appendChild(aDiv);
        });

        questionListEl.appendChild(qDiv);
    });
}

/* ========= MODAL ========= */
function openCreateExamModal() {
    currentExamId = null;
    currentQuestions = [];
    examNameInput.value = "";
    examDescInput.value = "";
    renderQuestions();
    openModal();
}

async function openExamDetail(examId) {
    try {
        const result = await fetchExam(examId);
        const exam = result.data;

        currentExamId = examId;
        examNameInput.value = exam.name;
        examDescInput.value = exam.description || "";

        currentQuestions = mapApiQuestions(exam.questions || []);
        renderQuestions();
        openModal();
    } catch {
        showToast("Không tải được đề thi", "error");
    }
}

function openModal() {
    modal.classList.remove("hidden");
}
function closeModal() {
    modal.classList.add("hidden");
}

/* ========= ACTIONS ========= */
// async function handleGenerateAI() {
//     const examDescription = examDescInput.value.trim();
//     const numQuestions = questionCountSelect.value;

//     if (!examDescription) {
//         showToast("Vui lòng nhập mô tả đề thi", "error");
//         return;
//     }

//     try {
//         const res = await generateQuestionsByAI({
//             lessonTitle,
//             examDescription,
//             numQuestions,
//         });

//         currentQuestions = mapApiQuestions(res.questions || []);
//         renderQuestions();
//         showToast("Tạo câu hỏi AI thành công", "success");
//     } catch {
//         showToast("Lỗi tạo câu hỏi AI", "error");
//     }
// }

async function handleGenerateAI() {
    const examDescription = examDescInput.value.trim();
    const numQuestions = questionCountSelect.value;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000);
    if (!examDescription) {
        showToast("Vui lòng nhập mô tả đề thi", "error");
        return;
    }

    showLoading(); // ✅ HIỆN VÒNG XOAY

    try {
        const res = await generateQuestionsByAI({
            lessonTitle,
            examDescription,
            numQuestions,
        });
        console.log("response: ", res);  // res đã là object { data: [...], status: "success" }

        // Không cần parse nữa, dùng trực tiếp res.data
        const data = res.data || [];  // Nếu res.data undefined, fallback array rỗng

        // Kiểm tra nếu status không phải success (tùy chọn, để robust hơn)
        if (res.status !== "success") {
            throw new Error("Server trả về status không thành công");
        }

        clearTimeout(id);
        currentQuestions = mapApiQuestions(data);
        renderQuestions();
        showToast("Tạo câu hỏi AI thành công", "success");

    } catch (err) {
        clearTimeout(id);
        console.error(err);
        showToast("AI đang bận hoặc quá tải, vui lòng thử lại", "error");

    } finally {
        hideLoading(); // ✅ LUÔN TẮT
    }
}

async function handleSaveExam() {
    const name = examNameInput.value.trim();
    if (!name) {
        showToast("Tên bài thi không được trống", "error");
        return;
    }

    try {
        await saveExam(lessonId, currentExamId, {
            name,
            description: examDescInput.value,
            questions: mapFrontendQuestionsToApi(),
        });

        showToast("Lưu đề thi thành công", "success");
        closeModal();
        loadLesson();
    } catch {
        showToast("Lưu thất bại", "error");
    }
}

async function handleDeleteExam(examId) {
    if (!confirm("Xóa đề thi này?")) return;
    await deleteExam(examId);
    showToast("Đã xóa", "success");
    loadLesson();
}

/* ========= QUESTION CRUD (FRONTEND ONLY) ========= */
window.handleAddQuestion = function () {
    currentQuestions.push({
        questionId: null,
        content: "",
        explanation: "",
        answers: [],
    });
    renderQuestions();
};

window.updateQuestion = function (qIndex, value) {
    currentQuestions[qIndex].content = value;
};

window.updateExplanation = function (qIndex, value) {
    currentQuestions[qIndex].explanation = value;
};

window.removeQuestion = function (qIndex) {
    currentQuestions.splice(qIndex, 1);
    renderQuestions();
};

window.addAnswer = function (qIndex) {
    currentQuestions[qIndex].answers.push({
        answerId: null,
        content: "",
        correct: false,
    });
    renderQuestions();
};

window.updateAnswer = function (qIndex, aIndex, value) {
    currentQuestions[qIndex].answers[aIndex].content = value;
};

window.removeAnswer = function (qIndex, aIndex) {
    currentQuestions[qIndex].answers.splice(aIndex, 1);
    renderQuestions();
};

window.setCorrectAnswer = function (qIndex, aIndex) {
    currentQuestions[qIndex].answers.forEach((a, i) => {
        a.correct = i === aIndex;
    });
    renderQuestions();
};

/* ========= MAP API <-> FRONTEND ========= */
function mapApiQuestions(apiQuestions) {
    return apiQuestions.map((q) => ({
        questionId: q.questionId,
        content: q.questionContent,
        explanation: q.explanation || "",
        answers: q.answers.map((a) => ({
            answerId: a.answerId,
            content: String(a.content),
            correct: a.isCorrected === 1,
        })),
    }));
}

function mapFrontendQuestionsToApi() {
    return currentQuestions.map((q) => ({
        questionId: q.questionId,
        questionContent: q.content,
        explanation: q.explanation,
        answers: q.answers.map((a) => ({
            answerId: a.answerId,
            content: a.content,
            isCorrected: a.correct ? 1 : 0,
        })),
    }));
}

/* ========= UTIL ========= */
function getLessonIdFromUrl() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1];
}

const loadingOverlay = document.getElementById("loading-overlay");

function showLoading() {
    loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
    loadingOverlay.classList.add("hidden");
}
