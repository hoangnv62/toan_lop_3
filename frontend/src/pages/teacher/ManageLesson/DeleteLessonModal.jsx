import { FiTrash2 } from 'react-icons/fi';
import { useLessonMutations } from '../../../hooks/useLesson';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function DeleteLessonModal({ lesson, onClose, onDeleted }) {
  const { remove, loading } = useLessonMutations();

  async function handleDelete() {
    await remove(lesson.id, onDeleted);
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-1">
            <FiTrash2 size={22} className="text-red-500" />
          </div>
          <DialogTitle>Xóa bài học</DialogTitle>
          <DialogDescription>
            Xóa <span className="font-semibold text-slate-800">"{lesson.title}"</span>?
          </DialogDescription>
          <p className="text-xs text-red-400">Tất cả  bài tập trong bài học này cũng sẽ bị xóa.</p>
        </DialogHeader>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
