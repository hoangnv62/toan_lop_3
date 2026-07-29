import { FiUsers, FiPlus, FiUser, FiPhone, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RelativesCard({ relatives, onAdd, onEdit, onDelete }) {
  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiUsers size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Người thân</h3>
          <Badge variant="neutral" className="text-xs">{relatives.length}/5</Badge>
        </div>
        {relatives.length < 5 && (
          <Button variant="gradient" className="py-1.5 px-3 gap-1.5 text-xs" onClick={onAdd}>
            <FiPlus size={13} /> Thêm
          </Button>
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
                    <Badge variant="neutral" className="text-xs">{rel.relationship}</Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <FiPhone size={10} /> {rel.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" title="Sửa người thân"
                  className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => onEdit(rel)}>
                  <FiEdit2 size={14} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Xóa người thân"
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => onDelete(rel)}>
                  <FiTrash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
