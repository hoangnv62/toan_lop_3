import { useRef } from 'react';
import { downloadSampleStudentsExcel } from '../../../api/classService';
import { toast } from 'react-toastify';
import { FiUpload, FiDownload, FiLoader } from 'react-icons/fi';
import { useClassStudentMutations } from '../../../hooks/useClass';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ImportCard({ classId, onUploaded }) {
  const fileRef = useRef();
  const { upload, loading } = useClassStudentMutations();

  // Chọn file xong là tải lên luôn — không bắt giáo viên chọn file rồi bấm thêm nút nữa.
  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    // Xóa giá trị ngay để chọn lại đúng file cũ (sau khi sửa) vẫn bắn onChange.
    e.target.value = '';
    if (!file) return;
    try {
      await upload(classId, file, (result) => {
        if (result?.skipped) {
          toast.warning(`Bỏ qua ${result.skipped} dòng: ${result.skippedSummary}`, { autoClose: 8000 });
        }
        onUploaded();
      });
    } catch {
      // toastPromise trong upload() đã báo lỗi cho giáo viên.
    }
  }

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center gap-2 mb-3">
        <FiUpload size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Import từ Excel</h3>
      </div>
      <p className="text-xs text-slate-400 mb-1">
        File cần có cột <code className="bg-slate-100 px-1 rounded-sm text-slate-600">username</code>
      </p>
      <Button
        variant="link" size="xs"
        className="mb-3 h-auto self-start px-0 text-indigo-600 hover:text-indigo-700"
        onClick={async () => { try { await downloadSampleStudentsExcel(); } catch { toast.error('Tải file mẫu thất bại'); } }}
      >
        <FiDownload size={12} /> Tải file mẫu
      </Button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChosen} />
      <Button
        variant="gradient" className="w-full py-1.5 text-sm"
        onClick={() => fileRef.current?.click()} disabled={loading}
      >
        {loading ? <FiLoader size={14} className="animate-spin" /> : <FiUpload size={14} />}
        {loading ? 'Đang import...' : 'Chọn file Excel để import'}
      </Button>
    </Card>
  );
}
