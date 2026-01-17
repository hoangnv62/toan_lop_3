import { currentSelectedClassId } from './classes.js';
import { getScoreColor } from './commonUtils.js';
import { renderExam } from "./exam.js";
window.loadStudentsByClass = loadStudentsByClass;
window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.uploadStudentExcel = uploadStudentExcel;
window.loadStudentProfileAndLessons = loadStudentProfileAndLessons;
window.loadProgressAndHistory = loadProgressAndHistory;
/**
 * Mở modal thêm học sinh
 */
export function showAddStudentModal() {
    const modal = document.getElementById('add-student-modal');
    if (modal) {
        console.log('Opening modal...'); // Debug: Kiểm tra xem function có chạy không
        modal.classList.add('active');
    } else {
        console.error('Modal not found!'); // Error nếu không tìm thấy modal
    }
}

/**
 * Đóng modal thêm học sinh
 */
export function closeAddStudentModal() {
    const modal = document.getElementById('add-student-modal');
    if (modal) {
        console.log('Closing modal...'); // Debug
        modal.classList.remove('active');
    }

    document.getElementById('new-std-name').value = '';
    document.getElementById('new-std-dob').value = '';
    document.getElementById('new-std-parent').value = '';
    document.getElementById('new-std-phone').value = '';
}

/**
 * Thêm học sinh (HTML gọi addStudent())
 */
export async function addStudent() {
    if (!currentSelectedClassId) {
        alert('Vui lòng chọn lớp trước khi thêm học sinh');
        return;
    }

    const fullName = document.getElementById('new-std-name').value.trim();
    const dob = document.getElementById('new-std-dob').value;
    const parentName = document.getElementById('new-std-parent').value.trim();
    const parentPhone = document.getElementById('new-std-phone').value.trim();

    if (!fullName) {
        alert('Vui lòng nhập họ tên học sinh');
        return;
    }

    if (!parentPhone) {
        alert('Vui lòng nhập SĐT phụ huynh');
        return;
    }

    try {
        const res = await fetch(`/api/classes/${currentSelectedClassId}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                full_name: fullName,
                dob,
                parent_name: parentName,
                parent_phone: parentPhone
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
        }

        alert('Thêm học sinh thành công!');
        closeAddStudentModal();
        await loadStudentsByClass(currentSelectedClassId);

    } catch (err) {
        console.error('Lỗi thêm học sinh:', err);
        alert('Lỗi thêm học sinh: ' + err.message);
    }
}

/**
 * Xóa học sinh
 */
export async function deleteStudent(classId, studentId) {
    if (!confirm('Bạn có chắc muốn xóa học sinh này không?')) return;

    try {
        const res = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `HTTP ${res.status}`);
        }

        alert('Xóa học sinh thành công!');
        await loadStudentsByClass(classId);

        if (typeof window.loadDashboardStats === 'function') {
            window.loadDashboardStats();
        }

    } catch (error) {
        console.error('Lỗi khi xóa học sinh:', error);
        alert('Lỗi xóa học sinh: ' + error.message);
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
async function uploadStudentExcel() {
    const fileInput = document.getElementById("excel-upload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Vui lòng chọn file Excel!");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`/api/classes/${currentSelectedClassId}/upload-students`, {
            method: "POST",
            body: formData,
            credentials: "include"   // để gửi session cookie
        });

        const result = await res.json();

        if (!res.ok || result.status === "fail") {
            throw new Error(result.msg || "Upload thất bại");
        }

        alert(result.msg);
        console.log("Upload OK:", result);

        // Có thể reload danh sách học sinh sau khi upload
        loadStudentsByClass(currentSelectedClassId);

    } catch (err) {
        console.error("Upload error:", err);
        alert("Lỗi upload: " + err.message);
    }

}

export async function loadStudentProfileAndLessons() {
    try {
        const response = await fetch('/api/student/data');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("Student data loaded:", data);
        // Update welcome message
        const name = data.info?.name || '';
        document.getElementById('welcome-msg').textContent = `Chào bé ${name}! 👋`;

        // Render lessons
        const lessonsContainer = document.getElementById('lessons-container');
        if (!data.lessons?.length) {
            lessonsContainer.innerHTML = '<p style="text-align:center; color:#777; grid-column: 1 / -1;">Chưa có bài học nào.</p>';
        } else {
            lessonsContainer.innerHTML = data.lessons.map(lesson => `
                    <div class="lesson-item">
                        <div class="lesson-title">${lesson.title}</div>
                        <div class="lesson-content">
                            ${lesson.exams?.map(exam => `
                                <button class="test-btn" onclick="renderExam(${exam.id})">
                                    ${exam.name}
                                </button>
                            `).join('') || '<small style="color:#aaa">Chưa có bài tập</small>'}
                        </div>
                    </div>
                `).join('');
        }
    } catch (err) {
        console.error("Không tải được dữ liệu học sinh:", err);
    }
}

export async function loadProgressAndHistory() {
    const container = document.getElementById("history-list");
    container.innerHTML = `<p class="loading">Đang tải lịch sử...</p>`;

    try {
        const res = await fetch("/api/student/history", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const lessons = await res.json();
        renderProgressChart(lessons);
        if (!lessons.length) {
            container.innerHTML = `<p class="empty">Chưa có bài làm nào.</p>`;
            return;
        }

        let html = "";

        lessons.forEach(lesson => {
            html += `
                <div class="lesson-card">
                    <div class="lesson-header">
                        📘 ${lesson.lesson_title}
                    </div>
                    <div class="exam-list">
                        ${lesson.exams.map(exam => `
                            <div class="exam-item">
                                <div class="exam-name">${exam.exam_name}</div>
                                <div class="exam-meta">
                                    <span>Điểm: <b>${exam.score}/${exam.total_questions}</b></span>
                                    <span>⏱ ${exam.time_spent}s</span>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="error">Không tải được lịch sử học tập</p>`;
    }
}


export function renderWeekCalendar() {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const todayIndex = new Date().getDay();
    const container = document.getElementById('week-calendar');

    container.innerHTML = days.map((day, i) =>
        `<div class="day ${i === todayIndex ? 'today' : ''}">${day}</div>`
    ).join('');
}
let progressChart = null;

function renderProgressChart(groupedHistory) {

    // Làm phẳng dữ liệu
    const labels = [];
    const scores = [];

    groupedHistory.forEach(lesson => {
        lesson.exams.forEach(exam => {
            labels.push(`${lesson.lesson_title} - ${exam.exam_name}`);
            const point = Math.round((exam.score / exam.total_questions) * 10);
            scores.push(point);
        });
    });

    const ctx = document.getElementById('progressChart').getContext('2d');

    if (progressChart) progressChart.destroy(); // tránh vẽ chồng

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tiến bộ học tập',
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
