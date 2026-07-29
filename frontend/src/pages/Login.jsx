import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiLoader } from 'react-icons/fi';
import { useAuthMutations } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthMutations();
  const navigate = useNavigate();

  async function handleLogin() {
    if (!username.trim() || !password) return toast.error('Vui lòng nhập đầy đủ thông tin');
    try {
      const data = await login(username.trim(), password);
      navigate(data.user?.role === 'teacher' ? '/dashboard' : '/student');
    } catch {
      // hook already showed the error toast
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric blobs */}
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand */}
      <div className="mb-8 text-center relative">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Toán Lớp 3</h1>
        <p className="text-sm text-slate-500 mt-1">Hệ thống E-Learning</p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-[400px] p-0 gap-0 rounded-2xl shadow-[0_8px_40px_-4px_rgba(79,70,229,0.18)] relative hover:translate-y-0">
        <div className="px-6 pt-6 pb-1">
          <h2 className="text-base font-bold text-slate-900">Đăng nhập</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên đăng nhập</Label>
            <Input placeholder="Nhập username..." value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</Label>
            <Input type="password" placeholder="Nhập mật khẩu..." value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <Button variant="gradient" className="w-full py-2.5" onClick={handleLogin} disabled={loading}>
            {loading
              ? <><FiLoader size={15} className="animate-spin" /> Đang đăng nhập...</>
              : 'Đăng nhập'}
          </Button>
        </div>
      </Card>

      <p className="mt-6 text-sm text-slate-500 relative">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-indigo-600 font-bold hover:text-violet-600 transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
