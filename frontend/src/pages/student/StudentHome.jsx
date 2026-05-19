import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboard } from '../../api/studentService';
import { logout } from '../../api/auth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + 1 + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  return { from: fmt(mon), to: fmt(sun), label: `${fmt(mon)} – ${fmt(sun)}` };
}

function toISO(ddmmyyyy) {
  const [d,m,y] = ddmmyyyy.split('/');
  return `${y}-${m}-${d}`;
}

export default function StudentHome() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState(null);

  const week = getWeekRange(weekOffset);

  useEffect(() => {
    fetchDashboard(toISO(week.from), toISO(week.to)).then(setData).catch(() => {});
  }, [weekOffset]);

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/');
  }

  const exams = data?.exams ?? [];
  const scores = data?.scores ?? [];
  const ranking = data?.ranking ?? [];
  const progress = data?.progress ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-xl font-bold">Xin chào, {user?.name || 'Học sinh'} 👋</h1>
        </div>
        <button onClick={handleLogout} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
          Đăng xuất
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Week navigator */}
        <div className="card flex items-center justify-between">
          <button onClick={() => setWeekOffset(o => o - 1)} className="btn-secondary text-sm py-1 px-3">‹ Tuần trước</button>
          <span className="font-medium text-gray-700 text-sm">{week.label}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="btn-secondary text-sm py-1 px-3" disabled={weekOffset >= 0}>
            Tuần sau ›
          </button>
        </div>

        {/* Progress summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '📝 Đề thi', value: progress.totalExams ?? 0 },
            { label: '✅ Đã làm', value: progress.done ?? 0 },
            { label: '⭐ Điểm TB', value: progress.avg != null ? (+progress.avg).toFixed(1) : '--' },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Score chart */}
        {scores.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">📈 Điểm số trong tuần</h3>
            <Line data={{
              labels: scores.map(s => s.examName),
              datasets: [{
                label: 'Điểm', data: scores.map(s => s.score),
                borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.15)',
                tension: 0.3, pointRadius: 4,
              }],
            }} options={{
              responsive: true,
              scales: { y: { min: 0, max: 10 } },
              plugins: { legend: { display: false } },
            }} />
          </div>
        )}

        {/* Exam list */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">📚 Danh sách đề thi</h3>
          {exams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Không có đề thi trong tuần này.</p>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => (
                <div key={exam.examId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{exam.examName}</p>
                    <p className="text-xs text-gray-400">{exam.lessonTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {exam.score != null && (
                      <span className={`text-sm font-bold ${exam.score >= 5 ? 'text-green-600' : 'text-red-500'}`}>
                        {exam.score}/10
                      </span>
                    )}
                    {exam.done ? (
                      <button className="btn-secondary text-xs py-1 px-3"
                        onClick={() => navigate(`/exam-result/${exam.examId}`)}>
                        Xem kết quả
                      </button>
                    ) : (
                      <button className="btn-primary text-xs py-1 px-3"
                        onClick={() => navigate(`/student/exam/${exam.examId}`)}>
                        Làm bài
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ranking */}
        {ranking.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">🏆 Bảng xếp hạng lớp</h3>
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.studentId} className={`flex items-center gap-3 p-2 rounded-lg ${r.studentId === user?.user_id ? 'bg-indigo-50 border border-indigo-200' : ''}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{r.name}</span>
                  <span className="text-sm font-bold text-indigo-600">{(+r.avg).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
