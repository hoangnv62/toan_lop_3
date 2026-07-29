import { FiUser, FiPhone, FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function RelativesModal({ student, relatives, loading, onClose }) {
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Người thân</DialogTitle>
          <DialogDescription className="text-xs">{student.fullName}</DialogDescription>
        </DialogHeader>

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
                      <Badge variant="neutral" className="text-xs">{rel.relationship}</Badge>
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

        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
