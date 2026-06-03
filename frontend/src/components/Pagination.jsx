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
      <button
        className="btn-ghost py-1.5 px-2.5 text-sm disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}>
        ←
      </button>
      {getPageNums().map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
          : <button
              key={p}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 ${
                p === page
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-btn'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => onChange(p)}>
              {p}
            </button>
      )}
      <button
        className="btn-ghost py-1.5 px-2.5 text-sm disabled:opacity-40"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}>
        →
      </button>
    </div>
  );
}
