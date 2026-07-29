
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';const rankBadge = ['bg-yellow-400', 'bg-slate-300', 'bg-orange-400'];

export default function RankingCard({ ranking, userId }) {
  if (ranking.length === 0) return null;

  return (
    <Card className="p-5 gap-0">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Bảng xếp hạng lớp</h3>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div key={r.studentId}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
              r.studentId === userId
                ? 'bg-indigo-50 border border-indigo-100'
                : 'hover:bg-slate-50'
            }`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
              rankBadge[i] || 'bg-slate-200 !text-slate-600'
            }`}>
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-slate-800">{r.name}</span>
            {r.studentId === userId && (
              <Badge variant="info" className="text-xs">Bạn</Badge>
            )}
            <span className={`text-sm font-bold ${(+r.avg) >= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
              {(+r.avg).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
