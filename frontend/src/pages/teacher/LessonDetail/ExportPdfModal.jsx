import { useState } from 'react';
import { exportExamPdf } from '../../../api/examService';
import { toast } from 'react-toastify';
import { FiDownload, FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ExportPdfModal({ exam, onClose }) {
  const [count,      setCount]      = useState(1);
  const [duration,   setDuration]   = useState(45);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await exportExamPdf(exam.id, { variants: count, duration });
      toast.success('Đã tạo PDF thành công');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Tạo PDF thất bại');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xuất đề thi PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-xs text-slate-500 mb-0.5"> Bài tập</p>
            <p className="font-medium text-slate-900">{exam.name}</p>
          </div>

          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số lượng mã đề
            </Label>
            <Input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-full" />
            <p className="text-xs text-slate-400 mt-1">
              Mỗi mã đề có thứ tự câu hỏi và đáp án khác nhau · Tối đa 20 mã đề
            </p>
          </div>

          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Thời gian làm bài (phút)
            </Label>
            <Input type="number" min={5} max={180} value={duration} onChange={e => setDuration(Math.max(5, Math.min(180, Number(e.target.value))))} className="w-full" />
          </div>

          <p className="text-sm text-slate-500">
            File PDF gồm{' '}
            <span className="font-semibold text-slate-800">{count}</span> đề +
            1 trang đáp án
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>Hủy</Button>
          <Button variant="gradient" disabled={generating} onClick={handleGenerate}>
            {generating
              ? <><FiLoader size={15} className="animate-spin mr-1.5" />Đang tạo...</>
              : <><FiDownload size={15} className="mr-1.5" />Tải PDF</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
