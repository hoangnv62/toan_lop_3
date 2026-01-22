import { fetchStudent } from "./apis/studentService.js"

export async function renderUserProfile(dateFrom, dateTo) {
    try {
        const response = await fetchStudent(dateFrom, dateTo);
        loadStudentProfileAndLessons(response);
        renderProgressChart(response.lessons);
        loadRank(response.ranking);
    } catch (err) {
        console.error("Không tải được dữ liệu học sinh:", err);
        showToast("Không tải được dữ liệu học sinh", "error");
    }
}

export function loadStudentProfileAndLessons(data) {
    const name = data.info || '';
    document.getElementById('welcome-msg').textContent = `Chào bé ${name}! 👋`;

    const lessonsContainer = document.getElementById('lessons-container');

    if (!data.lessons?.length) {
        lessonsContainer.innerHTML =
            '<p style="text-align:center; color:#777; grid-column: 1 / -1;">Chưa có bài học nào.</p>';
        return;
    }

    lessonsContainer.innerHTML = data.lessons.map(lesson => `
        <div class="lesson-item">
            <div class="lesson-title">${lesson.name}</div>
            <div class="lesson-content">
                ${lesson.exams?.length
            ? lesson.exams.map(exam => {
                if (exam.done) {
                    const score = exam.total_questions > 0
                        ? Math.round((exam.correct_questions / exam.total_questions) * 10)
                        : 0;

                    return `
                    <div class="test-result done" onclick="goToResult(${exam.id})">
                        <button class="test-btn done">
                            ${exam.name}
                            <span class="done-text">✔ Đã làm</span>
                        </button>
                        <div class="exam-info">
                            <span>Điểm: <b>${score}/10</b></span>
                            <span>Thời gian: <b>${exam.time_spent}s</b></span>
                        </div>
                    </div>
                `;
                } else {
                    return `
                    <a href="/student/exam/${exam.id}" 
                        class="test-btn">
                        ${exam.name}
                    </a>
                `;
                }
            }).join('')
            : '<small style="color:#aaa">Chưa có bài tập</small>'
        }
            </div>
        </div>
    `).join('');
}

window.goToResult = goToResult;
function goToResult(examId) {
    window.location.href = `exam-result?examId=${examId}`;
}

let progressChart = null;

function renderProgressChart(lessons) {

    const labels = [];
    const scores = [];

    lessons.forEach(lesson => {
        lesson.exams.forEach(exam => {
            if (exam.done === 1 && exam.total_questions > 0) {

                labels.push(`${lesson.name} - ${exam.name}`);

                // Quy đổi về thang 10
                const point = Math.round((exam.correct_questions / exam.total_questions) * 10);
                scores.push(point);
            }
        });
    });

    const ctx = document.getElementById('progressChart').getContext('2d');

    if (progressChart) progressChart.destroy();

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Điểm số',
                data: scores,
                borderWidth: 2.5,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
}
export function loadRank(ranking) {
    const container = document.getElementById("rank-container");

    if (!ranking || ranking.length === 0) {
        container.innerHTML = `<p class="empty">Chưa có dữ liệu xếp hạng.</p>`;
        return;
    }

    let html = `
        <table class="rank-table">
            <thead>
                <tr>
                    <th>Hạng</th>
                    <th>Học sinh</th>
                    <th>Điểm TB</th>
                </tr>
            </thead>
            <tbody>
    `;

    ranking.forEach((s, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${s.name}</td>
                <td>${s.avg_score}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}
