// 3. Quản lý bài học
window.loadLessons = loadLessons;
window.selectLesson = selectLesson;
window.createNewLesson = createNewLesson;
window.deleteLesson = deleteLesson;
export let currentSelectedLessonId = null;
export let currentSelectedLessonTitle = '';
import { showToast } from './commonUtils.js';

export async function loadLessons() {
    const container = document.getElementById('lessons-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#718096; padding:2rem;">Đang tải bài học...</p>';

    try {
        const res = await fetch('/api/teacher/lessons', { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());

        const lessons = await res.json();

        if (lessons.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">Chưa có bài học nào. Tạo mới nhé!</p>';
            return;
        }

        container.innerHTML = lessons.map(lesson => `
            <div class="lesson-card" style="cursor:pointer;" 
                 onclick="selectLesson(${lesson.id}, '${lesson.title.replace(/'/g, "\\'")}')">
                 <div class="lesson-card-content">
                    <h4>${lesson.title}</h4>
                    <p>Ngày tạo: ${new Date(lesson.created_at).toLocaleDateString('vi-VN')}</p>
                 </div>
                 <div class="lesson-card-actions">
                    <button class="btn btn-danger small-btn"
                            onclick="event.stopPropagation(); deleteLesson(${lesson.id}, '${lesson.title.replace(/'/g, "\\'")}')">
                        Xóa bài tập
                    </button>
                 </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Lỗi tải bài học: ${err.message}</p>`;
    }
}

export async function selectLesson(lessonId, title) {
    currentSelectedLessonId = lessonId;
    currentSelectedLessonTitle = title;

    const container = document.getElementById('lessons-container');
    container.innerHTML = ''; // Xóa nội dung cũ để chuẩn bị render mới

    try {
        const res = await fetch(`/api/lesson/${lessonId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);

        const data = await res.json();

        // Render theo thứ tự: Tiêu đề trên đầu, group button ở giữa, danh sách ở dưới
        container.innerHTML = `
            <h3 class="lesson-header">Bài tập trong chủ đề: ${title}</h3>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="loadLessons()">Trở lại danh sách bài học</button>
                <button class="btn btn-success" onclick="openExamModal()">Tạo bài tập mới</button>
            </div>
        `;

        if (data.length === 0) {
            container.innerHTML += `<p class="no-exams">Chưa có bài tập nào trong chủ đề này.</p>`;
            return;
        }

        // Render danh sách bài tập ở cuối
        container.innerHTML += `
            <div class="exam-list">
                ${data.map(exam => `
                    <div class="lesson-item" onclick="openExamModal(${exam.id})">
                        <span class="exam-name">${exam.name}</span>
                        <span class="exam-date">${convertToDate(exam.date_created)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error("Lỗi tải chi tiết bài học:", err);
        container.innerHTML += `<p class="error-message">Lỗi: ${err.message}</p>`;
    }
}
export async function createNewLesson() {
    const input = document.getElementById('lesson-title-input');
    const title = input.value.trim();
    if (!title) {
        showToast("Tiêu đề bài học không được để trống!", "error");
        input.focus();
        return;
    }

    try {
        const res = await fetch('/api/teacher/create-lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title })
        });

        if (!res.ok) throw new Error(await res.text());

        const result = await res.json();
        if (result.status === 'success') {
            input.value = '';
            loadLessons();  // reload danh sách ngay
        } else {
            showToast("Lỗi tạo bài học: " + result.msg, "error");
        }
    } catch (err) {
        console.error("Lỗi tạo bài học:", err);
        showToast("Không tạo được: " + err.message, "error");
    }
}

export function deleteLesson(lessonId) {
    if (!confirm("Bạn có chắc muốn xóa bài học này? Hành động không thể hoàn tác.")) {
        return;
    }
    fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include'
    }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.text()}`);
        return res.json();
    }).then(result => {
        if (result.status === 'success') {
            showToast("Xóa bài học thành công!", "success");
            loadLessons();
        }
    }).catch(err => {
        console.error("Lỗi xóa bài học:", err);
        showToast("Không xóa được: " + err.message, "error");
    });
}
function convertToDate(input) {
    const date = new Date(input);

    const formatted =
        String(date.getDate()).padStart(2, '0') + '/' +
        String(date.getMonth() + 1).padStart(2, '0') + '/' +
        date.getFullYear();
    return formatted;
}