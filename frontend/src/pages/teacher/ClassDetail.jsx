import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { getClassDetail, addStudent, deleteStudent, uploadStudents, updateClass } from '../../api/classService';
import { toast } from 'react-toastify';

export default function ClassDetail() {
  const { classId } = useParams();
  const [detail, setDetail] = useState(null);
  const [className, setClassName] = useState('');
  const [form, setForm] = useState({ full_name: '', dob: '', parent_name: '', parent_phone: '' });
  const [file, setFile] = useState(null);

  useEffect(() => { load(); }, [classId]);

  async function load() {
    try {
      const data = await getClassDetail(classId);
      setDetail(data);
      setClassName(data.className);
    } catch (err) {
      toast.error(err.message || 'Không tải được thông tin lớp');
    }
  }

  async function handleUpdate() {
    if (!className.trim()) return toast.error('Tên lớp không được trống');
    try {
      await updateClass(classId, className);
      toast.success('Cập nhật tên thành công');
      load();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    }
  }

  async function handleAdd() {
    if (!form.full_name || !form.parent_phone) return toast.error('Thiếu thông tin bắt buộc');
    try {
      await addStudent(classId, form);
      toast.success('Đã thêm học sinh');
      setForm({ full_name: '', dob: '', parent_name: '', parent_phone: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Thêm thất bại');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa học sinh này?')) return;
    try {
      await deleteStudent(id);
      toast.success('Đã xóa');
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    }
  }

  async function handleUpload() {
    if (!file) return toast.error('Chưa chọn file');
    try {
      const res = await uploadStudents(classId, file);
      toast.success(res.message || 'Upload xong');
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Upload thất bại');
    }
  }

  if (!detail) return <TeacherLayout><p className="text-gray-400">Đang tải...</p></TeacherLayout>;

  return (
    <TeacherLayout>
      <div className="max-w-4xl space-y-5">
        {/* Header card */}
        <div className="card flex items-center gap-3">
          <input className="input flex-1 text-lg font-semibold" value={className} onChange={e => setClassName(e.target.value)} />
          <button className="btn-primary whitespace-nowrap" onClick={handleUpdate}>Cập nhật</button>
          <span className="text-gray-500 text-sm">👩‍🎓 {detail.totalStudents} HS</span>
        </div>

        {/* Add student */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-3">➕ Thêm học sinh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="input" placeholder="Tên học sinh *" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            <input className="input" type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} />
            <input className="input" placeholder="Tên phụ huynh" value={form.parent_name} onChange={e => setForm(p => ({ ...p, parent_name: e.target.value }))} />
            <input className="input" placeholder="SĐT phụ huynh *" value={form.parent_phone} onChange={e => setForm(p => ({ ...p, parent_phone: e.target.value }))} />
          </div>
          <button className="btn-primary mt-3" onClick={handleAdd}>Thêm</button>
        </div>

        {/* Student table */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-3">👩‍🎓 Danh sách học sinh</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 font-medium">Tên</th>
                  <th className="text-left py-2 font-medium">Phụ huynh</th>
                  <th className="text-left py-2 font-medium">SĐT</th>
                  <th className="text-left py-2 font-medium">Ngày sinh</th>
                  <th className="text-left py-2 font-medium">Điểm TB</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detail.students?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-400">Chưa có học sinh</td></tr>
                ) : detail.students?.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{s.full_name}</td>
                    <td className="py-2">{s.parent_name || '-'}</td>
                    <td className="py-2">{s.parent_phone || '-'}</td>
                    <td className="py-2">{s.dob || '-'}</td>
                    <td className="py-2">{s.avg_score ?? '-'}</td>
                    <td className="py-2">
                      <button className="text-red-500 hover:text-red-700 text-xs font-medium" onClick={() => handleDelete(s.id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-3">📤 Upload danh sách</h3>
          <div className="flex gap-3 items-center">
            <input type="file" accept=".xlsx,.xls" className="text-sm" onChange={e => setFile(e.target.files[0])} />
            <button className="btn-primary text-sm" onClick={handleUpload}>Upload</button>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
