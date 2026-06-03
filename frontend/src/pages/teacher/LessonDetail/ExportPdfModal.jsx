import { useState } from 'react';
import { exportExamPdf } from '../../../api/examService';
import { toast } from 'react-toastify';
import { FiX, FiDownload, FiLoader } from 'react-icons/fi';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-900">Xuất đề thi PDF</h2>
          <button className="btn-ghost p-1.5" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-500 mb-0.5"> Bài tập</p>
            <p className="font-medium text-slate-900">{exam.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số lượng mã đề
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="input w-full"
            />
            <p className="text-xs text-slate-400 mt-1">
              Mỗi mã đề có thứ tự câu hỏi và đáp án khác nhau · Tối đa 20 mã đề
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Thời gian làm bài (phút)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={duration}
              onChange={e => setDuration(Math.max(5, Math.min(180, Number(e.target.value))))}
              className="input w-full"
            />
          </div>

          <p className="text-sm text-slate-500">
            File PDF gồm{' '}
            <span className="font-semibold text-slate-800">{count}</span> đề +
            1 trang đáp án
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button className="btn-secondary" onClick={onClose} disabled={generating}>Hủy</button>
          <button className="btn-primary" disabled={generating} onClick={handleGenerate}>
            {generating
              ? <><FiLoader size={15} className="animate-spin mr-1.5" />Đang tạo...</>
              : <><FiDownload size={15} className="mr-1.5" />Tải PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
