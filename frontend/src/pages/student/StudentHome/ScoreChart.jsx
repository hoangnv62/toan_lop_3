import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { FiTrendingUp } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function ScoreChart({ scores }) {
  if (scores.length === 0) return null;

  return (
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
  );
}
