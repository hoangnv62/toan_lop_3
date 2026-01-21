import { currentSelectedClassId } from './classes.js';
import { getScoreColor } from './commonUtils.js';
import { showToast } from './commonUtils.js';
import { fetchStudent } from './apis/studentService.js';
window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.uploadStudentExcel = uploadStudentExcel;
document.getElementById("btn-add-student")
    ?.addEventListener("click", addStudent);

document.getElementById("btn-upload-students")
    ?.addEventListener("click", uploadStudentExcel);



/**
 * Thêm học sinh (HTML gọi addStudent())
 */
export async function addStudent() {
    const fullName = document
        .getElementById("student-name-input")
        .value.trim();

    const dob = document.getElementById("student-dob-input").value;
    const parentName = document
        .getElementById("student-parent-input")
        .value.trim();

    const parentPhone = document
        .getElementById("student-phone-input")
        .value.trim();

    if (!fullName) {
        showToast("Vui lòng nhập họ tên học sinh", "error");
        return;
    }

    if (!parentPhone) {
        showToast("Vui lòng nhập SĐT phụ huynh", "error");
        return;
    }

    try {
        const res = await fetch(
            `/api/classes/${classId}/students`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    full_name: fullName,
                    dob,
                    parent_name: parentName,
                    parent_phone: parentPhone
                })
            }
        );

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
        }

        showToast("Thêm học sinh thành công!", "success");

        // reset input
        document.getElementById("student-name-input").value = "";
        document.getElementById("student-dob-input").value = "";
        document.getElementById("student-parent-input").value = "";
        document.getElementById("student-phone-input").value = "";

        // reload list
        loadStudentsByClass();

    } catch (err) {
        console.error("Lỗi thêm học sinh:", err);
        showToast("Lỗi thêm học sinh: " + err.message, "error");
    }
}


/**
 * Xóa học sinh
 */
export async function deleteStudent(studentId) {
    if (!confirm("Bạn có chắc muốn xóa học sinh này không?")) return;

    try {
        const res = await fetch(`/api/students/${studentId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `HTTP ${res.status}`);
        }

        showToast("Xóa học sinh thành công!", "success");
        loadStudentsByClass(classId);

    } catch (error) {
        console.error("Lỗi khi xóa học sinh:", error);
        showToast("Lỗi xóa học sinh: " + error.message, "error");
    }
}

export async function uploadStudentExcel() {
    const fileInput = document.getElementById("student-file");
    const file = fileInput.files[0];

    if (!file) {
        showToast("Vui lòng chọn file Excel!", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(
            `/api/classes/${classId}/upload-students`,
            {
                method: "POST",
                body: formData,
                credentials: "include"
            }
        );

        const result = await res.json();

        if (!res.ok || result.status === "fail") {
            throw new Error(result.msg || "Upload thất bại");
        }

        showToast(result.msg || "Upload thành công", "success");
        loadStudentsByClass(classId);

    } catch (err) {
        console.error("Upload error:", err);
        showToast("Lỗi upload: " + err.message, "error");
    }
}

export async function loadStudentsByClass(classId) {
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#718096;">Đang tải...</td></tr>';

    try {
        // Nên dùng endpoint chuyên biệt cho học sinh, ví dụ: /api/classes/${classId}/students
        // Nếu backend chưa có, tạm giữ nguyên như cũ
        const res = await fetch(`/api/classes/${classId}`, { credentials: 'include' });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP error ${res.status}`);
        }

        const students = await res.json();

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#94a3b8;">Chưa có học sinh.</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.full_name || '-'}</td>
                <td>${s.parent_name || '-'}</td>
                <td>${s.parent_phone || '-'}</td>
                <td style="font-weight:bold;color:${getScoreColor(s.avg || 0)};">${(s.avg || 0).toFixed(1)}</td>
                <td>
                    <button class="btn btn-danger small-btn"
                            onclick="deleteStudent(${classId}, ${s.id})">
                        Xóa
                    </button>
                </td>
            </tr>
        `).join('');

        console.log(`Đã load ${students.length} học sinh cho lớp ${classId}`);
    } catch (err) {
        console.error('Lỗi load học sinh:', err);
        tbody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;text-align:center;padding:2rem;">Lỗi: ${err.message}</td></tr>`;
    }
}

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
                    <button 
                        class="test-btn"
                        onclick="renderExam(${exam.id})">
                        ${exam.name}
                    </button>
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
