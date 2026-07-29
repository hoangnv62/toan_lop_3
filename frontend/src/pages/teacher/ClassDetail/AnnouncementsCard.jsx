import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiBell, FiTrash2, FiSave, FiLoader } from 'react-icons/fi';
import { useAnnouncementMutations } from '../../../hooks/useAnnouncement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function AnnouncementsCard({ classId, announcements, onChanged }) {
  const [annForm, setAnnForm]       = useState({ open: false, title: '', content: '' });
  const [confirmAnn, setConfirmAnn] = useState(null);
  const { create, remove, loading: annSaving } = useAnnouncementMutations(classId);

  async function handleCreate() {
    if (!annForm.title.trim()) return toast.error('Tiêu đề không được trống');
    if (!annForm.content.trim()) return toast.error('Nội dung không được trống');
    await create(
      { title: annForm.title.trim(), content: annForm.content.trim() },
      () => {
        setAnnForm({ open: false, title: '', content: '' });
        onChanged();
      },
    );
  }

  async function handleDelete() {
    const id = confirmAnn.id;
    setConfirmAnn(null);
    await remove(id, onChanged);
  }

  return (
    <>
      {confirmAnn && (
        <Dialog open onOpenChange={open => !open && setConfirmAnn(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa thông báo</DialogTitle>
              <DialogDescription>Bạn có chắc muốn xóa thông báo này?</DialogDescription>
            </DialogHeader>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
              {confirmAnn.title}
            </p>
            <DialogFooter className="sm:justify-stretch">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAnn(null)}>Hủy</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete}>Xóa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Card className="p-5 gap-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiBell size={15} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Thông báo</h3>
            {announcements.length > 0 && <Badge variant="info">{announcements.length}</Badge>}
          </div>
          <Button variant="ghost" className="py-1 px-2 text-xs text-indigo-600 hover:bg-indigo-50" onClick={() => setAnnForm(f => ({ ...f, open: !f.open }))}>
            <FiBell size={12} /> Thêm
          </Button>
        </div>

        {annForm.open && (
          <div className="mb-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
            <Input className="text-sm" placeholder="Tiêu đề..." value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea className="text-sm resize-none" rows={3} placeholder="Nội dung..." value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="text-xs py-1 px-2.5" onClick={() => setAnnForm({ open: false, title: '', content: '' })}>
                Hủy
              </Button>
              <Button variant="gradient" className="text-xs py-1 px-2.5 gap-1" onClick={handleCreate} disabled={annSaving}>
                {annSaving ? <FiLoader size={11} className="animate-spin" /> : <FiSave size={11} />}
                {annSaving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        )}

        {announcements.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Chưa có thông báo nào</p>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id}
                className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{a.title}</p>
                  <Button variant="ghost" className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all" onClick={() => setConfirmAnn(a)}>
                    <FiTrash2 size={13} />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{a.content}</p>
                <p className="text-xs text-slate-400 mt-1.5">
                  {a.createdAt}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
