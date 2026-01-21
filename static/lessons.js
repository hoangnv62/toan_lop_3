import { convertToDate, showToast } from './commonUtils.js';
import {
    fetchLessons,
    createLesson,
    deleteLesson
} from './apis/lessionService.js';

/* ========= DOM ========= */
const lessonInput = document.getElementById("lesson-title");
const addBtn = document.getElementById("btn-add-lesson");
const lessonList = document.getElementById("lesson-list");

/* ========= INIT ========= */
document.addEventListener("DOMContentLoaded", () => {
    loadLessons();
    addBtn.addEventListener("click", createNewLesson);
});

/* ========= LOAD LESSONS ========= */
export async function loadLessons() {
    if (!lessonList) return;

    lessonList.innerHTML = `
        <p style="text-align:center; color:#718096; padding:2rem;">
            Đang tải bài học...
        </p>
    `;

    try {
        const lessons = await fetchLessons();
        renderLessons(lessons);
    } catch (err) {
        console.error("Lỗi tải danh sách:", err);
        lessonList.innerHTML = `
            <p style="color:#ef4444; text-align:center; padding:2rem;">
                Lỗi tải bài học: ${err.message}
            </p>
        `;
    }
}

/* ========= RENDER ========= */
function renderLessons(lessons) {
    lessonList.innerHTML = "";

    if (!lessons || lessons.length === 0) {
        lessonList.innerHTML = "<p>Chưa có bài học nào</p>";
        return;
    }

    lessons.forEach((lesson) => {
        const item = document.createElement("div");
        item.className = "lesson-item";

        const info = document.createElement("div");
        info.className = "lesson-info";
        info.innerHTML = `
            <span class="lesson-title">${lesson.title}</span>
            <span class="lesson-date">${convertToDate(lesson.created_at)}</span>
        `;
        const groupButton = document.createElement("div");
        const btnDelete = document.createElement("button");
        btnDelete.textContent = "Xóa";
        btnDelete.onclick = () => handlerDeleteLesson(lesson.id);

        const btnDetail = document.createElement("button");
        btnDetail.textContent = "Chi tiết";
        btnDetail.onclick = () => handlerNavigateToDetail(lesson.id);

        groupButton.appendChild(btnDelete);
        groupButton.appendChild(btnDetail);
        item.appendChild(info);
        item.appendChild(groupButton)

        lessonList.appendChild(item);
    });
}

/* ========= CREATE ========= */
export async function createNewLesson() {
    const title = lessonInput.value.trim();
    if (!title) {
        showToast("Tiêu đề bài học không được để trống!", "error");
        lessonInput.focus();
        return;
    }

    try {
        const result = await createLesson({ title });
        if (result.status === "success") {
            showToast("Tạo bài học thành công", "success");
            lessonInput.value = "";
            loadLessons();
        } else {
            showToast(result.msg || "Tạo bài học thất bại", "error");
        }
    } catch (err) {
        console.error("Lỗi tạo bài học:", err);
        showToast("Không tạo được: " + err.message, "error");
    }
}

/* ========= DELETE ========= */
export async function handlerDeleteLesson(lessonId) {
    if (!confirm("Bạn có chắc muốn xóa bài học này? Hành động không thể hoàn tác.")) {
        return;
    }

    try {
        const result = await deleteLesson(lessonId);
        if (result.status === "success") {
            showToast("Xóa bài học thành công", "success");
            loadLessons();
        } else {
            showToast(result.msg || "Xóa thất bại", "error");
        }
    } catch (err) {
        console.error("Lỗi xóa bài học:", err);
        showToast("Không xóa được: " + err.message, "error");
    }
}

/* ========= NAVIGATE ========= */
function handlerNavigateToDetail(id) {
    window.location.href = `/lesson-detail/${id}`;
}
