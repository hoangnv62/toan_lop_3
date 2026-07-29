import { useEffect, useState } from 'react';
import { FiLoader, FiUser, FiMail, FiPhone, FiCalendar, FiAtSign } from 'react-icons/fi';
import { getProfile } from '../../api/auth';
import { useAuth } from '../../context/auth-context';
import { toast } from 'react-toastify';
import { parseDateToInput } from '../../utils/date';
import { useAuthMutations } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
        <Icon size={13} className="text-slate-400" />
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const { updateProfile, loading } = useAuthMutations();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob]           = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getProfile()
      .then(res => {
        const d = res || {};
        setUsername(d.username || '');
        setFullName(d.fullName || '');
        setDob(parseDateToInput(d.dob));
        setEmail(d.email || '');
        setPhone(d.phone || '');
      })
      .catch(() => toast.error('Không tải được hồ sơ'))
      .finally(() => setFetching(false));
  }, []);

  async function handleSave() {
    if (!fullName.trim()) return toast.error('Họ và tên không được trống');
    await updateProfile(
      { fullName: fullName.trim(), dob, email, phone },
      () => {
        setUser({ ...user, name: fullName.trim() });
        onClose();
      },
    );
  }

  const initials = fullName.trim().split(' ').pop()?.charAt(0).toUpperCase() || '?';

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-100">
          <DialogTitle>Thông tin cá nhân</DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            {/* Avatar block */}
            <div className="flex flex-col items-center pt-6 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center
                              text-2xl font-extrabold text-white shadow-btn mb-2 select-none">
                {initials}
              </div>
              <p className="text-xs font-mono font-semibold text-slate-600">
                @{username || '—'}
              </p>
              <span className="mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60">
                {user?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>

            {/* Form */}
            <div className="px-6 pb-2 space-y-3.5">
              <Field label="Tên đăng nhập" icon={FiAtSign}>
                <Input className="bg-slate-50 text-slate-500 cursor-not-allowed font-mono" value={username} readOnly />
              </Field>

              <Field label="Họ và tên" icon={FiUser}>
                <Input placeholder="Nguyễn Văn A" value={fullName} onChange={e => setFullName(e.target.value)} autoFocus />
              </Field>

              <Field label="Ngày sinh" icon={FiCalendar}>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </Field>

              {user?.role === 'teacher' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email" icon={FiMail}>
                    <Input type="email" placeholder="vd@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Số điện thoại" icon={FiPhone}>
                    <Input placeholder="09xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {/* Actions */}
            <DialogFooter className="gap-3 px-6 py-4 border-t border-slate-100 mt-2 sm:justify-stretch">
              <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} disabled={loading}>
                {loading
                  ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</>
                  : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
