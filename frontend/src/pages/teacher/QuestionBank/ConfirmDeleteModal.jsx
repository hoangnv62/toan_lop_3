import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function ConfirmDeleteModal({ question, onConfirm, onClose }) {
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>Bạn có chắc muốn xóa câu hỏi sau không?</DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
          {question.content}
        </p>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>Xóa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
