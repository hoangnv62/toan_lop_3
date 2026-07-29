import { useRef, useState } from 'react';
import { downloadSampleStudentsExcel } from '../../../api/classService';
import { toast } from 'react-toastify';
import { FiUpload, FiDownload } from 'react-icons/fi';
import { useClassStudentMutations } from '../../../hooks/useClass';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ImportCard({ classId, onUploaded }) {
  const [file, setFile] = useState(null);
  const fileRef         = useRef();
  const { upload } = useClassStudentMutations();

  async function handleUpload() {
    if (!file) return toast.error('Chưa chọn file');
    await upload(classId, file, () => {
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onUploaded();
    });
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
      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="text-sm text-slate-600 w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-lg
                     file:border-0 file:bg-slate-100 file:text-xs file:font-medium file:text-slate-700
                     hover:file:bg-slate-200 cursor-pointer"
          onChange={e => setFile(e.target.files[0])}
        />
        <Button variant="gradient" className="w-full py-1.5 text-sm" onClick={handleUpload}>
          <FiUpload size={14} /> Upload
        </Button>
      </div>
    </Card>
  );
}
