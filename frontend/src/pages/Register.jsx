import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthMutations } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function Field({ label, required, children }) {
  return (
    <div>
      <Label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function Register() {
  const [role, setRole] = useState('student');
  const [tUsername, setTUsername] = useState('');
  const [tFullName, setTFullName] = useState('');
  const [tPass, setTPass]         = useState('');
  const [tConfirm, setTConfirm]   = useState('');
  const [sUsername, setSUsername] = useState('');
  const [sFullName, setSFullName] = useState('');
  const [sDob, setSdob]           = useState('');
  const [sPass, setSPass]         = useState('');
  const [sConfirm, setSConfirm]   = useState('');
  const { register, loading } = useAuthMutations();
  const navigate = useNavigate();

  async function handleTeacherRegister() {
    if (!tUsername || !tFullName || !tPass || !tConfirm)
      return toast.error('Vui lòng điền đầy đủ thông tin!');
    if (tPass !== tConfirm)
      return toast.error('Mật khẩu xác nhận không khớp!');
    await register(
      { username: tUsername, password: tPass, fullName: tFullName },
      'teacher',
      () => navigate('/dashboard'),
    );
  }

  async function handleStudentRegister() {
    if (!sUsername || !sFullName || !sPass || !sConfirm)
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
    if (sPass !== sConfirm)
      return toast.error('Mật khẩu xác nhận không khớp!');
    await register(
      { username: sUsername, password: sPass, fullName: sFullName, dob: sDob },
      'student',
      () => navigate('/student'),
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric blobs */}
      <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Brand */}
      <div className="mb-8 text-center relative">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mb-4 shadow-[0_8px_30px_rgba(79,70,229,0.4)]">
          <span className="text-white font-extrabold text-2xl leading-none">3</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tạo tài khoản</h1>
        <p className="text-sm text-slate-500 mt-1">Toán Lớp 3 – E-Learning</p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-[420px] p-0 gap-0 rounded-2xl shadow-[0_8px_40px_-4px_rgba(79,70,229,0.18)] overflow-hidden relative hover:translate-y-0">
        {/* Chọn vai trò */}
        <Tabs value={role} onValueChange={setRole}>
          <TabsList className="w-full rounded-none border-b border-slate-100 bg-slate-50/60 p-0 h-auto">
            {[
              { value: 'student', label: 'Học Sinh' },
              { value: 'teacher', label: 'Giáo Viên' },
            ].map(({ value, label }) => (
              <TabsTrigger key={value} value={value}
                className="flex-1 rounded-none border-0 border-b-2 border-transparent py-3.5 text-sm font-semibold text-slate-500 shadow-none data-[state=active]:border-indigo-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="p-6 space-y-3.5">
          {role === 'teacher' ? (
            <>
              <Field label="Họ và tên" required>
                <Input placeholder="Nguyễn Thị Lan" value={tFullName} onChange={e => setTFullName(e.target.value)} />
              </Field>
              <Field label="Tên đăng nhập" required>
                <Input placeholder="username" value={tUsername} onChange={e => setTUsername(e.target.value)} />
              </Field>
              <Field label="Mật khẩu" required>
                <Input type="password" placeholder="Mật khẩu" value={tPass} onChange={e => setTPass(e.target.value)} />
              </Field>
              <Field label="Xác nhận mật khẩu" required>
                <Input type="password" placeholder="Nhập lại mật khẩu" value={tConfirm} onChange={e => setTConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTeacherRegister()} />
              </Field>
              <Button variant="gradient" className="w-full py-2.5 mt-1" onClick={handleTeacherRegister} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản giáo viên'}
              </Button>
            </>
          ) : (
            <>
              <Field label="Tên đăng nhập" required>
                <Input placeholder="username học sinh" value={sUsername} onChange={e => setSUsername(e.target.value)} />
              </Field>
              <Field label="Họ và tên học sinh" required>
                <Input placeholder="Nguyễn Văn An" value={sFullName} onChange={e => setSFullName(e.target.value)} />
              </Field>
              <Field label="Ngày sinh">
                <Input type="date" value={sDob} onChange={e => setSdob(e.target.value)} />
              </Field>
              <Field label="Mật khẩu" required>
                <Input type="password" placeholder="Mật khẩu" value={sPass} onChange={e => setSPass(e.target.value)} />
              </Field>
              <Field label="Xác nhận mật khẩu" required>
                <Input type="password" placeholder="Nhập lại mật khẩu" value={sConfirm} onChange={e => setSConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStudentRegister()} />
              </Field>
              <Button variant="gradient" className="w-full py-2.5 mt-1" onClick={handleStudentRegister} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản học sinh'}
              </Button>
            </>
          )}
        </div>
      </Card>

      <p className="mt-6 text-sm text-slate-500 relative">
        Đã có tài khoản?{' '}
        <Link to="/" className="text-indigo-600 font-bold hover:text-violet-600 transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
