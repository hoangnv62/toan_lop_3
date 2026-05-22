import { useEffect, useRef, useState } from 'react';
import { FiX, FiLoader, FiSearch } from 'react-icons/fi';
import { getQuestionBank } from '../../../api/questionBankService';
import { toast } from 'react-toastify';
import Pagination from '../../../components/Pagination';

export default function QuestionBankPickerModal({ onClose, onAdd }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(new Map());
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [query, setQuery]         = useState('');
  const debounceRef               = useRef();

  useEffect(() => {
    setLoading(true);
    getQuestionBank(page, 10, query)
      .then(data => {
        setQuestions(Array.isArray(data?.items) ? data.items : []);
        setPages(data?.pages ?? 1);
      })
      .catch(() => toast.error('Không tải được từ ngân hàng câu hỏi'))
      .finally(() => setLoading(false));
  }, [page, query]);

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
        correct: a.is_correct === 1 || a.is_correct === true,
      })),
    }));
    onAdd(mapped);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Chọn từ ngân hàng câu hỏi</h3>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <FiX size={17} />
            </button>
          </div>
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-full text-sm"
              placeholder="Tìm câu hỏi..."
              defaultValue=""
              onChange={handleQueryChange}
            />
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-indigo-600">Đã chọn {selected.size} câu</p>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <FiLoader size={20} className="animate-spin text-gray-300" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">
              {query ? 'Không tìm thấy câu hỏi nào.' : 'Ngân hàng câu hỏi trống.'}
            </p>
          ) : (
            <div className="space-y-2">
              {questions.map(q => (
                <label key={q.id}
                  className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ' +
                    (selected.has(q.id)
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')}>
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggle(q)}
                    className="accent-indigo-600 mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{q.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{q.answers?.length ?? 0} đáp án</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {!loading && <Pagination page={page} pages={pages} onChange={p => setPage(p)} />}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button
            className="btn-primary flex-1"
            disabled={selected.size === 0}
            onClick={handleAdd}>
            Thêm {selected.size > 0 ? selected.size + ' câu' : ''} đã chọn
          </button>
        </div>
      </div>
    </div>
  );
}
