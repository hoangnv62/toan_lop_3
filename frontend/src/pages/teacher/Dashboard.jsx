import { useState } from 'react';
import {
  Bar, BarChart, Cell, CartesianGrid, LabelList,
  PolarAngleAxis, RadialBar, RadialBarChart, XAxis, YAxis,
} from 'recharts';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useTeacherDashboard, useAIAdviceMutation } from '../../hooks/useStudent';
import { FiUsers, FiLayers, FiBook, FiFileText, FiRefreshCw, FiZap, FiAward, FiTrendingUp } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Các khoảng điểm là thang có thứ tự → ordinal ramp một hue, nhạt→đậm theo
// khoảng điểm tăng dần. Đã chạy scripts/validate_palette.js --ordinal trên nền
// trắng: monotone L, mọi bước ΔL ≥ 0.06, đầu nhạt 2.98:1 — PASS toàn bộ.
const DIST_RAMP = ['#818cf8', '#6366f1', '#4f46e5', '#3730a3'];

const distConfig     = { count:    { label: 'Học sinh', color: 'var(--chart-1)' } };
const classAvgConfig = { avgScore: { label: 'Điểm TB',  color: 'var(--chart-1)' } };
const passConfig     = { pass:     { label: 'Đạt',      color: 'var(--chart-2)' } };

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
  const [advice, setAdvice] = useState([]);
  const { dashboard: data } = useTeacherDashboard();
  const { fetchAdvice: getAIAdvice, loading: loadingAI } = useAIAdviceMutation();

  function fetchAdvice(d) {
    if (!d) return;
    const dist = d.scoreDistribution;
    const totalStudents = (d.passRate?.pass ?? 0) + (d.passRate?.fail ?? 0);
    const avg = ((dist['0-4'] ?? 0) * 2 + (dist['4-6'] ?? 0) * 5 + (dist['6-8'] ?? 0) * 7 + (dist['8-10'] ?? 0) * 9)
      / Math.max(totalStudents, 1);
    getAIAdvice({ avg: +avg.toFixed(2), totalStudents, dist }, result => {
      setAdvice(result || []);
    });
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
          <Card key={label} className="p-5 gap-4 flex-row items-center rounded-2xl">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0 shadow-xs`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Row 1: Score dist + Pass rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5 gap-0">
          <SectionTitle icon={FiTrendingUp} title="Phân bố điểm số" />
          <ChartContainer config={distConfig} className="h-56 w-full">
            <BarChart
              data={Object.entries(dist).map(([band, count]) => ({ band, count }))}
              margin={{ top: 16, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="band"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--accent)' }}
                content={<ChartTooltipContent formatter={v => [`${v} `, 'học sinh']} />}
              />
              {/* maxBarSize giữ mark mảnh, để lại khoảng thở trong mỗi ô */}
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {Object.keys(dist).map((band, i) => (
                  <Cell key={band} fill={DIST_RAMP[i] ?? DIST_RAMP[DIST_RAMP.length - 1]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  offset={8}
                  className="fill-slate-500"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="p-5 gap-0">
          <SectionTitle icon={FiUsers} title="Tỉ lệ đạt / không đạt" />
          <div className="flex items-center justify-center gap-8 py-2">
            <div className="relative w-40 h-40 shrink-0">
              {/* Một tỉ lệ duy nhất → meter (track cùng ramp, nhạt hơn),
                  không phải pie 2 lát. Con số ở giữa mới là nội dung chính. */}
              <ChartContainer config={passConfig} className="h-40 w-40">
                <RadialBarChart
                  data={[{ name: 'pass', pass: passPct }]}
                  startAngle={90}
                  endAngle={-270}
                  innerRadius="72%"
                  outerRadius="100%"
                  barSize={14}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    dataKey="pass"
                    cornerRadius={7}
                    fill="var(--color-pass)"
                    background={{ fill: '#d1fae5' }}
                  />
                </RadialBarChart>
              </ChartContainer>
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
        </Card>
      </div>

      {/* Row 2: Class avg + Top students */}
      {(classAvgScores.length > 0 || topStudents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {classAvgScores.length > 0 && (
            <Card className="p-5 gap-0">
              <SectionTitle icon={FiLayers} title="Điểm trung bình theo lớp" />
              {/* Tên lớp là category danh nghĩa nên không tô màu theo giá trị —
                  chiều dài cột đã mang thông tin đó rồi. Một series, một màu. */}
              <ChartContainer
                config={classAvgConfig}
                className="w-full"
                style={{ height: Math.max(140, classAvgScores.length * 40 + 40) }}
              >
                <BarChart
                  layout="vertical"
                  data={classAvgScores.map(c => ({ className: c.className, avgScore: c.avgScore ?? 0 }))}
                  margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis
                    type="number"
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="className"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--accent)' }}
                    content={<ChartTooltipContent formatter={v => [`${v} `, 'điểm']} />}
                  />
                  <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    <LabelList
                      dataKey="avgScore"
                      position="right"
                      offset={8}
                      className="fill-slate-500"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>
          )}

          {topStudents.length > 0 && (
            <Card className="p-5 gap-0">
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
            </Card>
          )}
        </div>
      )}

      {/* AI Advisor */}
      <Card className="p-5 gap-0 rounded-2xl">
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
          <Button variant="outline" className="text-xs py-1.5 gap-1.5" onClick={() => fetchAdvice(data)} disabled={loadingAI}>
            <FiRefreshCw size={13} className={loadingAI ? 'animate-spin' : ''} />
            {loadingAI ? 'Đang phân tích...' : 'Phân tích lại'}
          </Button>
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
      </Card>
    </TeacherLayout>
  );
}
