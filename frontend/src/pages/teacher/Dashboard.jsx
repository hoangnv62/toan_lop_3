import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchTeacherDashboard, getAIAdvice } from '../../api/studentService';
import { toast } from 'react-toastify';
import { FiUsers, FiLayers, FiBook, FiFileText, FiRefreshCw, FiZap, FiAward, FiTrendingUp } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const DIST_COLORS = ['#f87171', '#fbbf24', '#818cf8', '#34d399'];

const distOpts = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${ctx.raw} học sinh` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 12, family: 'Plus Jakarta Sans' } } },
    y: { grid: { color: '#F1F5F9' }, ticks: { precision: 0, stepSize: 1, font: { size: 12, family: 'Plus Jakarta Sans' } } },
  },
};

const hBarOpts = {
  indexAxis: 'y',
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${ctx.raw} điểm` } },
  },
  scales: {
    x: { grid: { color: '#F1F5F9' }, min: 0, max: 10, ticks: { stepSize: 2, font: { size: 12, family: 'Plus Jakarta Sans' } } },
    y: { grid: { display: false }, ticks: { font: { size: 12, family: 'Plus Jakarta Sans' } } },
  },
};

function SectionTitle({ icon: Icon, title, iconColor = 'text-indigo-500' }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-4 h-4 ${iconColor}`}>
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
  );
}

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

export default function Dashboard() {
  const [data, setData]           = useState(null);
  const [advice, setAdvice]       = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const d = await fetchTeacherDashboard();
      setData(d);
    } catch (err) {
      toast.error(err.message || 'Không tải được dashboard');
    }
  }

  async function fetchAdvice(d) {
    if (!d) return;
    setLoadingAI(true);
    const dist = d.scoreDistribution;
    const totalStudents = (d.passRate?.pass ?? 0) + (d.passRate?.fail ?? 0);
    const avg = ((dist['0-4'] ?? 0) * 2 + (dist['4-6'] ?? 0) * 5 + (dist['6-8'] ?? 0) * 7 + (dist['8-10'] ?? 0) * 9)
      / Math.max(totalStudents, 1);
    try {
      const res = await getAIAdvice({ avg: +avg.toFixed(2), totalStudents, dist });
      setAdvice(res.advice || []);
    } catch {
      toast.error('Không lấy được lời khuyên AI');
    }
    setLoadingAI(false);
  }

  const summary        = data?.summary ?? {};
  const dist           = data?.scoreDistribution ?? {};
  const passRate       = data?.passRate ?? {};
  const topStudents    = data?.topStudents ?? [];
  const classAvgScores = data?.classAvgScores ?? [];
  const passTotal      = (passRate.pass ?? 0) + (passRate.fail ?? 0);
  const passPct        = passTotal > 0 ? Math.round((passRate.pass / passTotal) * 100) : 0;

  const statsCards = [
    { label: 'Học sinh',  value: summary.totalStudents ?? 0, icon: FiUsers,    from: 'from-blue-500',    to: 'to-blue-400' },
    { label: 'Lớp học',   value: summary.totalClasses ?? 0,  icon: FiLayers,   from: 'from-violet-500',  to: 'to-violet-400' },
    { label: 'Bài học',   value: summary.totalLessons ?? 0,  icon: FiBook,     from: 'from-emerald-500', to: 'to-emerald-400' },
    { label: 'Bài tập',   value: summary.totalExams ?? 0,    icon: FiFileText, from: 'from-amber-500',   to: 'to-amber-400' },
  ];

  return (
    <TeacherLayout>
      {/* Header banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-6 mb-6 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 right-20 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-4 right-32 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Báo cáo tổng quan</h1>
          <p className="text-indigo-100 text-sm mt-0.5">Thống kê hoạt động học tập của tất cả lớp</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map(({ label, value, icon: Icon, from, to }) => (
          <div key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 p-5 flex items-center gap-4 transition-all duration-200">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Score dist + Pass rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <SectionTitle icon={FiTrendingUp} title="Phân bố điểm số" />
          <Bar
            data={{
              labels: Object.keys(dist),
              datasets: [{
                label: 'Số học sinh',
                data: Object.values(dist),
                backgroundColor: DIST_COLORS,
                borderRadius: 8,
                borderSkipped: false,
              }],
            }}
            options={distOpts}
          />
          <div className="flex gap-3 mt-3 flex-wrap">
            {Object.keys(dist).map((k, i) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: DIST_COLORS[i] }} />
                <span className="text-xs text-slate-500">{k}: <span className="font-semibold text-slate-700">{dist[k]}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle icon={FiUsers} title="Tỉ lệ đạt / không đạt" />
          <div className="flex items-center justify-center gap-8 py-2">
            <div className="relative w-40 h-40 shrink-0">
              <Doughnut
                data={{
                  labels: ['Đạt', 'Không đạt'],
                  datasets: [{
                    data: [passRate.pass ?? 0, passRate.fail ?? 0],
                    backgroundColor: ['#34d399', '#f87171'],
                    borderWidth: 0,
                    hoverOffset: 4,
                  }],
                }}
                options={{ plugins: { legend: { display: false } }, cutout: '68%' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-extrabold text-slate-900 leading-none">{passPct}%</p>
                <p className="text-xs text-slate-400 mt-0.5">đạt</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-xs text-slate-500">Đạt (≥ 5)</p>
                </div>
                <p className="text-2xl font-extrabold text-emerald-600 pl-5">{passRate.pass ?? 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs text-slate-500">Không đạt</p>
                </div>
                <p className="text-2xl font-extrabold text-red-500 pl-5">{passRate.fail ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Class avg + Top students */}
      {(classAvgScores.length > 0 || topStudents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {classAvgScores.length > 0 && (
            <div className="card">
              <SectionTitle icon={FiLayers} title="Điểm trung bình theo lớp" />
              <Bar
                data={{
                  labels: classAvgScores.map(c => c.className),
                  datasets: [{
                    label: 'Điểm TB',
                    data: classAvgScores.map(c => c.avgScore ?? 0),
                    backgroundColor: classAvgScores.map(c =>
                      (c.avgScore ?? 0) >= 8 ? '#34d399' :
                      (c.avgScore ?? 0) >= 5 ? '#818cf8' : '#f87171'
                    ),
                    borderRadius: 6,
                    borderSkipped: false,
                  }],
                }}
                options={hBarOpts}
              />
            </div>
          )}

          {topStudents.length > 0 && (
            <div className="card">
              <SectionTitle icon={FiAward} title="Top 5 học sinh" iconColor="text-amber-500" />
              <div className="space-y-1">
                {topStudents.map((s, i) => {
                  const score = s.avgScore ?? 0;
                  const pillCls = score >= 8
                    ? 'bg-emerald-100 text-emerald-700'
                    : score >= 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-600';
                  const avatarCls = score >= 8
                    ? 'bg-emerald-100 text-emerald-700'
                    : score >= 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-600';
                  return (
                    <div key={s.studentId}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <span className="w-6 text-center text-base shrink-0 select-none">
                        {i < 3 ? RANK_MEDAL[i] : <span className="text-xs font-bold text-slate-300">{i + 1}</span>}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none ${avatarCls}`}>
                        {(s.studentName ?? '?').trim().split(' ').pop().charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                          {s.studentName ?? `Học sinh #${s.studentId}`}
                        </p>
                      </div>
                      <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${pillCls}`}>
                        {s.avgScore ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Advisor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-btn">
              <FiZap size={17} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Advisor</h3>
              <p className="text-xs text-slate-400">Phân tích từ Gemini AI</p>
            </div>
          </div>
          <button className="btn-secondary text-xs py-1.5 gap-1.5"
            onClick={() => fetchAdvice(data)} disabled={loadingAI}>
            <FiRefreshCw size={13} className={loadingAI ? 'animate-spin' : ''} />
            {loadingAI ? 'Đang phân tích...' : 'Phân tích lại'}
          </button>
        </div>

        {loadingAI ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : advice.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <FiZap size={18} className="text-indigo-300" />
            </div>
            <p className="text-sm text-slate-400">Nhấn "Phân tích lại" để nhận lời khuyên từ AI</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {advice.map((item, i) => (
              <div key={i} className="relative bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl p-4 border border-indigo-100/80 overflow-hidden hover:-translate-y-0.5 transition-transform duration-200">
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0 shadow-glow">
                  <span className="text-xs font-bold text-white">{i + 1}</span>
                </div>
                <p className="text-sm font-bold text-indigo-700 mb-1.5 pr-8 leading-tight">{item.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
