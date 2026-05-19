import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginTeacher } from '../api/auth';
import { toast } from 'react-toastify';

export default function Login() {
  const [role, setRole] = useState('student');
  const [phone, setPhone] = useState('');
  const [sPass, setSPass] = useState('');
  const [tUser, setTUser] = useState('');
  const [tPass, setTPass] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  function handleRoleChange(newRole) {
    setRole(newRole);
    setPhone('');
    setSPass('');
    setTUser('');
    setTPass('');
  }

  async function handleStudentLogin() {
    if (!phone || !sPass) return toast.error('Vui lòng nhập đầy đủ thông tin!');
    try {
      const data = await loginStudent(phone, sPass);
      setUser(data.user || { role: 'student' });
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    }
  }

  async function handleTeacherLogin() {
    if (!tUser || !tPass) return toast.error('Vui lòng nhập đầy đủ thông tin!');
    try {
      const data = await loginTeacher(tUser, tPass);
      setUser(data.user || { role: 'teacher' });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Sai tài khoản hoặc mật khẩu');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📚</div>
          <h2 className="text-2xl font-bold text-gray-800">Hệ Thống E-Learning</h2>
          <p className="text-gray-500 text-sm mt-1">Toán Lớp 3</p>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { value: 'student', label: '👦 Học Sinh' },
            { value: 'teacher', label: '👩‍🏫 Giáo Viên' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => handleRoleChange(value)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                role === value ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {role === 'student' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại phụ huynh</label>
              <input className="input" placeholder="Nhập SĐT..." value={phone}
                onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input className="input" type="password" placeholder="Nhập mật khẩu..." value={sPass}
                onChange={e => setSPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStudentLogin()} />
            </div>
            <button className="btn-primary w-full" onClick={handleStudentLogin}>
              Đăng Nhập
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input className="input" placeholder="Username" value={tUser}
                onChange={e => setTUser(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input className="input" type="password" placeholder="Password" value={tPass}
                onChange={e => setTPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} />
            </div>
            <button className="btn-primary w-full" onClick={handleTeacherLogin}>
              Đăng Nhập
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
