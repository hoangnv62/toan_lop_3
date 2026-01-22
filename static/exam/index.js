async function loadExamResult() {
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
                    ${a.is_selected ? "" : ""}
                    ${a.is_correct ? " ✔" : ""}
                </div>
            `;
        });
        if (q.explanation) {
            html += `
                <div class="explanation">
                    <b>Giải thích:</b> ${q.explanation}
                </div>
            `;
        }
        html += "</div>";
        container.innerHTML += html;
    });
}

document.addEventListener("DOMContentLoaded", loadExamResult);
