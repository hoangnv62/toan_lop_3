import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../../components/TeacherLayout';
import {
  getClassDetail, searchStudents, assignStudent, removeStudent,
  uploadStudents, updateClass, getClassExams, unassignExam, exportStudents,
} from '../../../api/classService';
import { exportExam } from '../../../api/examService';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../../api/announcementService';
import { getRelatives } from '../../../api/relativeService';
import { toast } from 'react-toastify';
import {
  FiSearch, FiUpload, FiUserX, FiUserPlus, FiLoader, FiUsers,
  FiX, FiDownload, FiEye, FiFileText, FiClock, FiSave, FiBell, FiTrash2,
} from 'react-icons/fi';
import StudentResultsModal from './StudentResultsModal';
import RelativesModal from './RelativesModal';
import Pagination from '../../../components/Pagination';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Modal: Xác nhận gỡ học sinh ───────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClassDetail() {
  const { classId } = useParams();
  const [detail, setDetail]               = useState(null);
  const [className, setClassName]         = useState('');
  const [assignedExams, setAssignedExams] = useState([]);
  const [query, setQuery]                 = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const [confirm, setConfirm]             = useState(null);
  const [relModal, setRelModal]           = useState(null);
  const [relList, setRelList]             = useState([]);
  const [relLoading, setRelLoading]       = useState(false);
  const [studentModal, setStudentModal]   = useState(null); // { student }
  const [studentPage, setStudentPage]     = useState(1);
  const [studentPages, setStudentPages]   = useState(1);
  const [exportingId, setExportingId]     = useState(null);
  const [exportingStudents, setExportingStudents] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm]             = useState({ open: false, title: '', content: '' });
  const [annSaving, setAnnSaving]         = useState(false);
  const [confirmAnn, setConfirmAnn]       = useState(null);
  const [file, setFile]                   = useState(null);
  const fileRef     = useRef();
  const debounceRef = useRef();

  useEffect(() => { load(); }, [classId, studentPage]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 1000);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function load() {
    try {
      const [data, exams, ann] = await Promise.all([
        getClassDetail(classId, studentPage),
        getClassExams(classId),
        getAnnouncements(classId).catch(() => []),
      ]);
      setDetail(data);
      setClassName(data.className);
      setStudentPages(data.studentPages ?? 1);
      setAssignedExams(exams);
      setAnnouncements(Array.isArray(ann) ? ann : []);
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

  async function handleExport(examId, examName) {
    setExportingId(examId);
    try {
      await exportExam(examId, `${examName}.xlsx`);
    } catch (err) {
      toast.error(err.message || 'Xuất file thất bại');
    } finally { setExportingId(null); }
  }

  async function handleUnassign(examId) {
    try {
      await unassignExam(classId, examId);
      toast.success('Đã thu hồi bài thi');
      load();
    } catch (err) {
      toast.error(err.message || 'Thu hồi thất bại');
    }
  }

  async function handleExportStudents() {
    setExportingStudents(true);
    try {
      await exportStudents(classId, detail.className);
    } catch (err) {
      toast.error(err.message || 'Xuất file thất bại');
    } finally { setExportingStudents(false); }
  }

  async function handleCreateAnn() {
    if (!annForm.title.trim()) return toast.error('Tiêu đề không được trống');
    if (!annForm.content.trim()) return toast.error('Nội dung không được trống');
    setAnnSaving(true);
    try {
      await createAnnouncement(classId, { title: annForm.title.trim(), content: annForm.content.trim() });
      toast.success('Đã tạo thông báo');
      setAnnForm({ open: false, title: '', content: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Tạo thông báo thất bại');
    } finally { setAnnSaving(false); }
  }

  async function handleDeleteAnn(ann) {
    setConfirmAnn(ann);
  }

  async function confirmDeleteAnn() {
    const id = confirmAnn.id;
    setConfirmAnn(null);
    try {
      await deleteAnnouncement(id);
      toast.success('Đã xóa thông báo');
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
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
      {confirmAnn && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Xác nhận xóa thông báo</h3>
              <button onClick={() => setConfirmAnn(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <FiX size={17} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-1.5">Bạn có chắc muốn xóa thông báo sau không?</p>
            <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 mb-5 line-clamp-2">
              {confirmAnn.title}
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmAnn(null)}>Hủy</button>
              <button className="btn-danger flex-1" onClick={confirmDeleteAnn}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      {relModal && (
        <RelativesModal
          student={relModal.student}
          relatives={relList}
          loading={relLoading}
          onClose={() => { setRelModal(null); setRelList([]); }}
        />
      )}
      {studentModal && (
        <StudentResultsModal
          student={studentModal.student}
          onClose={() => setStudentModal(null)}
        />
      )}

      <div className="max-w-4xl space-y-5">
        {/* Class name */}
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

        {/* Assigned exams */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FiFileText size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Bài tập đã giao</h3>
            <span className="badge-indigo">{assignedExams.length}</span>
          </div>
          {assignedExams.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Chưa có bài tập nào được giao cho lớp này.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-head">Tên bài tập</th>
                    <th className="table-head">Bài học</th>
                    <th className="table-head text-center">Hoàn thành</th>
                    <th className="table-head">Hạn nộp</th>
                    <th className="table-head w-44"></th>
                  </tr>
                </thead>
                <tbody>
                  {assignedExams.map(ae => (
                    <tr key={ae.exam_id} className="table-row">
                      <td className="table-cell font-medium">{ae.exam_name}</td>
                      <td className="table-cell text-gray-500">{ae.lesson_name}</td>
                      <td className="table-cell text-center">
                        <span className="font-semibold text-gray-700">
                          {ae.completed_count}/{ae.total_students}
                        </span>
                      </td>
                      <td className="table-cell">
                        {ae.deadline
                          ? <span className="text-amber-600 text-xs flex items-center gap-1">
                              <FiClock size={11} /> {formatDate(ae.deadline)}
                            </span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn-ghost text-indigo-600 hover:bg-indigo-50 py-1 px-2 text-xs gap-1"
                            disabled={exportingId === ae.exam_id}
                            onClick={() => handleExport(ae.exam_id, ae.exam_name)}>
                            {exportingId === ae.exam_id
                              ? <FiLoader size={12} className="animate-spin" />
                              : <><FiDownload size={12} /> Xuất Excel</>}
                          </button>
                          <button
                            className="btn-ghost text-red-500 hover:bg-red-50 py-1 px-2 text-xs gap-1"
                            onClick={() => handleUnassign(ae.exam_id)}>
                            <FiX size={12} /> Thu hồi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Search & add students */}
        <div className="card space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Thêm học sinh theo username</h3>
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

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiBell size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Thông báo lớp</h3>
              <span className="badge-indigo">{announcements.length}</span>
            </div>
            <button
              className="btn-primary py-1.5 px-3 text-xs gap-1.5"
              onClick={() => setAnnForm(f => ({ ...f, open: !f.open }))}>
              <FiBell size={13} /> Thêm thông báo
            </button>
          </div>

          {annForm.open && (
            <div className="mb-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề</label>
                <input
                  className="input text-sm"
                  placeholder="Nhập tiêu đề thông báo..."
                  value={annForm.title}
                  onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nội dung</label>
                <textarea
                  className="input text-sm resize-none"
                  rows={3}
                  placeholder="Nhập nội dung thông báo..."
                  value={annForm.content}
                  onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="btn-secondary text-xs py-1.5 px-3"
                  onClick={() => setAnnForm({ open: false, title: '', content: '' })}>
                  Hủy
                </button>
                <button
                  className="btn-primary text-xs py-1.5 px-3 gap-1"
                  onClick={handleCreateAnn}
                  disabled={annSaving}>
                  {annSaving ? <><FiLoader size={12} className="animate-spin" /> Đang lưu...</> : <><FiSave size={12} /> Lưu</>}
                </button>
              </div>
            </div>
          )}

          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Chưa có thông báo nào.</p>
          ) : (
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(a.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    className="btn-ghost text-red-500 hover:bg-red-50 p-1.5 shrink-0"
                    onClick={() => handleDeleteAnn(a)}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student roster */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Danh sách học sinh
                <span className="ml-2 badge-indigo">{detail.students?.length ?? 0}</span>
              </h3>
            </div>
            <button
              className="btn-secondary py-1.5 px-3 text-xs gap-1"
              onClick={handleExportStudents}
              disabled={exportingStudents}>
              <FiDownload size={13} /> {exportingStudents ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-head">Username</th>
                  <th className="table-head">Họ tên</th>
                  <th className="table-head text-center">Điểm TB</th>
                  <th className="table-head w-52"></th>
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
                          onClick={() => setStudentModal({ student: s })}>
                          <FiEye size={13} /> Xem bài
                        </button>
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
          <Pagination page={studentPage} pages={studentPages} onChange={p => setStudentPage(p)} />
        </div>
      </div>
    </TeacherLayout>
  );
}
