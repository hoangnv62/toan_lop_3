import { useRef, useState } from 'react';
import { uploadStudents } from '../../../api/classService';
import { toast } from 'react-toastify';
import { FiUpload } from 'react-icons/fi';

export default function ImportCard({ classId, onUploaded }) {
  const [file, setFile] = useState(null);
  const fileRef         = useRef();

  async function handleUpload() {
    if (!file) return toast.error('Chưa chọn file');
    try {
      const res = await uploadStudents(classId, file);
      toast.success(res.message || 'Upload thành công');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onUploaded();
    } catch (err) {
      toast.error(err.message || 'Upload thất bại');
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <FiUpload size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Import từ Excel</h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        File cần có cột <code className="bg-slate-100 px-1 rounded text-slate-600">username</code>
      </p>
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
        <button className="btn-primary w-full py-1.5 text-sm" onClick={handleUpload}>
          <FiUpload size={14} /> Upload
        </button>
      </div>
    </div>
  );
}
