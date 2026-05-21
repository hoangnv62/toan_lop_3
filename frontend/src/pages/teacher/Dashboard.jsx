import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchTeacherDashboard, getAIAdvice } from '../../api/studentService';
import { toast } from 'react-toastify';
import { FiUsers, FiLayers, FiBook, FiFileText, FiRefreshCw, FiZap } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const chartOpts = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { x: { grid: { display: false } }, y: { grid: { color: '#F3F4F6' }, ticks: { precision: 0 } } },
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [advice, setAdvice]   = useState([]);
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

  const summary  = data?.summary ?? {};
  const dist     = data?.scoreDistribution ?? {};
  const passRate = data?.passRate ?? {};

  const statsCards = [
    { label: 'Học sinh',  value: summary.totalStudents ?? 0, icon: FiUsers,    bg: 'bg-blue-50',   text: 'text-blue-600' },
    { label: 'Lớp học',   value: summary.totalClasses ?? 0,  icon: FiLayers,   bg: 'bg-violet-50', text: 'text-violet-600' },
    { label: 'Bài học',   value: summary.totalLessons ?? 0,  icon: FiBook,     bg: 'bg-emerald-50',text: 'text-emerald-600' },
    { label: 'Bài tập',    value: summary.totalExams ?? 0,    icon: FiFileText, bg: 'bg-amber-50',  text: 'text-amber-600' },
  ];

  return (
    <TeacherLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Báo cáo tổng quan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Thống kê hoạt động học tập</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${bg}`}>
              <Icon size={20} className={text} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Phân bố điểm số</h3>
          <Bar
            data={{
              labels: Object.keys(dist),
              datasets: [{
                label: 'Số học sinh',
                data: Object.values(dist),
                backgroundColor: '#818cf8',
                borderRadius: 6,
                borderSkipped: false,
              }],
            }}
            options={chartOpts}
          />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tỉ lệ đạt / không đạt</h3>
          <div className="flex items-center justify-center gap-6">
            <div className="w-44">
              <Doughnut
                data={{
                  labels: ['Đạt', 'Không đạt'],
                  datasets: [{
                    data: [passRate.pass ?? 0, passRate.fail ?? 0],
                    backgroundColor: ['#34d399', '#f87171'],
                    borderWidth: 0,
                  }],
                }}
                options={{ plugins: { legend: { display: false } }, cutout: '65%' }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Đạt</p>
                  <p className="text-base font-bold text-gray-800">{passRate.pass ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Không đạt</p>
                  <p className="text-base font-bold text-gray-800">{passRate.fail ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Advisor */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiZap size={16} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI Advisor</h3>
              <p className="text-xs text-gray-400">Phân tích từ Gemini AI</p>
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
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : advice.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu phân tích.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {advice.map((item, i) => (
              <div key={i} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="font-semibold text-indigo-700 text-sm mb-1.5">{item.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
