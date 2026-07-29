import { useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiUsers, FiFileText, FiBell } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ClassHeader({ detail, assignedExams, announcements, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(detail.className);

  const initial = detail.className.trim().charAt(0).toUpperCase();

  async function handleSave() {
    try {
      await onUpdate(name);
      setEditing(false);
    } catch {
      // parent shows error toast; keep editing open
    }
  }

  function handleCancel() {
    setName(detail.className);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 p-6 mb-6 text-white overflow-hidden relative">
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 right-16 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <Avatar className="size-14 rounded-2xl bg-white/20">
          <AvatarFallback className="rounded-2xl bg-transparent text-white text-2xl font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-white placeholder-white/60 text-lg font-semibold focus:outline-hidden focus:border-white w-64" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }} autoFocus />
              <Button variant="ghost" size="icon-sm" title="Lưu tên lớp"
                className="bg-white/20 text-white hover:bg-white/30 hover:text-white" onClick={handleSave}>
                <FiCheck size={16} />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Hủy"
                className="bg-white/20 text-white hover:bg-white/30 hover:text-white" onClick={handleCancel}>
                <FiX size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold leading-tight truncate">{detail.className}</h1>
              <Button variant="ghost" size="icon-sm" title="Đổi tên lớp"
                className="shrink-0 bg-white/20 text-white hover:bg-white/30 hover:text-white"
                onClick={() => { setName(detail.className); setEditing(true); }}>
                <FiEdit2 size={14} />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-indigo-200 text-sm">
            <span className="flex items-center gap-1.5"><FiUsers size={13} /> {detail.totalStudents} học sinh</span>
            <span className="flex items-center gap-1.5"><FiFileText size={13} /> {assignedExams.length} bài tập</span>
            <span className="flex items-center gap-1.5"><FiBell size={13} /> {announcements.length} thông báo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
