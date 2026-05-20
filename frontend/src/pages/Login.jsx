import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginTeacher, loginStudent } from '../api/auth';
import { toast } from 'react-toastify';
import { FiLoader } from 'react-icons/fi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { setUser } = useAuth();
  const navigate    = useNavigate();

  async function handleLogin() {
    if (!username.trim() || !password) return toast.error('Vui lòng nhập đầy đủ thông tin');
    setLoading(true);
    try {
      let data;
      try {
        data = await loginTeacher(username.trim(), password);
      } catch {
        data = await loginStudent(username.trim(), password);
      }
      setUser(data.user);
      navigate(data.user?.role === 'teacher' ? '/dashboard' : '/student');
    } catch {
      toast.error('Sai tài khoản hoặc mật khẩu');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-xl leading-none">3</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Toán Lớp 3</h1>
        <p className="text-sm text-gray-500 mt-1">Hệ thống E-Learning</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 pt-6 pb-1">
          <h2 className="text-base font-semibold text-gray-900">Đăng nhập</h2>
          <p className="text-sm text-gray-400 mt-0.5">Dùng chung cho giáo viên và học sinh</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
            <input
              className="input"
              placeholder="Nhập username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <input
              className="input"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button
            className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleLogin}
            disabled={loading}>
            {loading
              ? <><FiLoader size={15} className="animate-spin" /> Đang đăng nhập...</>
              : 'Đăng nhập'}
          </button>
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
