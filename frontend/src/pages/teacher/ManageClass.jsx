import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchClasses, createClass, deleteClass } from '../../api/classService';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiArrowRight, FiUsers, FiBarChart2, FiCheckCircle } from 'react-icons/fi';

const statusBadge = {
  good:    { cls: 'badge-green',  label: 'Tốt' },
  warning: { cls: 'badge-yellow', label: 'Trung bình' },
  bad:     { cls: 'badge-red',    label: 'Cần cải thiện' },
};

const statusBorder = {
  good:    'border-l-emerald-400',
  warning: 'border-l-amber-400',
  bad:     'border-l-red-400',
};

export default function ManageClass() {
  const [classes, setClasses] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
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
    setCreating(true);
    try {
      await createClass(name);
      toast.success(`Tạo lớp "${name}" thành công`);
      setNewName('');
      load();
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại');
    } finally { setCreating(false); }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa lớp "${name}" sẽ xóa toàn bộ học sinh?`)) return;
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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý lớp học</h1>
          <p className="text-sm text-gray-500 mt-0.5">{classes.length} lớp</p>
        </div>
      </div>

      {/* Create */}
      <div className="card mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Thêm lớp học mới</p>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Nhập tên lớp học..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button className="btn-primary whitespace-nowrap" onClick={handleCreate} disabled={creating}>
            <FiPlus size={16} />
            {creating ? 'Đang tạo...' : 'Thêm lớp'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiUsers size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Chưa có lớp học nào</p>
          <p className="text-sm text-gray-400 mt-1">Tạo lớp đầu tiên để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map(c => {
            const badge = statusBadge[c.status];
            const border = statusBorder[c.status] || 'border-l-gray-200';
            return (
              <div key={c.classId}
                className={`card border-l-4 ${border} hover:shadow-md transition-all duration-200`}>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight">{c.className}</h3>
                  {badge && <span className={badge.cls}>{badge.label}</span>}
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiUsers size={14} className="text-gray-400 shrink-0" />
                    <span>{c.totalStudents} học sinh</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiBarChart2 size={14} className="text-gray-400 shrink-0" />
                    <span>Điểm TB: <span className="font-semibold text-gray-800">{c.avgScore ?? '--'}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCheckCircle size={14} className="text-gray-400 shrink-0" />
                    <span>Tỷ lệ đạt: <span className="font-semibold text-gray-800">{c.passRate ?? '--'}%</span></span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600 py-1.5 px-2.5"
                    onClick={() => handleDelete(c.classId, c.className)}
                    title="Xóa lớp">
                    <FiTrash2 size={15} />
                  </button>
                  <button
                    className="btn-primary flex-1 py-1.5 text-xs"
                    onClick={() => navigate(`/class-detail/${c.classId}`)}>
                    Xem chi tiết <FiArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </TeacherLayout>
  );
}
