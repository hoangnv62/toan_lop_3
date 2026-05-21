import { useState } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { changePassword } from '../../api/auth';
import { toast } from 'react-toastify';

export default function ChangePasswordModal({ onClose }) {
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
