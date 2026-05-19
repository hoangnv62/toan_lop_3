import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchTeacherDashboard, getAIAdvice } from '../../api/studentService';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [advice, setAdvice] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const d = await fetchTeacherDashboard();
      setData(d);
      fetchAdvice(d);
    } catch (err) {
      toast.error(err.message || 'Không tải được dashboard');
    }
  }

  async function fetchAdvice(d) {
    if (!d) return;
    setLoadingAI(true);
    const dist = d.scoreDistribution;
    const totalStudents = (d.passRate?.pass ?? 0) + (d.passRate?.fail ?? 0);
    const avg = ((dist['0-4']??0)*2 + (dist['4-6']??0)*5 + (dist['6-8']??0)*7 + (dist['8-10']??0)*9)
      / Math.max(totalStudents, 1);
    try {
      const res = await getAIAdvice({ avg: +avg.toFixed(2), totalStudents, dist });
      setAdvice(res.advice || []);
    } catch {
      toast.error('Không lấy được lời khuyên AI');
    }
    setLoadingAI(false);
  }

  const summary = data?.summary ?? {};
  const dist = data?.scoreDistribution ?? {};
  const passRate = data?.passRate ?? {};

  return (
    <TeacherLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Báo cáo tổng quan</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '👨‍🎓 Học sinh', value: summary.totalStudents ?? 0 },
          { label: '🏫 Lớp', value: summary.totalClasses ?? 0 },
          { label: '📚 Bài học', value: summary.totalLessons ?? 0 },
          { label: '📝 Đề thi', value: summary.totalExams ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">📊 Phân bố điểm</h3>
          <Bar data={{
            labels: Object.keys(dist),
            datasets: [{ label: 'Số học sinh', data: Object.values(dist), backgroundColor: '#818cf8' }],
          }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card flex flex-col items-center">
          <h3 className="font-semibold text-gray-700 mb-3 self-start">✅ Tỉ lệ đạt</h3>
          <div className="w-48">
            <Doughnut data={{
              labels: ['Đạt', 'Không đạt'],
              datasets: [{ data: [passRate.pass ?? 0, passRate.fail ?? 0], backgroundColor: ['#34d399', '#f87171'] }],
            }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">🤖 AI Advisor</h3>
          <button className="btn-secondary text-sm" onClick={() => fetchAdvice(data)} disabled={loadingAI}>
            {loadingAI ? 'Đang phân tích...' : 'Phân tích lại'}
          </button>
        </div>
        {loadingAI ? (
          <p className="text-gray-400 text-sm">Đang phân tích dữ liệu...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {advice.map((item, i) => (
              <div key={i} className="bg-indigo-50 rounded-lg p-4">
                <p className="font-semibold text-indigo-700 text-sm">{item.title}</p>
                <p className="text-gray-600 text-sm mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
