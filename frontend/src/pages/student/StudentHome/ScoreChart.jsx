import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function ScoreChart({ scores }) {
  if (!scores?.length) return null;

  const values   = scores.map(s => s.score);
  const avg      = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const best     = Math.max(...values);
  const latest   = values[values.length - 1];
  const trend    = values.length >= 2 ? +(latest - values[values.length - 2]).toFixed(1) : null;

  const pointColors  = values.map(v => v >= 5 ? '#10B981' : '#EF4444');
  const pointBorders = values.map(v => v >= 5 ? '#059669' : '#DC2626');

  const data = {
    labels: scores.map(s => s.examName),
    datasets: [
      {
        label: 'Điểm đạt',
        data: scores.map(() => 5),
        borderColor: 'rgba(245,158,11,0.45)',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        pointRadius: 0,
        borderWidth: 1.5,
        fill: false,
      },
      {
        label: 'Điểm',
        data: values,
        borderColor: '#4F46E5',
        backgroundColor(ctx) {
          const { chartArea, ctx: c } = ctx.chart;
          if (!chartArea) return 'rgba(79,70,229,0.12)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(79,70,229,0.22)');
          g.addColorStop(1, 'rgba(79,70,229,0)');
          return g;
        },
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointBorders,
        pointBorderWidth: 2,
        fill: true,
        borderWidth: 2.5,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: { duration: 700, easing: 'easeInOutQuart' },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          font: { size: 11 },
          color: '#9CA3AF',
          callback: v => v === 5 ? '5 ✦' : v,
        },
        grid: { color: ctx => ctx.tick.value === 5 ? 'rgba(245,158,11,0.2)' : '#F3F4F6' },
        border: { display: false },
      },
      x: {
        ticks: {
          font: { size: 10 },
          color: '#9CA3AF',
          maxRotation: 25,
          callback(val, i) {
            const label = scores[i]?.examName || '';
            return label.length > 12 ? label.slice(0, 12) + '…' : label;
          },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: item => item.datasetIndex === 1,
        backgroundColor: '#1E1B4B',
        titleColor: '#C7D2FE',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 10,
        titleFont: { size: 11 },
        bodyFont: { size: 14, weight: 'bold' },
        callbacks: {
          title: items => items[0]?.label || '',
          label: item => ` Điểm: ${item.raw}/10`,
          afterLabel: item => item.raw >= 5 ? ' ✓ Đạt' : ' ✗ Chưa đạt',
        },
      },
    },
  };

  const TrendIcon = trend === null ? null : trend > 0 ? FiTrendingUp : trend < 0 ? FiTrendingDown : FiMinus;
  const trendColor = trend > 0 ? 'text-emerald-600 bg-emerald-50' : trend < 0 ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-100';
  const trendLabel = trend === null ? null : trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : '0';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiTrendingUp size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Biểu đồ điểm số</h3>
        </div>
        {TrendIcon && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${trendColor}`}>
            <TrendIcon size={12} />
            {trendLabel} so với trước
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex flex-col items-center bg-indigo-50 rounded-xl py-2.5">
          <span className="text-[11px] text-indigo-400 font-medium mb-0.5">Điểm TB</span>
          <span className="text-xl font-bold text-indigo-700">{avg}</span>
        </div>
        <div className="flex flex-col items-center bg-emerald-50 rounded-xl py-2.5">
          <span className="text-[11px] text-emerald-500 font-medium mb-0.5">Cao nhất</span>
          <span className="text-xl font-bold text-emerald-700">{best}</span>
        </div>
        
      </div>

      <Line data={data} options={options} />

      <div className="flex items-center gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đạt (≥5)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Chưa đạt (&lt;5)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-5 border-t border-dashed border-amber-400 inline-block" /> Mức đạt
        </span>
      </div>
    </div>
  );
}
