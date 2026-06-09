import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
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
import { useStudentDashboard } from '../../../hooks/useStudent';
import { useRelatives, useRelativeMutations } from '../../../hooks/useRelative';
import { useAuthMutations } from '../../../hooks/useAuth';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewAll, setViewAll]       = useState(false);
  const [relModal, setRelModal]     = useState(null);
  const [pwModal, setPwModal]       = useState(false);
  const [profileModal, setProfileModal] = useState(false);

  const week = getWeekRange(weekOffset);

  const dateFrom = viewAll ? null : toISO(week.from);
  const dateTo   = viewAll ? null : toISO(week.to);
  const { dashboard: data, setDashboard: setData } = useStudentDashboard(dateFrom, dateTo, viewAll);

  const { relatives, setRelatives } = useRelatives(user?.userId);
  const { add: addRel, update: updateRel, remove: removeRel, loading: relLoading } = useRelativeMutations();
  const { logout } = useAuthMutations();

  // Re-fetch dashboard when window regains focus
  useEffect(() => {
    function onFocus() {
      setData(null);
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []); // eslint-disable-line

  async function handleRelSubmit(formData) {
    if (!formData.name.trim() || !formData.phone.trim())
      return toast.error('Tên và SĐT không được trống');
    if (relModal.mode === 'add') {
      await addRel(user.userId, formData, newRel => {
        setRelatives(prev => [...prev, newRel]);
        setRelModal(null);
      });
    } else {
      await updateRel(relModal.item.id, formData, updated => {
        setRelatives(prev => prev.map(r => r.id === updated.id ? updated : r));
        setRelModal(null);
      });
    }
  }

  async function handleRelDelete() {
    await removeRel(relModal.item.id, () => {
      setRelatives(prev => prev.filter(r => r.id !== relModal.item.id));
      setRelModal(null);
    });
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const exams    = data?.exams ?? [];
  const scores   = data?.scores ?? [];
  const ranking  = (data?.ranking ?? []).slice().sort((a, b) => (+b.avg) - (+a.avg));
  const progress = data?.progress ?? {};

  const stats = [
    { label: 'Đề thi',  value: progress.totalExams ?? 0,                                icon: FiFileText,    from: 'from-blue-500',    to: 'to-blue-400' },
    { label: 'Đã làm',  value: progress.done ?? 0,                                       icon: FiCheckCircle, from: 'from-emerald-500', to: 'to-emerald-400' },
    { label: 'Điểm TB', value: progress.avg != null ? (+progress.avg).toFixed(1) : '--', icon: FiStar,        from: 'from-amber-500',   to: 'to-amber-400' },
  ];

  const initials = (user?.name || 'H').trim().split(' ').pop().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-[0_1px_20px_-4px_rgba(79,70,229,0.1)]">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-btn shrink-0">
              <span className="text-white font-extrabold text-sm leading-none">3</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                Xin chào, {user?.name || 'Học sinh'}!
              </p>
              <p className="text-xs text-slate-400">Toán Lớp 3</p>
              {data?.teacher && (
                <p className="text-xs text-slate-400 mt-0.5">
                  GV: {data.teacher.fullName}
                  {data.teacher.phone && <> · {data.teacher.phone}</>}
                  {data.teacher.email && <> · {data.teacher.email}</>}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setProfileModal(true)}
              className="btn-ghost text-slate-500 py-1.5 px-2.5 gap-1.5">
              <FiUser size={15} />
            </button>
            <button onClick={() => setPwModal(true)}
              className="btn-ghost text-slate-500 py-1.5 px-2.5 gap-1.5">
              <FiLock size={15} />
            </button>
            <button onClick={handleLogout}
              className="btn-ghost text-slate-500 py-1.5 px-2.5 gap-1.5">
              <FiLogOut size={15} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">
        {/* View toggle + Week navigator */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !viewAll
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-btn'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setViewAll(false)}>
              <FiChevronLeft size={14} className="inline mr-1" />Theo tuần
            </button>
            <button
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                viewAll
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-btn'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
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
              <span className="text-sm font-semibold text-slate-700 text-center">{week.label}</span>
              <button onClick={() => setWeekOffset(o => o + 1)}
                className="btn-secondary py-1.5 px-3 gap-1" disabled={weekOffset >= 0}>
                Tuần sau <FiChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, from, to }) => (
            <div key={label}
              className="bg-white rounded-xl border border-slate-100 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center py-4 gap-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </div>

        <ScoreChart scores={scores} />
        <AnnouncementsCard announcements={data?.announcements} />
        <ExamList exams={exams} viewAll={viewAll} />
        <RankingCard ranking={ranking} userId={user?.userId} />
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
