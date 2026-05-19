import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerTeacher, registerStudent } from '../api/auth';
import { toast } from 'react-toastify';

export default function Register() {
  const [role, setRole] = useState('student');
  // Teacher fields
  const [tUsername, setTUsername]   = useState('');
  const [tFullName, setTFullName]   = useState('');
  const [tPass, setTPass]           = useState('');
  const [tConfirm, setTConfirm]     = useState('');
  // Student fields
  const [sUsername, setSUsername]   = useState('');
  const [sFullName, setSFullName]   = useState('');
  const [sDob, setSdob]             = useState('');
  const [sParentName, setSParentName]   = useState('');
  const [sParentPhone, setSParentPhone] = useState('');
  const [sPass, setSPass]           = useState('');
  const [sConfirm, setSConfirm]     = useState('');
  const [loading, setLoading]       = useState(false);

  const { setUser } = useAuth();
  const navigate    = useNavigate();

  async function handleTeacherRegister() {
    if (!tUsername || !tFullName || !tPass || !tConfirm)
      return toast.error('Vui lòng điền đầy đủ thông tin!');
    if (tPass !== tConfirm)
      return toast.error('Mật khẩu xác nhận không khớp!');
    setLoading(true);
    try {
      const data = await registerTeacher(tUsername, tPass, tFullName);
      setUser(data.user || { role: 'teacher' });
      toast.success('Đăng ký thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentRegister() {
    if (!sUsername || !sFullName || !sPass || !sConfirm)
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
    if (sPass !== sConfirm)
      return toast.error('Mật khẩu xác nhận không khớp!');
    setLoading(true);
    try {
      const data = await registerStudent({
        username:    sUsername,
        password:    sPass,
        fullName:    sFullName,
        dob:         sDob,
        parentName:  sParentName,
        parentPhone: sParentPhone,
      });
      setUser(data.user || { role: 'student' });
      toast.success('Đăng ký thành công!');
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📝</div>
          <h2 className="text-2xl font-bold text-gray-800">Đăng Ký Tài Khoản</h2>
          <p className="text-gray-500 text-sm mt-1">Toán Lớp 3</p>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { value: 'student', label: '👦 Học Sinh' },
            { value: 'teacher', label: '👩‍🏫 Giáo Viên' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => setRole(value)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                role === value ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {role === 'teacher' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
              <input className="input" placeholder="Nguyễn Thị Lan" value={tFullName} onChange={e => setTFullName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
              <input className="input" placeholder="username" value={tUsername} onChange={e => setTUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
              <input className="input" type="password" placeholder="Mật khẩu" value={tPass} onChange={e => setTPass(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
              <input className="input" type="password" placeholder="Nhập lại mật khẩu" value={tConfirm}
                onChange={e => setTConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTeacherRegister()} />
            </div>
            <button className="btn-primary w-full mt-1" onClick={handleTeacherRegister} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Ký Giáo Viên'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
              <input className="input" placeholder="username học sinh" value={sUsername} onChange={e => setSUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên học sinh <span className="text-red-500">*</span></label>
              <input className="input" placeholder="Nguyễn Văn An" value={sFullName} onChange={e => setSFullName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input className="input" type="date" value={sDob} onChange={e => setSdob(e.target.value)} />
            </div>
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">Thông tin phụ huynh (không bắt buộc)</p>
              <div className="space-y-3">
                <input className="input" placeholder="Họ tên phụ huynh" value={sParentName} onChange={e => setSParentName(e.target.value)} />
                <input className="input" placeholder="Số điện thoại phụ huynh" value={sParentPhone} onChange={e => setSParentPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
              <input className="input" type="password" placeholder="Mật khẩu" value={sPass} onChange={e => setSPass(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
              <input className="input" type="password" placeholder="Nhập lại mật khẩu" value={sConfirm}
                onChange={e => setSConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStudentRegister()} />
            </div>
            <button className="btn-primary w-full mt-1" onClick={handleStudentRegister} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Ký Học Sinh'}
            </button>
          </div>
        )}

        <div className="mt-5 text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <Link to="/" className="text-indigo-600 font-semibold hover:underline">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
