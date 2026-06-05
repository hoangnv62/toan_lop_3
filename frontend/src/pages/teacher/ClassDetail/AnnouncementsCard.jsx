import { useState } from 'react';
import { createAnnouncement, deleteAnnouncement } from '../../../api/announcementService';
import { toast } from 'react-toastify';
import { FiBell, FiTrash2, FiSave, FiLoader, FiX } from 'react-icons/fi';

export default function AnnouncementsCard({ classId, announcements, onChanged }) {
  const [annForm, setAnnForm]     = useState({ open: false, title: '', content: '' });
  const [annSaving, setAnnSaving] = useState(false);
  const [confirmAnn, setConfirmAnn] = useState(null);

  async function handleCreate() {
    if (!annForm.title.trim()) return toast.error('Tiêu đề không được trống');
    if (!annForm.content.trim()) return toast.error('Nội dung không được trống');
    setAnnSaving(true);
    try {
      await createAnnouncement(classId, { title: annForm.title.trim(), content: annForm.content.trim() });
      toast.success('Đã tạo thông báo');
      setAnnForm({ open: false, title: '', content: '' });
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Tạo thông báo thất bại');
    } finally { setAnnSaving(false); }
  }

  async function handleDelete() {
    const id = confirmAnn.id;
    setConfirmAnn(null);
    try {
      await deleteAnnouncement(id);
      toast.success('Đã xóa thông báo');
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    }
  }

  return (
    <>
      {confirmAnn && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Xác nhận xóa thông báo</h3>
              <button onClick={() => setConfirmAnn(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <FiX size={17} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-1.5">Bạn có chắc muốn xóa thông báo này?</p>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg px-3 py-2 mb-5 line-clamp-2">
              {confirmAnn.title}
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmAnn(null)}>Hủy</button>
              <button className="btn-danger flex-1" onClick={handleDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiBell size={15} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Thông báo</h3>
            {announcements.length > 0 && <span className="badge-indigo">{announcements.length}</span>}
          </div>
          <button
            className="btn-ghost py-1 px-2 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => setAnnForm(f => ({ ...f, open: !f.open }))}>
            <FiBell size={12} /> Thêm
          </button>
        </div>

        {annForm.open && (
          <div className="mb-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
            <input
              className="input text-sm"
              placeholder="Tiêu đề..."
              value={annForm.title}
              onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="input text-sm resize-none"
              rows={3}
              placeholder="Nội dung..."
              value={annForm.content}
              onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="btn-secondary text-xs py-1 px-2.5"
                onClick={() => setAnnForm({ open: false, title: '', content: '' })}>
                Hủy
              </button>
              <button
                className="btn-primary text-xs py-1 px-2.5 gap-1"
                onClick={handleCreate}
                disabled={annSaving}>
                {annSaving ? <FiLoader size={11} className="animate-spin" /> : <FiSave size={11} />}
                {annSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        )}

        {announcements.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Chưa có thông báo nào</p>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id}
                className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{a.title}</p>
                  <button
                    className="btn-ghost text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => setConfirmAnn(a)}>
                    <FiTrash2 size={13} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{a.content}</p>
                <p className="text-xs text-slate-400 mt-1.5">
                  {a.createdAt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
