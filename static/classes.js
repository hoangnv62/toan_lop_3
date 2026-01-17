export let currentSelectedClassId = null;
//import { getScoreColor } from './commonUtils.js';
window.loadClasses = loadClasses;
window.deleteClass = deleteClass;
window.selectClass = selectClass;
window.createClass = createClass;
// Tải danh sách lớp học
export async function loadClasses() {
    const el = document.getElementById('class-list');
    if (!el) return;

    el.innerHTML = '<p style="text-align:center; color:#718096; padding:2rem;">Đang tải...</p>';

    try {
        const res = await fetch('/api/classes', { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());

        const classes = await res.json();
        console.log("Lớp học tải về:", classes);
        if (classes.length === 0) {
            el.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">Chưa có lớp nào.</p>';
            document.getElementById('class-detail').style.display = 'none';
            return;
        }

        el.innerHTML = classes.map(cls => `
            <div class="class-card" data-class-id="${cls.id}" 
                 onclick="selectClass(${cls.id}, '${cls.class_name.replace(/'/g, "\\'")}')">
                <div class="class-card-header">
                    <h4>Tên lớp: ${cls.class_name}</h4>
                    <span><strong>Ngày tạo:</strong> ${new Date(cls.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="class-card-body">
                    <p><strong>ID:</strong> ${cls.id}</p>
                    <p><strong>GV ID:</strong> ${cls.teacher_id}</p>
                </div>
                <div class="class-card-footer">
                    <button class="btn btn-danger small-btn" onclick="event.stopPropagation(); deleteClass(${cls.id})">
                        Xóa
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Lỗi: ${err.message}</p>`;
    }
}

//xóa lớp học
export async function deleteClass(classId) {
    if (!confirm("Xóa lớp này sẽ xóa hết học sinh. Xác nhận?")) return;
    try {
        const res = await fetch(`/api/classes/${classId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error(await res.text());
        alert("Xóa lớp thành công!");
        loadClasses();
        if (currentSelectedClassId === classId) {
            document.getElementById('class-detail').style.display = 'none';
            currentSelectedClassId = null;
        }
    } catch (err) {
        alert("Lỗi xóa lớp: " + err.message);
    }
}

export async function selectClass(classId, className) {
    currentSelectedClassId = classId;
    document.getElementById('current-class-name').textContent = className;
    document.getElementById('class-detail').style.display = 'block';
    await loadStudentsByClass(classId);
}

//Tạo lớp học mới
export async function createClass() {
    const classNameInput = document.getElementById('new-class-name');
    const className = classNameInput.value.trim();

    if (!className) {
        alert('Vui lòng nhập tên lớp (ví dụ: 3A, 9 Toán, Lớp 6A1...)');
        classNameInput.focus();
        return;
    }

    // Optional: kiểm tra định dạng tên lớp nếu bạn muốn (ví dụ: không cho ký tự đặc biệt)
    if (className.length < 2 || className.length > 50) {
        alert('Tên lớp nên từ 2 đến 50 ký tự.');
        return;
    }

    try {
        const response = await fetch('/api/classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',          // giữ session/cookie đăng nhập
            body: JSON.stringify({
                class_name: className
            })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            alert(`Tạo lớp "${className}" thành công!`);
            classNameInput.value = '';           // xóa input sau khi tạo
            loadClasses();                       // tải lại danh sách lớp
        } else {
            alert('Không thể tạo lớp: ' + (result.msg || 'Lỗi không xác định'));
        }
    } catch (error) {
        console.error('Lỗi khi tạo lớp:', error);
        alert('Có lỗi xảy ra khi kết nối server. Vui lòng thử lại.');
    }
}