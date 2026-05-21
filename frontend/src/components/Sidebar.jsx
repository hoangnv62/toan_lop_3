import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { FiBarChart2, FiUsers, FiBook, FiLogOut, FiLock, FiDatabase, FiUser } from 'react-icons/fi';
import ChangePasswordModal from './shared/ChangePasswordModal';
import ProfileModal from './shared/ProfileModal';

const links = [
  { to: '/dashboard',     label: 'Báo cáo & Phân tích', icon: FiBarChart2 },
  { to: '/manage-class',  label: 'Quản lý lớp',          icon: FiUsers },
  { to: '/manage-lesson', label: 'Bài học & Bài tập',      icon: FiBook },
  { to: '/question-bank', label: 'Ngân hàng câu hỏi',    icon: FiDatabase },
];

export default function Sidebar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [pwModal, setPwModal]         = useState(false);
  const [profileModal, setProfileModal] = useState(false);

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
        <button onClick={() => setProfileModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
          <FiUser size={16} />
          Cập nhật hồ sơ
        </button>
        <button onClick={() => setPwModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
          <FiLock size={16} />
          Đổi mật khẩu
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <FiLogOut size={16} />
          Đăng xuất
        </button>
      </div>

      {pwModal && <ChangePasswordModal onClose={() => setPwModal(false)} />}
      {profileModal && <ProfileModal onClose={() => setProfileModal(false)} />}
    </aside>
  );
}
