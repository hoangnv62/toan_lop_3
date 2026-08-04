import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const PREVIEW_LIMIT = 5;

// Dùng chung cho xóa 1 câu lẫn xóa nhiều câu — `questions` luôn là mảng.
export default function ConfirmDeleteModal({ questions, deleting = false, onConfirm, onClose }) {
  const many = questions.length > 1;
  const preview = questions.slice(0, PREVIEW_LIMIT);
  const rest = questions.length - preview.length;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            {many
              ? `Bạn có chắc muốn xóa ${questions.length} câu hỏi đã chọn không? Thao tác này không thể hoàn tác.`
              : 'Bạn có chắc muốn xóa câu hỏi sau không?'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-52">
          <div className="space-y-1.5 pr-3">
            {preview.map(q => (
              <p key={q.id} className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
                {q.content}
              </p>
            ))}
          </div>
        </ScrollArea>
        {rest > 0 && <p className="text-xs text-slate-500">…và {rest} câu hỏi khác</p>}

        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>Hủy</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
