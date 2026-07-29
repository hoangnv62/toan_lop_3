import { Button } from '@/components/ui/button';

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  function getPageNums() {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const nums = [1];
    const left  = Math.max(2, page - 1);
    const right = Math.min(pages - 1, page + 1);
    if (left > 2) nums.push('…');
    for (let i = left; i <= right; i++) nums.push(i);
    if (right < pages - 1) nums.push('…');
    nums.push(pages);
    return nums;
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-5">
      <Button variant="ghost" size="sm"
        className="text-slate-500 disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Trang trước">
        ←
      </Button>
      {getPageNums().map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
          : <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              aria-current={p === page ? 'page' : undefined}
              className={p === page
                ? 'rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 shadow-btn hover:from-indigo-500 hover:to-violet-500'
                : 'rounded-xl font-semibold text-slate-600'}
              onClick={() => onChange(p)}>
              {p}
            </Button>
      )}
      <Button variant="ghost" size="sm"
        className="text-slate-500 disabled:opacity-40"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        aria-label="Trang sau">
        →
      </Button>
    </div>
  );
}
