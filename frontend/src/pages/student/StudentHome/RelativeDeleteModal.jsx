import { FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function RelativeDeleteModal({ relative, onClose, onConfirm, loading }) {
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-1">
            <FiTrash2 size={22} className="text-red-500" />
          </div>
          <DialogTitle>Xóa người thân</DialogTitle>
          <DialogDescription>
            Xóa <span className="font-semibold text-slate-800">{relative.name}</span> khỏi danh sách?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
