import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchClasses, createClass, deleteClass } from '../../api/classService';
import { toast } from 'react-toastify';

const statusColor = { good: 'border-green-400', warning: 'border-yellow-400', bad: 'border-red-400' };

export default function ManageClass() {
  const [classes, setClasses] = useState([]);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await fetchClasses();
      setClasses(data);
    } catch { setClasses([]); }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return toast.error('Vui lòng nhập tên lớp');
    try {
      await createClass(name);
      toast.success(`Tạo lớp "${name}" thành công`);
      setNewName('');
      load();
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa lớp này sẽ xóa toàn bộ học sinh?')) return;
    try {
      await deleteClass(id);
      toast.success('Đã xóa lớp');
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    }
  }

  return (
    <TeacherLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏫 Quản lý lớp học</h1>

      <div className="card flex gap-3 mb-6">
        <input className="input flex-1" placeholder="Tên lớp học..." value={newName}
          onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        <button className="btn-primary whitespace-nowrap" onClick={handleCreate}>➕ Thêm lớp</button>
      </div>

      {classes.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Chưa có lớp học nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.classId} className={`card border-l-4 ${statusColor[c.status] || 'border-gray-200'}`}>
              <h3 className="font-bold text-gray-800 text-lg">{c.className}</h3>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>👩‍🎓 {c.totalStudents} học sinh</p>
                <p>📊 Điểm TB: <span className="font-semibold">{c.avgScore ?? '--'}</span></p>
                <p>✅ Tỷ lệ đạt: <span className="font-semibold">{c.passRate ?? '--'}%</span></p>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-danger flex-1 text-sm py-1.5" onClick={() => handleDelete(c.classId)}>Xóa</button>
                <button className="btn-primary flex-1 text-sm py-1.5" onClick={() => navigate(`/class-detail/${c.classId}`)}>
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}
