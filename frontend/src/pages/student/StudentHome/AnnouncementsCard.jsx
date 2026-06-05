import { FiBell } from 'react-icons/fi';

export default function AnnouncementsCard({ announcements }) {
  if (!announcements?.length) return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <FiBell size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Thông báo từ giáo viên</h3>
      </div>
      <div className="space-y-2">
        {announcements.map(a => (
          <div key={a.id} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <p className="text-sm font-semibold text-slate-900">{a.title}</p>
            <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{a.content}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
