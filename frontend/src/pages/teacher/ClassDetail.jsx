import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { getClassDetail, searchStudents, assignStudent, removeStudent, uploadStudents, updateClass } from '../../api/classService';
import { getRelatives } from '../../api/relativeService';
import { toast } from 'react-toastify';
import { FiSearch, FiUpload, FiUserX, FiUserPlus, FiLoader, FiUsers, FiPhone, FiUser, FiX } from 'react-icons/fi';

function RelativesModal({ student, relatives, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Người thân</h3>
            <p className="text-xs text-gray-400 mt-0.5">{student.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <FiLoader size={20} className="animate-spin text-gray-300" />
          </div>
        ) : relatives.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Chưa có người thân nào.</p>
        ) : (
          <div className="space-y-2">
            {relatives.map(rel => (
              <div key={rel.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <FiUser size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{rel.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rel.relationship && (
                      <span className="badge-gray text-xs">{rel.relationship}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FiPhone size={10} /> {rel.phone}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn-secondary w-full mt-5" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

function ConfirmModal({ student, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiUserX size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Xác nhận gỡ học sinh</h3>
          <p className="text-sm text-gray-500 mt-2">
            Gỡ <span className="font-semibold text-gray-800">{student.fullName}</span> khỏi lớp?
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
  const [detail, setDetail]           = useState(null);
  const [className, setClassName]     = useState('');
  const [query, setQuery]             = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [confirm, setConfirm]         = useState(null);
  const [relModal, setRelModal]       = useState(null); // null | { student }
  const [relList, setRelList]         = useState([]);
  const [relLoading, setRelLoading]   = useState(false);
  const [file, setFile]               = useState(null);
  const fileRef  = useRef();
  const debounceRef = useRef();

  useEffect(() => { load(); }, [classId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 1000);
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
    } finally { setSearching(false); }
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

  async function handleViewRelatives(student) {
    setRelModal({ student });
    setRelLoading(true);
    try {
      setRelList(await getRelatives(student.id));
    } catch {
      setRelList([]);
    } finally {
      setRelLoading(false);
    }
  }

  async function handleUpload() {
    if (!file) return toast.error('Chưa chọn file');
    try {
      const res = await uploadStudents(classId, file);
      toast.success(res.message || 'Upload thành công');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.message || 'Upload thất bại');
    }
  }

  if (!detail) return (
    <TeacherLayout>
      <div className="flex items-center justify-center h-64">
        <FiLoader size={24} className="animate-spin text-gray-400" />
      </div>
    </TeacherLayout>
  );

  return (
    <TeacherLayout>
      {confirm && (
        <ConfirmModal student={confirm} onConfirm={handleConfirmRemove} onCancel={() => setConfirm(null)} />
      )}
      {relModal && (
        <RelativesModal
          student={relModal.student}
          relatives={relList}
          loading={relLoading}
          onClose={() => { setRelModal(null); setRelList([]); }}
        />
      )}

      <div className="max-w-4xl space-y-5">
        {/* Header / class name */}
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Tên lớp học</p>
          <div className="flex items-center gap-3">
            <input
              className="input flex-1 text-base font-semibold"
              value={className}
              onChange={e => setClassName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdate()}
            />
            <button className="btn-primary whitespace-nowrap" onClick={handleUpdate}>
              Cập nhật
            </button>
            <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">
              {detail.totalStudents} học sinh
            </span>
          </div>
        </div>

        {/* Search & add students */}
        <div className="card space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Thêm học sinh theo username</h3>
            <p className="text-xs text-gray-400">Tìm kiếm sau 1 giây khi ngừng nhập</p>
          </div>
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-10"
              placeholder="Nhập username học sinh..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {searching && (
              <FiLoader size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-head">Username</th>
                    <th className="table-head">Họ tên</th>
                    <th className="table-head">Lớp hiện tại</th>
                    <th className="table-head w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(s => (
                    <tr key={s.id} className="table-row">
                      <td className="table-cell font-mono text-indigo-600">{s.username}</td>
                      <td className="table-cell font-medium">{s.full_name}</td>
                      <td className="table-cell">
                        {s.already_in_class
                          ? <span className="badge-green">Đã trong lớp</span>
                          : s.current_class
                            ? <span className="badge-yellow">{s.current_class}</span>
                            : <span className="text-gray-400">Chưa có lớp</span>
                        }
                      </td>
                      <td className="table-cell text-right">
                        {!s.already_in_class && (
                          <button className="btn-primary py-1 px-2.5 text-xs"
                            onClick={() => handleAssign(s.username, s.full_name)}>
                            <FiUserPlus size={13} /> Thêm
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
        <div className="card space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Import từ Excel</h3>
            <p className="text-xs text-gray-400">
              File Excel cần có cột <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">username</code> chứa username học sinh.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <input ref={fileRef} type="file" accept=".xlsx,.xls"
              className="text-sm text-gray-600 flex-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                         file:border-0 file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700
                         hover:file:bg-gray-200 cursor-pointer"
              onChange={e => setFile(e.target.files[0])} />
            <button className="btn-primary whitespace-nowrap" onClick={handleUpload}>
              <FiUpload size={15} /> Upload
            </button>
          </div>
        </div>

        {/* Student roster */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Danh sách học sinh
            <span className="ml-2 badge-indigo">{detail.students?.length ?? 0}</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-head">Username</th>
                  <th className="table-head">Họ tên</th>
                  <th className="table-head text-center">Điểm TB</th>
                  <th className="table-head w-40"></th>
                </tr>
              </thead>
              <tbody>
                {!detail.students?.length ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                      Chưa có học sinh trong lớp
                    </td>
                  </tr>
                ) : detail.students.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-mono text-indigo-600">{s.username}</td>
                    <td className="table-cell font-medium text-gray-900">{s.full_name}</td>
                    <td className="table-cell text-center">
                      <span className={`font-semibold ${(s.avg_score ?? 0) >= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {s.avg_score ?? '–'}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost text-indigo-600 hover:bg-indigo-50 py-1 px-2 text-xs gap-1"
                          onClick={() => handleViewRelatives(s)}>
                          <FiUsers size={13} /> Người thân
                        </button>
                        <button
                          className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 py-1 px-2 text-xs gap-1"
                          onClick={() => setConfirm({ studentId: s.id, fullName: s.full_name })}>
                          <FiUserX size={13} /> Gỡ
                        </button>
                      </div>
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
