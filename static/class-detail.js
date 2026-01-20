import { updateClass } from "./apis/classService.js";
import { showToast } from "./commonUtils.js";

document.addEventListener("DOMContentLoaded", () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const classId = parts.pop() || null;
    if (!classId) {
        showToast("Không tìm thấy classId trong URL", "error");
        return;
    }

    // ======================
    // LOAD CLASS DETAIL
    // ======================
    async function loadClassDetail() {
        try {
            const res = await fetch(`/api/classes/${classId}`, { credentials: "include" });
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            renderClassInfo(data);
            renderStudents(data.students || []);
        } catch (err) {
            console.error(err);
            showToast("Không tải được lớp học: " + err.message, "error");
        }
    }

    // ======================
    // RENDER CLASS
    // ======================
    function renderClassInfo(c) {
        document.getElementById("class-detail").innerHTML = `
        <div class="class-card">
          <input id="class-name" value="${c.className}" />
          <button id="btn-update">Cập nhật</button>
          <span>👩‍🎓 ${c.totalStudents} học sinh</span>
        </div>
      `;
        // Re-attach onclick sau render (vì innerHTML overwrite)
        const updateBtn = document.getElementById("btn-update");
        if (updateBtn) updateBtn.onclick = updateClassName; // Thêm check null để an toàn
    }

    // ======================
    // RENDER STUDENTS
    // ======================
    function renderStudents(students) {
        const tbody = document.getElementById("student-table-body");

        if (!students.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty">Chưa có học sinh</td></tr>`;
            return;
        }

        tbody.innerHTML = students.map(s => `
        <tr>
          <td>${s.full_name}</td>
          <td>${s.parent_name || "-"}</td>
          <td>${s.parent_phone || "-"}</td>
          <td>${s.dob || "-"}</td>
          <td>${s.avg_score ?? "-"}</td>
          <td>
            <button class="danger" onclick="deleteStudent(${s.id})">Xóa</button>
          </td>
        </tr>
      `).join("");
    }

    // ======================
    // ADD STUDENT
    // ======================
    async function addStudent() {
        const body = {
            full_name: studentName.value.trim(),
            dob: studentDob.value,
            parent_name: parentName.value.trim(),
            parent_phone: parentPhone.value.trim()
        };

        if (!body.full_name || !body.parent_phone) {
            showToast("Thiếu thông tin bắt buộc", "error");
            return;
        }

        try {
            const res = await fetch(`/api/classes/${classId}/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error(await res.text());
            showToast("Đã thêm học sinh", "success");
            // Clear inputs
            studentName.value = '';
            studentDob.value = '';
            parentName.value = '';
            parentPhone.value = '';
            loadClassDetail();
        } catch (err) {
            showToast("Lỗi thêm học sinh: " + err.message, "error");
        }
    }

    // ======================
    // DELETE STUDENT
    // ======================
    async function deleteStudent(id) {
        if (!confirm("Xóa học sinh này?")) return;

        try {
            const res = await fetch(`/api/students/${id}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error(await res.text());
            showToast("Đã xóa", "success");
            loadClassDetail();
        } catch (err) {
            showToast("Không xóa được: " + err.message, "error");
        }
    }

    // ======================
    // UPLOAD
    // ======================
    async function uploadStudents() {
        const fileInput = document.getElementById("student-file");
        const file = fileInput.files[0];
        if (!file) return showToast("Chưa chọn file", "error");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/classes/${classId}/upload-students`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });
            if (!res.ok) throw new Error(await res.text());
            showToast("Upload thành công", "success");
            fileInput.value = ''; // Reset file input
            loadClassDetail();
        } catch (err) {
            showToast("Upload lỗi: " + err.message, "error");
        }
    }

    async function updateClassName() {
        const input = document.getElementById("class-name");
        if (!input) return;

        const newName = input.value.trim();
        if (!newName) {
            showToast("Vui lòng nhập tên lớp.", "error");
            return;
        }

        try {
            await updateClass(classId, newName);
            showToast("Cập nhật tên lớp thành công!", "success");
            loadClassDetail(); // Reload để reflect change
        } catch (err) {
            console.error(err);
            showToast("Cập nhật thất bại: " + err.message, "error");
        }
    }

    // ======================
    // INIT
    // ======================
    const studentName = document.getElementById("student-name");
    const studentDob = document.getElementById("student-dob");
    const parentName = document.getElementById("parent-name");
    const parentPhone = document.getElementById("parent-phone");

    document.getElementById("btn-add-student").onclick = addStudent;
    document.getElementById("btn-upload").onclick = uploadStudents;
    // Xóa dòng này để tránh lỗi null: document.getElementById("btn-update").onclick = updateClassName;
    window.deleteStudent = deleteStudent;

    loadClassDetail();
});