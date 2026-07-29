import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const RELATIONSHIPS = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị', 'Chú', 'Bác', 'Cô', 'Dì', 'Người giám hộ'];

export default function RelativeFormModal({ initial, onClose, onSubmit, loading }) {
  const [name, setName]             = useState(initial?.name || '');
  const [phone, setPhone]           = useState(initial?.phone || '');
  const [email, setEmail]           = useState(initial?.email || '');
  const [relationship, setRelationship] = useState(initial?.relationship || '');

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Sửa người thân' : 'Thêm người thân'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input placeholder="0912345678" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email <span className="text-slate-400 font-normal text-xs">(tuỳ chọn — nhận thông báo lớp)</span>
            </Label>
            <Input type="email" placeholder="email@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Quan hệ</Label>
            <Select value={relationship || undefined} onValueChange={setRelationship}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn quan hệ --" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="gradient" className="flex-1" disabled={loading} onClick={() => onSubmit({ name, phone, email: email.trim() || null, relationship })}>
            {loading ? 'Đang lưu...' : (initial ? 'Cập nhật' : 'Thêm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
