import { useState } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { updateProfile } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [loading, setLoading]   = useState(false);

  async function handleSave() {
    if (!fullName.trim()) return toast.error('Họ và tên không được trống');
    setLoading(true);
    try {
      await updateProfile(fullName.trim());
      setUser({ ...user, name: fullName.trim() });
      toast.success('Cập nhật thành công');
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
