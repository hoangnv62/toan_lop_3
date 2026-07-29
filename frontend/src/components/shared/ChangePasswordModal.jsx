import { useState } from 'react';
import { FiLoader, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuthMutations } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ChangePasswordModal({ onClose }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const { changePassword, loading } = useAuthMutations();

  async function handleSave() {
    if (!currentPw || !newPw || !confirmPw) return toast.error('Vui lòng điền đầy đủ thông tin');
    if (newPw !== confirmPw) return toast.error('Mật khẩu mới không khớp');
    if (newPw.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    await changePassword(currentPw, newPw, onClose);
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-btn shrink-0">
              <FiLock size={15} className="text-white" />
            </div>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3.5">
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu hiện tại</Label>
            <Input type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoFocus />
          </div>
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới</Label>
            <Input type="password" placeholder="Ít nhất 6 ký tự" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</Label>
            <Input type="password" placeholder="Nhập lại mật khẩu mới" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
        </div>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button variant="gradient" className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</> : 'Đổi mật khẩu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
