import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { getClassDetail, searchStudents, assignStudent, removeStudent, uploadStudents, updateClass } from '../../api/classService';
import { toast } from 'react-toastify';

function ConfirmModal({ student, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-gray-800">Xác nhận gỡ học sinh</h3>
          <p className="text-gray-500 text-sm mt-2">
            Bạn có chắc muốn gỡ <span className="font-semibold text-gray-800">{student.fullName}</span> khỏi lớp?
          </p>
          <p className="text-xs text-gray-400 mt-1">Tài khoản học sinh vẫn được giữ lại.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel}>Hủy</button>
          <button className="btn-danger flex-1" onClick={onConfirm}>Gỡ khỏi lớp</button>
        </div>
      </div>
    </div>
  );
}

export default function ClassDetail() {
  const { classId } = useParams();
  const [detail, setDetail] = useState(null);
  const [className, setClassName] = useState('');
  // Search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  // Confirm modal
  const [confirm, setConfirm] = useState(null); // { studentId, fullName }
  // Upload
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const debounceRef = useRef();

  useEffect(() => { load(); }, [classId]);

  // Debounce: tự động tìm kiếm sau 1 giây ngừng nhập
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => { runSearch(query.trim()); }, 1000);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function load() {
    try {
      const data = await getClassDetail(classId);
      setDetail(data);
      setClassName(data.className);
    } catch (err) {
      toast.error(err.message || 'Không tải được thông tin lớp');
    }
  }

  async function runSearch(q) {
    setSearching(true);
    try {
      const data = await searchStudents(q, classId);
      setSearchResults(data);
      if (data.length === 0) toast.info('Không tìm thấy học sinh nào');
    } catch (err) {
      toast.error(err.message || 'Lỗi tìm kiếm');
    } finally {
      setSearching(false);
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

  async function handleAssign(username, fullName) {
    try {
      await assignStudent(classId, username);
      toast.success(`Đã thêm ${fullName} vào lớp`);
      setSearchResults([]);
      setQuery('');
      load();
    } catch (err) {
      toast.error(err.message || 'Thêm thất bại');
    }
  }

  async function handleConfirmRemove() {
    const { studentId, fullName } = confirm;
    setConfirm(null);
    try {
      await removeStudent(classId, studentId);
      toast.success(`Đã gỡ ${fullName} khỏi lớp`);
      load();
    } catch (err) {
      toast.error(err.message || 'Gỡ thất bại');
    }
  }

  async function handleUpload() {
    if (!file) return toast.error('Chưa chọn file');
    try {
      const res = await uploadStudents(classId, file);
      toast.success(res.message || 'Upload xong');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.message || 'Upload thất bại');
    }
  }

  if (!detail) return <TeacherLayout><p className="text-gray-400">Đang tải...</p></TeacherLayout>;

  return (
    <TeacherLayout>
      {confirm && (
        <ConfirmModal
          student={confirm}
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="max-w-4xl space-y-5">

        {/* Header */}
        <div className="card flex items-center gap-3">
          <input className="input flex-1 text-lg font-semibold" value={className}
            onChange={e => setClassName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
          <button className="btn-primary whitespace-nowrap" onClick={handleUpdate}>Cập nhật</button>
          <span className="text-gray-500 text-sm whitespace-nowrap">👩‍🎓 {detail.totalStudents} HS</span>
        </div>

        {/* Tìm kiếm & thêm học sinh */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-700">➕ Thêm học sinh theo username</h3>
          <div className="relative">
            <input
              className="input w-full pr-10"
              placeholder="Nhập username học sinh..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ⏳
              </span>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Username</th>
                    <th className="text-left px-3 py-2 font-medium">Họ tên</th>
                    <th className="text-left px-3 py-2 font-medium">Lớp hiện tại</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-indigo-600">{s.username}</td>
                      <td className="px-3 py-2">{s.full_name}</td>
                      <td className="px-3 py-2">
                        {s.already_in_class
                          ? <span className="text-green-600 font-medium">✓ Đã trong lớp này</span>
                          : s.current_class
                            ? <span className="text-amber-600">{s.current_class}</span>
                            : <span className="text-gray-400">Chưa có lớp</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!s.already_in_class && (
                          <button className="btn-primary text-xs py-1 px-3"
                            onClick={() => handleAssign(s.username, s.full_name)}>
                            Thêm vào lớp
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Import Excel */}
        <div className="card space-y-2">
          <h3 className="font-bold text-gray-700">📤 Import danh sách từ Excel</h3>
          <p className="text-xs text-gray-400">
            File Excel cần có cột <code className="bg-gray-100 px-1 rounded">username</code> chứa username của học sinh.
          </p>
          <div className="flex gap-3 items-center">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="text-sm flex-1"
              onChange={e => setFile(e.target.files[0])} />
            <button className="btn-primary text-sm whitespace-nowrap" onClick={handleUpload}>Upload</button>
          </div>
        </div>

        {/* Danh sách học sinh */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-3">👩‍🎓 Danh sách học sinh</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 font-medium">Username</th>
                  <th className="text-left py-2 font-medium">Họ tên</th>
                  <th className="text-left py-2 font-medium">Phụ huynh</th>
                  <th className="text-left py-2 font-medium">SĐT</th>
                  <th className="text-left py-2 font-medium">Điểm TB</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!detail.students?.length ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-400">Chưa có học sinh trong lớp</td></tr>
                ) : detail.students.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-mono text-indigo-600">{s.username}</td>
                    <td className="py-2 font-medium">{s.full_name}</td>
                    <td className="py-2 text-gray-500">{s.parent_name || '-'}</td>
                    <td className="py-2 text-gray-500">{s.parent_phone || '-'}</td>
                    <td className="py-2">{s.avg_score ?? '-'}</td>
                    <td className="py-2 text-right">
                      <button
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                        onClick={() => setConfirm({ studentId: s.id, fullName: s.full_name })}
                      >
                        Gỡ khỏi lớp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </TeacherLayout>
  );
}
