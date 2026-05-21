import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { logout, changePassword, updateProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiUsers, FiBook, FiLogOut, FiLock, FiX, FiLoader, FiDatabase, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

const links = [
  { to: '/dashboard',     label: 'Báo cáo & Phân tích', icon: FiBarChart2 },
  { to: '/manage-class',  label: 'Quản lý lớp',          icon: FiUsers },
  { to: '/manage-lesson', label: 'Bài học & Bài tập',      icon: FiBook },
  { to: '/question-bank', label: 'Ngân hàng câu hỏi',    icon: FiDatabase },
];

function ChangePasswordModal({ onClose }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSave() {
    if (!currentPw || !newPw || !confirmPw) return toast.error('Vui lòng điền đầy đủ thông tin');
    if (newPw !== confirmPw) return toast.error('Mật khẩu mới không khớp');
    if (newPw.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    setLoading(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success('Đổi mật khẩu thành công');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Đổi mật khẩu</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input className="input" type="password" placeholder="••••••••"
              value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <input className="input" type="password" placeholder="Ít nhất 6 ký tự"
              value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input className="input" type="password" placeholder="Nhập lại mật khẩu mới"
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</> : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [loading, setLoading]   = useState(false);

  async function handleSave() {
    if (!fullName.trim()) return toast.error('Họ và tên không được trống');
    setLoading(true);
    try {
      await updateProfile(fullName.trim());
      setUser({ ...user, name: fullName.trim() });
      toast.success('Cập nhật thông tin thành công');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Cập nhật hồ sơ</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
            <input className="input" placeholder="Nguyễn Văn A"
              value={fullName} onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</> : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
