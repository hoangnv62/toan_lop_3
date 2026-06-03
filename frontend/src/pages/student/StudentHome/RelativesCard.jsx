import { FiUsers, FiPlus, FiUser, FiPhone, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function RelativesCard({ relatives, onAdd, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiUsers size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Người thân</h3>
          <span className="badge-gray text-xs">{relatives.length}/5</span>
        </div>
        {relatives.length < 5 && (
          <button className="btn-primary py-1.5 px-3 gap-1.5 text-xs" onClick={onAdd}>
            <FiPlus size={13} /> Thêm
          </button>
        )}
      </div>

      {relatives.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Chưa có người thân nào.</p>
      ) : (
        <div className="space-y-2">
          {relatives.map(rel => (
            <div key={rel.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
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
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  onClick={() => onEdit(rel)}>
                  <FiEdit2 size={14} />
                </button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => onDelete(rel)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
