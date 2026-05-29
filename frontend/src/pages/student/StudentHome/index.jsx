import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { fetchDashboard } from '../../../api/studentService';
import { logout } from '../../../api/auth';
import { getRelatives, addRelative, updateRelative, deleteRelative } from '../../../api/relativeService';
import { toast } from 'react-toastify';
import { FiChevronLeft, FiChevronRight, FiLogOut, FiFileText, FiCheckCircle, FiStar, FiList, FiUser, FiLock } from 'react-icons/fi';
import ChangePasswordModal from '../../../components/shared/ChangePasswordModal';
import ProfileModal from '../../../components/shared/ProfileModal';
import ScoreChart from './ScoreChart';
import ExamList from './ExamList';
import RankingCard from './RankingCard';
import RelativesCard from './RelativesCard';
import AnnouncementsCard from './AnnouncementsCard';
import RelativeFormModal from './RelativeFormModal';
import RelativeDeleteModal from './RelativeDeleteModal';

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

export default function StudentHome() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewAll, setViewAll]       = useState(false);
  const [data, setData]             = useState(null);
  const [relatives, setRelatives]   = useState([]);
  const [relModal, setRelModal]     = useState(null);
  const [relLoading, setRelLoading] = useState(false);
  const [pwModal, setPwModal]       = useState(false);
  const [profileModal, setProfileModal] = useState(false);

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

  useEffect(() => {
    function onFocus() {
      if (viewAll) {
        fetchDashboard(null, null, true).then(setData).catch(() => {});
      } else {
        const w = getWeekRange(weekOffset);
        fetchDashboard(toISO(w.from), toISO(w.to)).then(setData).catch(() => {});
      }
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [weekOffset, viewAll]);

  async function loadRelatives() {
    try { setRelatives(await getRelatives(user.user_id)); } catch { /* ignore */ }
  }

  async function handleRelSubmit(formData) {
    if (!formData.name.trim() || !formData.phone.trim())
      return toast.error('Tên và SĐT không được trống');
    setRelLoading(true);
    try {
      if (relModal.mode === 'add') {
        await addRelative(user.user_id, formData);
        toast.success('Thêm người thân thành công');
      } else {
        await updateRelative(relModal.item.id, formData);
        toast.success('Cập nhật thành công');
      }
      setRelModal(null);
      loadRelatives();
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
    } finally { setRelLoading(false); }
  }

  async function handleRelDelete() {
    setRelLoading(true);
    try {
      await deleteRelative(relModal.item.id);
      setRelModal(null);
      toast.success('Xóa người thân thành công');
      loadRelatives();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
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
    { label: 'Đề thi',   value: progress.totalExams ?? 0,                                 icon: FiFileText,    bg: 'bg-blue-50',    text: 'text-blue-600' },
    { label: 'Đã làm',   value: progress.done ?? 0,                                        icon: FiCheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Điểm TB',  value: progress.avg != null ? (+progress.avg).toFixed(1) : '--',  icon: FiStar,        bg: 'bg-amber-50',   text: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
              {data?.teacher && (
                <p className="text-xs text-gray-400 mt-0.5">
                  GV: {data.teacher.fullName}
                  {data.teacher.phone && <> · {data.teacher.phone}</>}
                  {data.teacher.email && <> · {data.teacher.email}</>}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setProfileModal(true)}
              className="btn-ghost text-gray-500 py-1.5 px-2.5 gap-1.5">
              <FiUser size={15} />
            </button>
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

        <ScoreChart scores={scores} />
        <AnnouncementsCard announcements={data?.announcements} />
        <ExamList exams={exams} viewAll={viewAll} />
        <RankingCard ranking={ranking} userId={user?.user_id} />
        <RelativesCard
          relatives={relatives}
          onAdd={() => setRelModal({ mode: 'add' })}
          onEdit={rel => setRelModal({ mode: 'edit', item: rel })}
          onDelete={rel => setRelModal({ mode: 'delete', item: rel })}
        />
      </div>

      {pwModal && <ChangePasswordModal onClose={() => setPwModal(false)} />}
      {profileModal && <ProfileModal onClose={() => setProfileModal(false)} />}

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
