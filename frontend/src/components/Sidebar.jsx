import { NavLink } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: '📊 Báo cáo & Phân tích' },
  { to: '/manage-class', label: '🏫 Quản lý lớp' },
  { to: '/manage-lesson', label: '📚 Bài học & Đề thi' },
];

export default function Sidebar() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/');
  }

  return (
    <aside className="w-56 min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 flex flex-col py-6 px-4 gap-2 shrink-0">
      <h2 className="text-white font-bold text-lg mb-4 px-2">🎓 Giáo viên Toán</h2>
      {links.map(({ to, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-indigo-700'
                : 'text-indigo-100 hover:bg-indigo-500'
            }`
          }>
          {label}
        </NavLink>
      ))}
      <button onClick={handleLogout}
        className="mt-auto px-3 py-2 rounded-lg text-sm font-medium text-indigo-100 hover:bg-red-500 transition-colors text-left">
        🚪 Đăng xuất
      </button>
    </aside>
  );
}
