import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { FiBarChart2, FiUsers, FiBook, FiLogOut, FiLock, FiDatabase, FiUser } from 'react-icons/fi';
import ChangePasswordModal from './shared/ChangePasswordModal';
import ProfileModal from './shared/ProfileModal';
import { useAuthMutations } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const links = [
  { to: '/dashboard',     label: 'Báo cáo & Phân tích', icon: FiBarChart2 },
  { to: '/manage-class',  label: 'Quản lý lớp',          icon: FiUsers },
  { to: '/manage-lesson', label: 'Bài học & Bài tập',    icon: FiBook },
  { to: '/question-bank', label: 'Ngân hàng câu hỏi',    icon: FiDatabase },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pwModal, setPwModal]           = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const { logout } = useAuthMutations();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <aside className="w-60 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col shrink-0 shadow-[1px_0_20px_-4px_rgba(79,70,229,0.08)] overflow-y-auto">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-btn shrink-0">
            <span className="text-white font-extrabold text-base leading-none">3</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">Toán Lớp 3</p>
            <p className="text-xs text-slate-400">E-Learning Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-[0_1px_6px_rgba(79,70,229,0.12)]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={16} className={`shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 space-y-1">
        <Separator className="mb-3" />
        {user?.name && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-400">Giáo viên</p>
          </div>
        )}
        <Button variant="ghost"
          className="w-full justify-start gap-3 h-auto px-3 py-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
          onClick={() => setProfileModal(true)}>
          <FiUser size={16} />
          Cập nhật hồ sơ
        </Button>
        <Button variant="ghost"
          className="w-full justify-start gap-3 h-auto px-3 py-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
          onClick={() => setPwModal(true)}>
          <FiLock size={16} />
          Đổi mật khẩu
        </Button>
        <Button variant="ghost"
          className="w-full justify-start gap-3 h-auto px-3 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}>
          <FiLogOut size={16} />
          Đăng xuất
        </Button>
      </div>

      {pwModal && <ChangePasswordModal onClose={() => setPwModal(false)} />}
      {profileModal && <ProfileModal onClose={() => setProfileModal(false)} />}
    </aside>
  );
}
