import { useEffect, useRef, useState } from 'react';
import { FiLoader, FiSearch } from 'react-icons/fi';
import { getQuestionBank } from '../../../api/questionBankService';
import { toast } from 'react-toastify';
import Pagination from '../../../components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function QuestionBankPickerModal({ lessonId = null, onClose, onAdd }) {
  const [selected, setSelected]   = useState(new Map());
  const [page, setPage]           = useState(1);
  const [query, setQuery]         = useState('');
  const debounceRef               = useRef();
  // Gộp kết quả và tham số đã tải vào một state: `loading` suy ra được bằng cách
  // so khóa, khỏi phải setLoading(true) đồng bộ ngay đầu effect.
  const [result, setResult]       = useState({ key: null, items: [], pages: 1 });

  const requestKey = `${page}|${query}|${lessonId ?? ''}`;
  const loading    = result.key !== requestKey;
  const questions  = result.items;
  const pages      = result.pages;

  useEffect(() => {
    let cancelled = false;
    getQuestionBank(page, 10, query, lessonId)
      .then(data => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          items: Array.isArray(data?.items) ? data.items : [],
          pages: data?.pages ?? 1,
        });
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Không tải được từ ngân hàng câu hỏi');
        setResult({ key: requestKey, items: [], pages: 1 });
      });
    return () => { cancelled = true; };
  }, [page, query, lessonId, requestKey]);

  function handleQueryChange(e) {
    const val = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQuery(val);
    }, 400);
  }

  function toggle(q) {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(q.id)) next.delete(q.id); else next.set(q.id, q);
      return next;
    });
  }

  function handleAdd() {
    const picked = [...selected.values()];
    const mapped = picked.map(q => ({
      questionId: null,
      content: q.content,
      explanation: q.explanation || '',
      answers: (q.answers || []).map(a => ({
        answerId: null,
        content: a.content,
        correct: a.isCorrect === 1 || a.isCorrect === true,
      })),
    }));
    onAdd(mapped);
    onClose();
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0 space-y-3">
          <DialogTitle>Chọn từ ngân hàng câu hỏi</DialogTitle>
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 w-full text-sm" placeholder="Tìm câu hỏi..." defaultValue="" onChange={handleQueryChange} />
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-indigo-600">Đã chọn {selected.size} câu</p>
          )}
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <FiLoader size={20} className="animate-spin text-slate-300" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">
              {query ? 'Không tìm thấy câu hỏi nào.' : 'Ngân hàng câu hỏi trống.'}
            </p>
          ) : (
            <div className="space-y-2">
              {questions.map(q => (
                // Radix Checkbox là <button> nên <label> bọc ngoài không còn chuyển
                // click vào nó nữa. Cho cả dòng bắt click, và bỏ qua khi click rơi
                // đúng vào Checkbox để không toggle hai lần.
                <div key={q.id}
                  onClick={e => {
                    if (e.target.closest('[data-slot="checkbox"]')) return;
                    toggle(q);
                  }}
                  className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ' +
                    (selected.has(q.id)
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}>
                  <Checkbox
                    checked={selected.has(q.id)}
                    onCheckedChange={() => toggle(q)}
                    aria-label={`Chọn câu hỏi: ${q.content}`}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-relaxed line-clamp-2">{q.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{q.answers?.length ?? 0} đáp án</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && <Pagination page={page} pages={pages} onChange={p => setPage(p)} />}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="gradient" className="flex-1" disabled={selected.size === 0} onClick={handleAdd}>
            Thêm {selected.size > 0 ? selected.size + ' câu' : ''} đã chọn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
