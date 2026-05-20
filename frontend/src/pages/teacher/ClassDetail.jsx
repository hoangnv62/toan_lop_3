import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import {
  getClassDetail, searchStudents, assignStudent, removeStudent,
  uploadStudents, updateClass, getClassExams, unassignExam,
} from '../../api/classService';
import { exportExam, getStudentSubmission } from '../../api/examService';
import { getStudentResults } from '../../api/studentService';
import { getRelatives } from '../../api/relativeService';
import { toast } from 'react-toastify';
import {
  FiSearch, FiUpload, FiUserX, FiUserPlus, FiLoader, FiUsers, FiPhone,
  FiUser, FiX, FiDownload, FiEye, FiFileText, FiChevronLeft,
  FiCheckCircle, FiXCircle, FiClock,
} from 'react-icons/fi';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Modal: Xem bài làm học sinh ───────────────────────────────────────────────
function StudentResultsModal({ student, onClose }) {
  const [results, setResults]     = useState(null);
  const [detail, setDetail]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    getStudentResults(student.id)
      .then(data => setResults(data))
      .catch(() => setResults({ studentName: student.full_name, results: [] }));
  }, [student.id]);

  async function viewDetail(examId, examName) {
    setLoadingDetail(true);
    try {
      const data = await getStudentSubmission(examId, student.id);
      setDetail({ ...data, examNameLabel: examName });
    } catch (err) {
      toast.error(err.message || 'Không tải được bài làm');
    } finally { setLoadingDetail(false); }
  }

  // ── Detail view ──
  if (detail) {
    const passed = detail.score >= 5;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
            <button
              onClick={() => setDetail(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <FiChevronLeft size={17} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{detail.examNameLabel}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{student.full_name}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {detail.score}/10
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <FiX size={17} />
            </button>
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 shrink-0">
            <span>{detail.correct}/{detail.total} câu đúng</span>
            {detail.timeSpent > 0 && (
              <span className="flex items-center gap-1">
                <FiClock size={11} /> {Math.floor(detail.timeSpent / 60)}p{detail.timeSpent % 60}s
              </span>
            )}
            {detail.submittedAt && <span>Nộp: {formatDate(detail.submittedAt)}</span>}
          </div>

          {/* Questions */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {detail.questions.map((q, qi) => {
              const correctAns = q.answers.find(a => a.isCorrected === 1);
              const selectedAns = q.answers.find(a => a.isSelected);
              return (
                <div key={q.questionId}
                  className={`rounded-xl border-2 p-4 ${q.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/20'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className={`mt-0.5 shrink-0 ${q.isCorrect ? 'text-emerald-500' : 'text-red-400'}`}>
                      {q.isCorrect ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
                    </span>
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      <span className="badge-indigo mr-2 text-xs">Câu {qi + 1}</span>
                      {q.questionContent}
                    </p>
                  </div>
                  <div className="space-y-1.5 ml-6">
                    {q.answers.map(a => {
                      const isCorrect  = a.isCorrected === 1;
                      const isSelected = a.isSelected;
                      let cls = 'border-gray-200 text-gray-600';
                      if (isCorrect)               cls = 'border-emerald-400 bg-emerald-50 text-emerald-700 font-medium';
                      if (isSelected && !isCorrect) cls = 'border-red-400 bg-red-50 text-red-600 font-medium';
                      return (
                        <div key={a.answerId}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cls}`}>
                          {isCorrect && <FiCheckCircle size={13} className="text-emerald-500 shrink-0" />}
                          {isSelected && !isCorrect && <FiXCircle size={13} className="text-red-400 shrink-0" />}
                          {!isCorrect && !isSelected && <span className="w-3.5 shrink-0" />}
                          <span>{a.content}</span>
                          {isSelected && <span className="ml-auto text-xs opacity-60">(Đã chọn)</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <p className="mt-2 ml-6 text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Bài làm của học sinh</h3>
            <p className="text-xs text-gray-400 mt-0.5">{student.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        {results === null ? (
          <div className="flex justify-center py-10">
            <FiLoader size={20} className="animate-spin text-gray-300" />
          </div>
        ) : results.results.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Học sinh chưa làm bài nào.</p>
        ) : (
          <div className="space-y-2">
            {results.results.map(r => {
              const passed = r.score >= 5;
              return (
                <div key={r.examId}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.examName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.lessonName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-bold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                      {r.score}/10
                    </span>
                    <button
                      className="btn-secondary py-1 px-2.5 text-xs gap-1"
                      disabled={loadingDetail}
                      onClick={() => viewDetail(r.examId, r.examName)}>
                      {loadingDetail
                        ? <FiLoader size={12} className="animate-spin" />
                        : <><FiEye size={12} /> Chi tiết</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button className="btn-secondary w-full mt-5" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

// ── Modal: Người thân ─────────────────────────────────────────────────────────
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
  const [exportingId, setExportingId]     = useState(null);
  const [file, setFile]                   = useState(null);
  const fileRef     = useRef();
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
      const [data, exams] = await Promise.all([
        getClassDetail(classId),
        getClassExams(classId),
      ]);
      setDetail(data);
      setClassName(data.className);
      setAssignedExams(exams);
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
            <h3 className="text-sm font-semibold text-gray-900">Đề thi đã giao</h3>
            <span className="badge-indigo">{assignedExams.length}</span>
          </div>
          {assignedExams.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Chưa có đề thi nào được giao cho lớp này.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-head">Tên đề thi</th>
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
        </div>
      </div>
    </TeacherLayout>
  );
}
