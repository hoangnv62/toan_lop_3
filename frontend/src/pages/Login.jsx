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
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  function handleRoleChange(newRole) {
    setRole(newRole);
    setPhone(''); setSPass(''); setTUser(''); setTPass('');
  }

  async function handleStudentLogin() {
    if (!phone || !sPass) return toast.error('Vui lòng nhập đầy đủ thông tin!');
    setLoading(true);
    try {
      const data = await loginStudent(phone, sPass);
      setUser(data.user || { role: 'student' });
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  }

  async function handleTeacherLogin() {
    if (!tUser || !tPass) return toast.error('Vui lòng nhập đầy đủ thông tin!');
    setLoading(true);
    try {
      const data = await loginTeacher(tUser, tPass);
      setUser(data.user || { role: 'teacher' });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Sai tài khoản hoặc mật khẩu');
    } finally { setLoading(false); }
  }

  const isStudent = role === 'student';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Brand mark */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-xl leading-none">3</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Toán Lớp 3</h1>
        <p className="text-sm text-gray-500 mt-1">Hệ thống E-Learning</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { value: 'student', label: 'Học Sinh' },
            { value: 'teacher', label: 'Giáo Viên' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => handleRoleChange(value)}
              className={`flex-1 py-3.5 text-sm font-medium transition-all ${
                role === value
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-50/60'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {isStudent ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số điện thoại phụ huynh
                </label>
                <input className="input" placeholder="Nhập số điện thoại..."
                  value={phone} onChange={e => setPhone(e.target.value)}
                  autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                <input className="input" type="password" placeholder="Nhập mật khẩu..."
                  value={sPass} onChange={e => setSPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStudentLogin()} />
              </div>
              <button className="btn-primary w-full py-2.5 mt-1" onClick={handleStudentLogin} disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
                <input className="input" placeholder="Nhập username..."
                  value={tUser} onChange={e => setTUser(e.target.value)}
                  autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                <input className="input" type="password" placeholder="Nhập mật khẩu..."
                  value={tPass} onChange={e => setTPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} />
              </div>
              <button className="btn-primary w-full py-2.5 mt-1" onClick={handleTeacherLogin} disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
