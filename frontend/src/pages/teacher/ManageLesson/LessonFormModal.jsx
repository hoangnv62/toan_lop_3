import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function LessonFormModal({ title, initialValue = '', onClose, onSubmit, loading }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef();

  // Radix tự focus phần tử đầu tiên khi mở; chặn lại để focus ô nhập và bôi đen
  // sẵn giá trị cũ khi đang sửa tên bài học.
  function handleOpenAutoFocus(e) {
    e.preventDefault();
    inputRef.current?.focus();
    if (initialValue) inputRef.current?.select();
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm" onOpenAutoFocus={handleOpenAutoFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-1.5">Tên bài học</Label>
          {/* Escape đã do Dialog xử lý, chỉ cần bắt Enter để submit nhanh */}
          <Input
            ref={inputRef}
            placeholder="VD: Phép cộng trong phạm vi 100"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSubmit(value); }}
          />
        </div>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="gradient" className="flex-1" onClick={() => onSubmit(value)} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
