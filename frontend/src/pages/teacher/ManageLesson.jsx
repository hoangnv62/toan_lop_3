import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchLessons, createLesson, deleteLesson } from '../../api/lessonService';
import { toast } from 'react-toastify';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export default function ManageLesson() {
  const [lessons, setLessons] = useState([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await fetchLessons();
      setLessons(data);
    } catch { setLessons([]); }
  }

  async function handleCreate() {
    const t = title.trim();
    if (!t) return toast.error('Tiêu đề không được trống');
    try {
      await createLesson(t);
      toast.success('Tạo bài học thành công');
      setTitle('');
      load();
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa bài học này?')) return;
    try {
      await deleteLesson(id);
      toast.success('Đã xóa');
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    }
  }

  return (
    <TeacherLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📚 Quản lý bài học</h1>

      <div className="card flex gap-3 mb-6">
        <input className="input flex-1" placeholder="Tên bài học..." value={title}
          onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        <button className="btn-primary whitespace-nowrap" onClick={handleCreate}>➕ Thêm</button>
      </div>

      {lessons.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Chưa có bài học nào.</p>
      ) : (
        <div className="space-y-3">
          {lessons.map(l => (
            <div key={l.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{l.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(l.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-danger text-sm py-1.5 px-3" onClick={() => handleDelete(l.id)}>Xóa</button>
                <button className="btn-primary text-sm py-1.5 px-3" onClick={() => navigate(`/lesson-detail/${l.id}`)}>
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
