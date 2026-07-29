import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiLoader, FiUserPlus } from 'react-icons/fi';
import { useClassStudentMutations } from '../../../hooks/useClass';
import { useDebounce } from '../../../hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Giáo viên gõ username tay nên chờ lâu hơn mặc định 400ms của useDebounce
const SEARCH_DEBOUNCE_MS = 1000;

export default function AddStudentCard({ classId, onAssigned }) {
  const [query, setQuery]                 = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { search, assign, loading } = useClassStudentMutations();
  const debouncedQuery = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!debouncedQuery) return;

    // Bỏ qua kết quả của lần tìm trước nếu người dùng đã gõ tiếp
    let cancelled = false;
    (async () => {
      const data = await search(debouncedQuery, classId);
      if (cancelled || !data) return;
      setSearchResults(data);
      if (data.length === 0) toast.info('Không tìm thấy học sinh nào');
    })();

    return () => { cancelled = true; };
    // `search` được tạo lại mỗi lần render nên không đưa vào deps
  }, [debouncedQuery, classId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleQueryChange(value) {
    setQuery(value);
    // Xóa kết quả cũ ngay khi gõ để danh sách không lệch với ô tìm kiếm
    setSearchResults([]);
  }

  async function handleAssign(username) {
    // The hook's assign already shows a success toast; use callback for side-effects
    await assign(classId, username, () => {
      setSearchResults([]);
      setQuery('');
      onAssigned();
    });
  }

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center gap-2 mb-3">
        <FiUserPlus size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Thêm học sinh</h3>
      </div>
      <div className="relative">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9 pr-9 text-sm" placeholder="Nhập username..." value={query} onChange={e => handleQueryChange(e.target.value)} />
        {loading && (
          <FiLoader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {searchResults.map(s => (
            <div key={s.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.fullName}</p>
                <p className="text-xs text-indigo-600 font-mono">{s.username}</p>
                {s.alreadyInClass
                  ? <Badge variant="success" className="text-xs">Đã trong lớp</Badge>
                  : s.currentClass
                    ? <Badge variant="warning" className="text-xs">{s.currentClass}</Badge>
                    : null}
              </div>
              {!s.alreadyInClass && !s.currentClass && (
                <Button variant="gradient" className="py-1 px-2.5 text-xs shrink-0" onClick={() => handleAssign(s.username)}>
                  <FiUserPlus size={12} /> Thêm
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
