import { showToast } from "./commonUtils.js";
import { fetchClasses, updateClass } from "./apis/classService.js";

/**
 * ========== BIẾN DÙNG CHUNG ==========
 */
export let currentSelectedClassId = null;

// expose cho HTML inline
window.loadClasses = loadClasses;
window.deleteClass = deleteClass;
window.createClass = createClass;
window.updateClassName = updateClassName;

/**
 * ========== XÁC ĐỊNH TRANG ==========
 */
const pathParts = window.location.pathname.split("/");
const classIdFromUrl = pathParts[pathParts.length - 1];

/**
 * ========== LOAD KHI DOM READY ==========
 */
document.addEventListener("DOMContentLoaded", () => {
    // chỉ load danh sách lớp khi có container
    if (document.getElementById("class-list")) {
        loadClasses();
    }
});

/**
 * ========== LOAD DANH SÁCH LỚP ==========
 */
async function loadClasses() {
    try {
        const classes = await fetchClasses();
        renderClasses(classes);
    } catch (err) {
        console.error(err);
        const container = document.getElementById("class-list");
        if (container) {
            container.innerHTML = "<p>Không thể tải danh sách lớp.</p>";
        }
    }
}

/**
 * ========== RENDER LỚP ==========
 */
function renderClasses(classes) {
    const container = document.getElementById("class-list");
    if (!container) return;

    container.innerHTML = "";

    if (!classes || !classes.length) {
        container.innerHTML = "<p>Chưa có lớp học nào.</p>";
        return;
    }

    classes.forEach((c) => {
        const div = document.createElement("div");
        div.className = `class-card ${c.status || ""}`;

        div.innerHTML = `
            <h3>${c.className}</h3>

            <div class="class-info">
                <p>👩‍🎓 ${c.totalStudents} học sinh</p>
                <p>📊 Điểm TB: ${c.avgScore ?? "--"}</p>
                <p>✅ Tỷ lệ đạt: ${c.passRate ?? "--"}%</p>
            </div>

            <div class="class-actions">
                <button class="btn-danger">Xóa lớp</button>
                <button class="btn-navigate">Chi tiết</button>
            </div>
        `;

        // xóa lớp
        div.querySelector(".btn-danger").addEventListener("click", () =>
            deleteClass(c.classId)
        );

        // sang trang chi tiết
        div.querySelector(".btn-navigate").addEventListener("click", () => {
            window.location.href = `/class-detail/${c.classId}`;
        });

        container.appendChild(div);
    });
}

/**
 * ========== XÓA LỚP ==========
 */
export async function deleteClass(classId) {
    if (!confirm("Xóa lớp này sẽ xóa toàn bộ học sinh. Xác nhận?")) return;

    try {
        const res = await fetch(`/api/classes/${classId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) throw new Error(await res.text());

        showToast("Xóa lớp thành công!", "success");

        // reload nếu đang ở trang danh sách
        if (document.getElementById("class-list")) {
            loadClasses();
        }

        // nếu đang xem chi tiết lớp vừa xóa
        if (currentSelectedClassId === classId) {
            const detail = document.getElementById("class-detail");
            if (detail) detail.style.display = "none";
            currentSelectedClassId = null;
        }
    } catch (err) {
        console.error(err);
        showToast("Lỗi xóa lớp: " + err.message, "error");
    }
}

/**
 * ========== TẠO LỚP ==========
 */
export async function createClass() {
    const input = document.getElementById("new-class-name");
    if (!input) return;

    const className = input.value.trim();
    if (!className) {
        showToast("Vui lòng nhập tên lớp.", "error");
        input.focus();
        return;
    }

    if (className.length < 2 || className.length > 50) {
        showToast("Tên lớp phải từ 2–50 ký tự.", "error");
        return;
    }

    try {
        const res = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ class_name: className }),
        });

        const result = await res.json();

        if (res.ok && result.status === "success") {
            showToast(`Tạo lớp "${className}" thành công!`, "success");
            input.value = "";
            loadClasses();
        } else {
            showToast(result.msg || "Không thể tạo lớp.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Lỗi kết nối server.", "error");
    }
}

/**
 * ========== CẬP NHẬT TÊN LỚP (TRANG CHI TIẾT) ==========
 */
async function updateClassName() {
    const input = document.getElementById("class-name-input");
    if (!input) return;

    const newName = input.value.trim();
    if (!newName) {
        showToast("Vui lòng nhập tên lớp.", "error");
        return;
    }

    try {
        await updateClass(classIdFromUrl, newName);
        showToast("Cập nhật tên lớp thành công!", "success");
    } catch (err) {
        console.error(err);
        showToast("Cập nhật thất bại.", "error");
    }
}

/**
 * ========== LOAD CHI TIẾT LỚP ==========
 */
export async function loadClassDetail(classId) {
    try {
        const res = await fetch(`/api/classes/${classId}`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        currentSelectedClassId = data.classId;
        renderClassDetail(data);
    } catch (err) {
        console.error(err);
        showToast("Không thể tải chi tiết lớp học", "error");
    }
}

window.loadClassDetail = loadClassDetail;

/**
 * ========== RENDER CHI TIẾT LỚP ==========
 */
function renderClassDetail(c) {
    const container = document.getElementById("class-detail");
    if (!container) return;

    container.innerHTML = `
        <div class="class-detail-card">
            <div class="class-detail-header">
                <input 
                    id="class-name-input"
                    class="class-name-input"
                    value="${c.className}"
                />
                <button class="btn-primary" onclick="updateClassName()">
                    Cập nhật
                </button>
            </div>

            <div class="class-detail-info">
                <div class="info-item">
                    <span>👩‍🎓 Số học sinh</span>
                    <strong>${c.totalStudents}</strong>
                </div>
                <div class="info-item">
                    <span>📊 Điểm trung bình</span>
                    <strong>${c.avgScore ?? "--"}</strong>
                </div>
                <div class="info-item">
                    <span>✅ Tỷ lệ đạt</span>
                    <strong>${c.passRate ?? "--"}%</strong>
                </div>
                <div class="info-item">
                    <span>📅 Ngày tạo</span>
                    <strong>${formatDate(c.createdAt)}</strong>
                </div>
            </div>

            <div class="class-detail-actions">
                <button class="btn-secondary">
                    Upload danh sách sinh viên
                </button>
                <button class="btn-danger" onclick="deleteClass(${c.classId})">
                    Xóa lớp
                </button>
            </div>
        </div>
    `;
}

/**
 * ========== FORMAT DATE ==========
 */
function formatDate(dateStr) {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
}
