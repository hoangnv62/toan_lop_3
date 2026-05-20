import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboard } from '../../api/studentService';
import { logout, changePassword } from '../../api/auth';
import {
  FiChevronLeft, FiChevronRight, FiLogOut, FiFileText, FiCheckCircle, FiStar,
  FiTrendingUp, FiUsers, FiPlus, FiEdit2, FiTrash2, FiX, FiPhone, FiUser,
  FiClock, FiLock, FiList, FiLoader,
} from 'react-icons/fi';
import { getRelatives, addRelative, updateRelative, deleteRelative } from '../../api/relativeService';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + 1 + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  return { from: fmt(mon), to: fmt(sun), label: `${fmt(mon)} – ${fmt(sun)}` };
}
function toISO(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m}-${d}`;
}

const rankBadge = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-400'];

function ChangePasswordModal({ onClose }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSave() {
    if (!currentPw || !newPw || !confirmPw) return toast.error('Vui lòng điền đầy đủ thông tin');
    if (newPw !== confirmPw) return toast.error('Mật khẩu mới không khớp');
    if (newPw.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    setLoading(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success('Đổi mật khẩu thành công');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Đổi mật khẩu</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input className="input" type="password" placeholder="••••••••"
              value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <input className="input" type="password" placeholder="Ít nhất 6 ký tự"
              value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input className="input" type="password" placeholder="Nhập lại mật khẩu mới"
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</> : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}

const RELATIONSHIPS = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị', 'Chú', 'Bác', 'Cô', 'Dì', 'Người giám hộ'];

function RelativeFormModal({ initial, onClose, onSubmit, loading }) {
  const [name, setName]             = useState(initial?.name || '');
  const [phone, setPhone]           = useState(initial?.phone || '');
  const [relationship, setRelationship] = useState(initial?.relationship || '');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{initial ? 'Sửa người thân' : 'Thêm người thân'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input className="input" placeholder="Nguyễn Văn A" value={name}
              onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input className="input" placeholder="0912345678" value={phone}
              onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quan hệ</label>
            <select className="input" value={relationship} onChange={e => setRelationship(e.target.value)}>
              <option value="">-- Chọn quan hệ --</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" disabled={loading}
            onClick={() => onSubmit({ name, phone, relationship })}>
            {loading ? 'Đang lưu...' : (initial ? 'Cập nhật' : 'Thêm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function RelativeDeleteModal({ relative, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiTrash2 size={22} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-gray-900">Xóa người thân</h3>
          <p className="text-sm text-gray-500 mt-2">
            Xóa <span className="font-semibold text-gray-800">{relative.name}</span> khỏi danh sách?
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentHome() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewAll, setViewAll]       = useState(false);
  const [data, setData]             = useState(null);
  const [relatives, setRelatives]   = useState([]);
  const [relModal, setRelModal]     = useState(null); // null | { mode:'add' } | { mode:'edit', item } | { mode:'delete', item }
  const [relLoading, setRelLoading] = useState(false);
  const [pwModal, setPwModal]       = useState(false);

  const week = getWeekRange(weekOffset);

  useEffect(() => {
    setData(null);
    if (viewAll) {
      fetchDashboard(null, null, true).then(setData).catch(() => {});
    } else {
      fetchDashboard(toISO(week.from), toISO(week.to)).then(setData).catch(() => {});
    }
  }, [weekOffset, viewAll]);

  useEffect(() => {
    if (user?.user_id) loadRelatives();
  }, [user]);

  async function loadRelatives() {
    try { setRelatives(await getRelatives(user.user_id)); } catch { /* ignore */ }
  }

  async function handleRelSubmit(formData) {
    if (!formData.name.trim() || !formData.phone.trim()) {
      return import('react-toastify').then(({ toast }) => toast.error('Tên và SĐT không được trống'));
    }
    setRelLoading(true);
    try {
      if (relModal.mode === 'add') {
        await addRelative(user.user_id, formData);
        toast.success("Thêm người thân thành công")
      } else {
        await updateRelative(relModal.item.id, formData);
        toast.success("Cập nhật thành công")
      }
      setRelModal(null);
      loadRelatives();
    } catch (err) {
      import('react-toastify').then(({ toast }) => toast.error(err.message || 'Thao tác thất bại'));
    } finally { setRelLoading(false); }
  }

  async function handleRelDelete() {
    setRelLoading(true);
    try {
      await deleteRelative(relModal.item.id);
      setRelModal(null);
      toast.success("Xóa người thân thành công")
      loadRelatives();
    } catch (err) {
      import('react-toastify').then(({ toast }) => toast.error(err.message || 'Xóa thất bại'));
    } finally { setRelLoading(false); }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/');
  }

  const exams    = data?.exams ?? [];
  const scores   = data?.scores ?? [];
  const ranking  = (data?.ranking ?? []).slice().sort((a, b) => (+b.avg) - (+a.avg));
  const progress = data?.progress ?? {};

  const stats = [
    { label: 'Đề thi',  value: progress.totalExams ?? 0, icon: FiFileText,    bg: 'bg-blue-50',    text: 'text-blue-600' },
    { label: 'Đã làm',  value: progress.done ?? 0,       icon: FiCheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Điểm TB', value: progress.avg != null ? (+progress.avg).toFixed(1) : '--', icon: FiStar, bg: 'bg-amber-50', text: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">3</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Xin chào, {user?.name || 'Học sinh'}!
              </p>
              <p className="text-xs text-gray-400">Toán Lớp 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPwModal(true)}
              className="btn-ghost text-gray-500 py-1.5 px-2.5 gap-1.5">
              <FiLock size={15} />
            </button>
            <button onClick={handleLogout}
              className="btn-ghost text-gray-500 py-1.5 px-2.5 gap-1.5">
              <FiLogOut size={15} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">
        {/* View toggle + Week navigator */}
        <div className="card py-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <button
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!viewAll ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setViewAll(false)}>
              <FiChevronLeft size={14} className="inline mr-1" />Theo tuần
            </button>
            <button
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${viewAll ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setViewAll(true)}>
              <FiList size={14} className="inline mr-1" />Tất cả
            </button>
          </div>
          {!viewAll && (
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => setWeekOffset(o => o - 1)}
                className="btn-secondary py-1.5 px-3 gap-1">
                <FiChevronLeft size={15} /> Tuần trước
              </button>
              <span className="text-sm font-medium text-gray-700 text-center">{week.label}</span>
              <button onClick={() => setWeekOffset(o => o + 1)}
                className="btn-secondary py-1.5 px-3 gap-1" disabled={weekOffset >= 0}>
                Tuần sau <FiChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="card flex flex-col items-center py-4 gap-2">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={text} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Score chart */}
        {scores.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Điểm số trong tuần</h3>
            </div>
            <Line
              data={{
                labels: scores.map(s => s.examName),
                datasets: [{
                  label: 'Điểm', data: scores.map(s => s.score),
                  borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.08)',
                  tension: 0.4, pointRadius: 5, pointBackgroundColor: '#4F46E5',
                  fill: true,
                }],
              }}
              options={{
                responsive: true,
                scales: {
                  y: { min: 0, max: 10, grid: { color: '#F3F4F6' } },
                  x: { grid: { display: false } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        )}

        {/* Exam list */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Danh sách đề thi</h3>
          {exams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              {viewAll ? 'Chưa có đề thi nào.' : 'Không có đề thi trong tuần này.'}
            </p>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => {
                const isPastDeadline = exam.deadline && new Date(exam.deadline) < new Date();
                return (
                  <div key={exam.examId}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="font-medium text-gray-900 text-sm truncate">{exam.examName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{exam.lessonTitle}</p>
                      {exam.deadline && !exam.done && (
                        <p className={`text-xs mt-0.5 flex items-center gap-1 ${isPastDeadline ? 'text-red-500' : 'text-amber-600'}`}>
                          <FiClock size={10} />
                          {isPastDeadline ? 'Hết hạn: ' : 'Hạn: '}
                          {new Date(exam.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {exam.score != null && (
                        <span className={`text-sm font-bold ${exam.score >= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {exam.score}/10
                        </span>
                      )}
                      {exam.done ? (
                        <button className="btn-secondary py-1.5 px-3 text-xs"
                          onClick={() => navigate(`/exam-result/${exam.examId}`)}>
                          Xem kết quả
                        </button>
                      ) : (
                        <button
                          className="btn-primary py-1.5 px-3 text-xs disabled:opacity-50 disabled:pointer-events-none"
                          disabled={isPastDeadline}
                          onClick={() => navigate(`/student/exam/${exam.examId}`)}>
                          {isPastDeadline ? 'Hết hạn' : 'Làm bài'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ranking */}
        {ranking.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Bảng xếp hạng lớp</h3>
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.studentId}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    r.studentId === user?.user_id
                      ? 'bg-indigo-50 border border-indigo-100'
                      : 'hover:bg-gray-50'
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    rankBadge[i] || 'bg-gray-200 !text-gray-600'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{r.name}</span>
                  {r.studentId === user?.user_id && (
                    <span className="badge-indigo text-xs">Bạn</span>
                  )}
                  <span className={`text-sm font-bold ${(+r.avg) >= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {(+r.avg).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relatives */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiUsers size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Người thân</h3>
              <span className="badge-gray text-xs">{relatives.length}/5</span>
            </div>
            {relatives.length < 5 && (
              <button className="btn-primary py-1.5 px-3 gap-1.5 text-xs"
                onClick={() => setRelModal({ mode: 'add' })}>
                <FiPlus size={13} /> Thêm
              </button>
            )}
          </div>

          {relatives.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Chưa có người thân nào.</p>
          ) : (
            <div className="space-y-2">
              {relatives.map(rel => (
                <div key={rel.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      onClick={() => setRelModal({ mode: 'edit', item: rel })}>
                      <FiEdit2 size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => setRelModal({ mode: 'delete', item: rel })}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pwModal && <ChangePasswordModal onClose={() => setPwModal(false)} />}

      {/* Modals */}
      {(relModal?.mode === 'add' || relModal?.mode === 'edit') && (
        <RelativeFormModal
          initial={relModal.mode === 'edit' ? relModal.item : null}
          onClose={() => setRelModal(null)}
          onSubmit={handleRelSubmit}
          loading={relLoading}
        />
      )}
      {relModal?.mode === 'delete' && (
        <RelativeDeleteModal
          relative={relModal.item}
          onClose={() => setRelModal(null)}
          onConfirm={handleRelDelete}
          loading={relLoading}
        />
      )}
    </div>
  );
}
