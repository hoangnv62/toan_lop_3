import { useEffect, useRef, useState } from 'react';
import { searchStudents, assignStudent } from '../../../api/classService';
import { toast } from 'react-toastify';
import { FiSearch, FiLoader, FiUserPlus } from 'react-icons/fi';

export default function AddStudentCard({ classId, onAssigned }) {
  const [query, setQuery]                 = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const debounceRef                       = useRef();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 1000);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function runSearch(q) {
    setSearching(true);
    try {
      const data = await searchStudents(q, classId);
      setSearchResults(data);
      if (data.length === 0) toast.info('Không tìm thấy học sinh nào');
    } catch (err) {
      toast.error(err.message || 'Lỗi tìm kiếm');
    } finally { setSearching(false); }
  }

  async function handleAssign(username, fullName) {
    try {
      await assignStudent(classId, username);
      toast.success(`Đã thêm ${fullName} vào lớp`);
      setSearchResults([]);
      setQuery('');
      onAssigned();
    } catch (err) {
      toast.error(err.message || 'Thêm thất bại');
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <FiUserPlus size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Thêm học sinh</h3>
      </div>
      <div className="relative">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9 pr-9 text-sm"
          placeholder="Nhập username..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {searching && (
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
                  ? <span className="badge-green text-xs">Đã trong lớp</span>
                  : s.currentClass
                    ? <span className="badge-yellow text-xs">{s.currentClass}</span>
                    : null}
              </div>
              {!s.alreadyInClass && !s.currentClass && (
                <button
                  className="btn-primary py-1 px-2.5 text-xs shrink-0"
                  onClick={() => handleAssign(s.username, s.fullName)}>
                  <FiUserPlus size={12} /> Thêm
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
