import { NavLink } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiUsers, FiBook, FiLogOut } from 'react-icons/fi';

const links = [
  { to: '/dashboard',     label: 'Báo cáo & Phân tích', icon: FiBarChart2 },
  { to: '/manage-class',  label: 'Quản lý lớp',          icon: FiUsers },
  { to: '/manage-lesson', label: 'Bài học & Đề thi',      icon: FiBook },
];

export default function Sidebar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/');
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold text-base leading-none">3</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">Toán Lớp 3</p>
            <p className="text-xs text-gray-400">E-Learning Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Menu
        </p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }>
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-1">
        {user?.name && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400">Giáo viên</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <FiLogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
