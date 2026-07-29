import { Area, AreaChart, CartesianGrid, Dot, ReferenceLine, XAxis, YAxis } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const PASS_MARK = 5;

// Một series duy nhất → 1 hue indigo của dự án. Màu chấm dùng bảng trạng thái
// (đạt / chưa đạt) và luôn đi kèm chú thích chữ bên dưới, không dựa vào màu.
const chartConfig = {
  score: { label: 'Điểm', color: 'var(--chart-1)' },
};

const PASS_COLOR = 'var(--chart-2)';
const FAIL_COLOR = 'var(--chart-5)';

// Chấm mang màu trạng thái + vòng 2px màu nền để không dính vào đường kẻ.
function ScoreDot({ cx, cy, payload, r = 4 }) {
  if (cx == null || cy == null) return null;
  return (
    <Dot
      cx={cx} cy={cy} r={r}
      fill={payload.score >= PASS_MARK ? PASS_COLOR : FAIL_COLOR}
      stroke="var(--card)"
      strokeWidth={2}
    />
  );
}

export default function ScoreChart({ scores }) {
  if (!scores?.length) return null;

  const values = scores.map(s => s.score);
  const avg    = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const best   = Math.max(...values);
  const latest = values[values.length - 1];
  const trend  = values.length >= 2 ? +(latest - values[values.length - 2]).toFixed(1) : null;

  const data = scores.map(s => ({ examName: s.examName, score: s.score }));

  const TrendIcon = trend === null ? null : trend > 0 ? FiTrendingUp : trend < 0 ? FiTrendingDown : FiMinus;
  const trendColor = trend > 0 ? 'text-emerald-600 bg-emerald-50' : trend < 0 ? 'text-red-500 bg-red-50' : 'text-slate-400 bg-slate-100';
  const trendLabel = trend === null ? null : trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : '0';

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiTrendingUp size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Biểu đồ điểm số</h3>
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

      <ChartContainer config={chartConfig} className="h-56 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-score)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-score)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="examName"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickFormatter={v => (v.length > 8 ? `${v.slice(0, 8)}…` : v)}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />

          {/* Mức đạt — đường ngưỡng, nét liền mảnh để không lẫn với lưới.
              Không gắn nhãn trên đường: chú thích dưới biểu đồ đã nói rồi,
              đặt ở đây sẽ đè lên tick trục Y. */}
          <ReferenceLine y={PASS_MARK} stroke="var(--chart-3)" strokeWidth={1.5} />

          <ChartTooltip
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                formatter={(value) => [`${value}/10 `, value >= PASS_MARK ? 'Đạt' : 'Chưa đạt']}
              />
            }
          />

          <Area
            dataKey="score"
            type="monotone"
            stroke="var(--color-score)"
            strokeWidth={2}
            fill="url(#scoreFill)"
            dot={<ScoreDot />}
            activeDot={<ScoreDot r={6} />}
          />
        </AreaChart>
      </ChartContainer>

      <div className="flex items-center gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đạt (≥5)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Chưa đạt (&lt;5)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-5 border-t border-amber-500 inline-block" /> Mức đạt
        </span>
      </div>
    </Card>
  );
}
