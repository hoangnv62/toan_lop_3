import { useState } from 'react';
import { FiX } from 'react-icons/fi';

const RELATIONSHIPS = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị', 'Chú', 'Bác', 'Cô', 'Dì', 'Người giám hộ'];

export default function RelativeFormModal({ initial, onClose, onSubmit, loading }) {
  const [name, setName]             = useState(initial?.name || '');
  const [phone, setPhone]           = useState(initial?.phone || '');
  const [relationship, setRelationship] = useState(initial?.relationship || '');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">{initial ? 'Sửa người thân' : 'Thêm người thân'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input className="input" placeholder="Nguyễn Văn A" value={name}
              onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input className="input" placeholder="0912345678" value={phone}
              onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quan hệ</label>
            <select className="input" value={relationship} onChange={e => setRelationship(e.target.value)}>
              <option value="">-- Chọn quan hệ --</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" disabled={loading}
            onClick={() => onSubmit({ name, phone, relationship })}>
            {loading ? 'Đang lưu...' : (initial ? 'Cập nhật' : 'Thêm')}
          </button>
        </div>
      </div>
    </div>
  );
}
