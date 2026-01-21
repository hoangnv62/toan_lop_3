import { currentQuestions } from './exam.js';

// Hàm render câu hỏi vào trong modal
export function renderQuestions(questions) {
    const container = document.getElementById("questions-container");
    container.innerHTML = `<h3>Danh sách câu hỏi</h3>
                           <button onclick="addQuestion()">➕ Thêm câu hỏi mới</button>`;

    questions.forEach((q, qIndex) => {
        const div = document.createElement("div");
        div.className = "question-block";

        div.innerHTML = `
            <h4>Câu hỏi ${qIndex + 1}</h4>

            <input 
                type="text"
                placeholder=" Nội dung câu hỏi"
                value="${q.questionContent || ""}"
                oninput="updateQuestionContent(${qIndex}, this.value)"
            />

            <textarea 
                placeholder=" Giải thích (nếu có)"
                oninput="updateExplanation(${qIndex}, this.value)"
            >${q.explanation || ""}</textarea>

            <div class="answers">
                ${q.answers.map((a, aIndex) => `
                    <div class="answer">
                        <input 
                            type="radio"
                            name="correct-${qIndex}"
                            ${a.isCorrected ? "checked" : ""}
                            onclick="setCorrectAnswer(${qIndex}, ${aIndex})"
                        />
                        <input 
                            type="text"
                            value="${a.content}"
                            oninput="updateAnswer(${qIndex}, ${aIndex}, this.value)"
                        />
                        <button onclick="deleteAnswer(${qIndex}, ${aIndex})">❌</button>
                    </div>
                `).join("")}
            </div>

            <button onclick="addAnswer(${qIndex})">➕ Thêm đáp án</button>
            <button onclick="deleteQuestion(${qIndex})">🗑 Xóa câu hỏi</button>
            <hr/>
        `;

        container.appendChild(div);
    });
}

// Hàm cập nhật nội dung câu hỏi
function updateQuestionContent(qIndex, value) {
    currentQuestions[qIndex].questionContent = value;
}

// Hàm cập nhật giải thích
function updateExplanation(qIndex, value) {
    currentQuestions[qIndex].explanation = value;
}

// Hàm cập nhật nội dung đáp án
function updateAnswer(qIndex, aIndex, value) {
    currentQuestions[qIndex].answers[aIndex].content = value;
}

// Hàm set đáp án đúng (chỉ một đáp án đúng duy nhất)
function setCorrectAnswer(qIndex, aIndex) {
    currentQuestions[qIndex].answers.forEach((a, idx) => {
        a.isCorrected = idx === aIndex;
    });
    renderQuestions(currentQuestions); // Re-render để cập nhật radio checked
}

// Hàm thêm câu hỏi mới (thêm vào cuối danh sách)
function addQuestion() {
    currentQuestions.push({
        questionContent: '',
        explanation: '',
        answers: [
            { content: '', isCorrected: false },
            { content: '', isCorrected: false }
        ] // Mặc định thêm 2 đáp án rỗng
    });
    renderQuestions(currentQuestions);
    document.getElementById('num-questions').value = currentQuestions.length; // Cập nhật số lượng
}

// Hàm thêm đáp án mới cho câu hỏi cụ thể
function addAnswer(qIndex) {
    currentQuestions[qIndex].answers.push({
        content: '',
        isCorrected: false
    });
    renderQuestions(currentQuestions);
}

// Hàm xóa câu hỏi
function deleteQuestion(qIndex) {
    currentQuestions.splice(qIndex, 1);
    renderQuestions(currentQuestions);
    document.getElementById('num-questions').value = currentQuestions.length; // Cập nhật số lượng

}

// Hàm xóa đáp án
function deleteAnswer(qIndex, aIndex) {
    currentQuestions[qIndex].answers.splice(aIndex, 1);
    renderQuestions(currentQuestions);
}