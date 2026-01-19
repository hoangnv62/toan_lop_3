window.checkPhone = checkPhone;
window.logout = logout;
window.submitStudentLogin = submitStudentLogin;
window.switchTab = switchTab;
window.loginTeacher = loginTeacher;
import { showToast } from './commonUtils.js';
import { checkPhoneNumber, loginForStudent } from '../static/apis/jwtService.js';
export async function checkPhone() {
    const phone = document.getElementById('s-phone').value.trim();
    if (!phone) return showToast("Vui lòng nhập số điện thoại!", "error");

    try {
        const data = await checkPhoneNumber({ phone: phone });

        if (data.exists) {
            // SĐT đúng -> Chuyển sang bước nhập mật khẩu
            document.getElementById('step-1-check').classList.add('hidden');
            document.getElementById('step-2-pass').classList.remove('hidden');
            document.getElementById('welcome-msg').innerText = `Chào ${data.name}!`;
            document.getElementById('welcome-msg').style.display = 'block';
            setTimeout(() => document.getElementById('s-pass').focus(), 100);
        } else {
            showToast("Số điện thoại này chưa được giáo viên đăng ký!", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối server: " + e, "error");
    }
}

export async function submitStudentLogin() {
    const phone = document.getElementById('s-phone').value;
    const password = document.getElementById('s-pass').value;

    if (!password) {
        showToast("Vui lòng nhập mật khẩu!", "error");
        return;
    }
    try {

        const data = await loginForStudent({ phone: phone, password: password });
        console.log("Login response:", data);
        window.location.href = data.redirect;
    } catch (e) {
        showToast("Lỗi kết nối server: " + e, "error");
        return;
    }
}

export function logout() {
    if (confirm("Bạn muốn đăng xuất ngay bây giờ?")) {
        showToast("Đã đăng xuất!", "success");
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

    if (!u || !p) return showToast("Vui lòng nhập đầy đủ thông tin!", "error");

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
            showToast(data.msg, "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Lỗi kết nối đến server!", "error");
    }
}
