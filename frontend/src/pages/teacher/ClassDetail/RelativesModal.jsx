import { FiX, FiUser, FiPhone, FiLoader } from 'react-icons/fi';

export default function RelativesModal({ student, relatives, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-slate-900">Người thân</h3>
            <p className="text-xs text-slate-400 mt-0.5">{student.fullName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <FiLoader size={20} className="animate-spin text-slate-300" />
          </div>
        ) : relatives.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Chưa có người thân nào.</p>
        ) : (
          <div className="space-y-2">
            {relatives.map(rel => (
              <div key={rel.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <FiUser size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{rel.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rel.relationship && (
                      <span className="badge-gray text-xs">{rel.relationship}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <FiPhone size={10} /> {rel.phone}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn-secondary w-full mt-5" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
