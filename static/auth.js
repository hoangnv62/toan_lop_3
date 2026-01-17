window.checkPhone = checkPhone;
window.logout = logout;
window.submitStudentLogin = submitStudentLogin;
window.switchTab = switchTab;
window.loginTeacher = loginTeacher;
export async function checkPhone() {
    const phone = document.getElementById('s-phone').value.trim();
    if (!phone) return alert("Vui lòng nhập số điện thoại!");

    try {
        const res = await fetch('/api/check-student-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        const data = await res.json();

        if (data.exists) {
            // SĐT đúng -> Chuyển sang bước nhập mật khẩu
            document.getElementById('step-1-check').classList.add('hidden');
            document.getElementById('step-2-pass').classList.remove('hidden');
            document.getElementById('welcome-msg').innerText = `Chào ${data.name}!`;
            document.getElementById('welcome-msg').style.display = 'block';
            setTimeout(() => document.getElementById('s-pass').focus(), 100);
        } else {
            alert("Số điện thoại này chưa được giáo viên đăng ký!");
        }
    } catch (e) {
        alert("Lỗi kết nối server: " + e);
    }
}

export async function submitStudentLogin() {
    const phone = document.getElementById('s-phone').value;
    const password = document.getElementById('s-pass').value;

    if (!password) return alert("Vui lòng nhập mật khẩu!");

    const res = await fetch('/api/login/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, password: password })
    });
    const data = await res.json();

    if (data.status === 'success') {
        window.location.href = data.redirect;
    } else {
        alert(data.msg);
    }
}

export function logout() {
    if (confirm("Bạn muốn đăng xuất ngay bây giờ?")) {
        alert("Đã đăng xuất!");
        location.href = "/";
    }
};

export function switchTab(role) {
    // Xóa class active ở các tab cũ
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // Thêm class active cho tab được click
    event.target.classList.add('active');

    // Ẩn hiện form tương ứng
    document.getElementById('student-form').style.display = (role === 'student') ? 'block' : 'none';
    document.getElementById('teacher-form').style.display = (role === 'teacher') ? 'block' : 'none';
}

// --- Logic Đăng Nhập Giáo Viên ---
export async function loginTeacher() {
    const u = document.getElementById('t-user').value;
    const p = document.getElementById('t-pass').value;

    if (!u || !p) return alert("Vui lòng nhập đầy đủ thông tin!");

    try {
        const res = await fetch('/api/login/teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u: u, p: p })
        });
        const data = await res.json();

        if (data.status === 'success') {
            window.location.href = data.redirect;
        } else {
            alert(data.msg);
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối đến server!");
    }
}
