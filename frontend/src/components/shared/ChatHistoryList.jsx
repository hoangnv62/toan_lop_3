import { useState } from 'react';
import { FiCheck, FiEdit2, FiMessageSquare, FiTrash2, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;
// Nút đổi tên / xóa chỉ hiện khi rê chuột hoặc focus vào dòng.
const ROW_ACTION = 'text-slate-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100';
const GROUPS = ['Hôm nay', 'Hôm qua', '7 ngày qua', 'Cũ hơn'];

const groupOf = (updatedAt, todayStart) => {
  const t = new Date(updatedAt).getTime();
  if (t >= todayStart) return GROUPS[0];
  if (t >= todayStart - DAY_MS) return GROUPS[1];
  if (t >= todayStart - 7 * DAY_MS) return GROUPS[2];
  return GROUPS[3];
};

const timeLabel = (updatedAt) => new Date(updatedAt).toLocaleString('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
});

// Danh sách hội thoại (mới hoạt động nhất lên đầu), nhóm Hôm nay / Hôm qua / 7 ngày qua / Cũ hơn.
// Đổi tên ngay tại chỗ; xóa thì ChatBot hỏi xác nhận bằng AlertDialog.
export default function ChatHistoryList({
  sessions, currentId, todayStart, disabled, onSelect, onRename, onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (s) => { setEditingId(s.id); setDraft(s.title); };
  const saveEdit = async () => {
    const title = draft.trim();
    if (title) await onRename(editingId, title);
    setEditingId(null);
  };

  if (!sessions.length) {
    return (
      <div className={'flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center '
        + 'text-sm text-slate-400'}>
        <FiMessageSquare size={20} />
        Chưa có cuộc trò chuyện nào.
      </div>
    );
  }

  const groups = GROUPS
    .map(label => ({
      label,
      items: sessions.filter(s => groupOf(s.updatedAt, todayStart) === label),
    }))
    .filter(g => g.items.length);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-3 p-2">
        {groups.map(g => (
          <div key={g.label}>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map(s => (
                <li key={s.id}
                    className={cn('group flex items-center gap-1 rounded-lg pr-1',
                      s.id === currentId ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
                  {editingId === s.id ? (
                    <div className="flex flex-1 items-center gap-1 p-1">
                      <Input autoFocus value={draft} maxLength={120} className="h-8 text-sm"
                             onChange={e => setDraft(e.target.value)}
                             onKeyDown={e => {
                               if (e.key === 'Enter') saveEdit();
                               if (e.key === 'Escape') setEditingId(null);
                             }}/>
                      <Button variant="ghost" size="icon-xs" title="Lưu tên" onClick={saveEdit}>
                        <FiCheck size={13}/>
                      </Button>
                      <Button variant="ghost" size="icon-xs" title="Hủy"
                              onClick={() => setEditingId(null)}>
                        <FiX size={13}/>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => onSelect(s.id)} disabled={disabled}
                              className={cn('h-auto min-w-0 flex-1 flex-col items-start gap-0',
                                'px-2 py-1.5 text-left',
                                'hover:bg-transparent', s.id === currentId && 'text-indigo-700')}>
                        <span className="w-full truncate text-sm font-medium">{s.title}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {timeLabel(s.updatedAt)} · {s.messageCount} tin
                        </span>
                      </Button>
                      <Button variant="ghost" size="icon-xs" title="Đổi tên"
                              className={ROW_ACTION}
                              onClick={() => startEdit(s)}>
                        <FiEdit2 size={12}/>
                      </Button>
                      <Button variant="ghost" size="icon-xs" title="Xóa cuộc trò chuyện"
                              className={cn(ROW_ACTION, 'hover:text-red-500')}
                              onClick={() => onDelete(s)}>
                        <FiTrash2 size={12}/>
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
