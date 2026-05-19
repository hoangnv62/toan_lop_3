import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkPhone, loginStudent, loginTeacher } from '../api/auth';
import { toast } from 'react-toastify';

export default function Login() {
  const [tab, setTab] = useState('student');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState('');
  const [tUser, setTUser] = useState('');
  const [tPass, setTPass] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleCheckPhone() {
    if (!phone) return toast.error('Vui lòng nhập số điện thoại!');
    try {
      const data = await checkPhone(phone);
      if (data.exists) {
        setStudentName(data.name);
        setStep(2);
      } else {
        toast.error('Số điện thoại chưa được đăng ký!');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi kiểm tra số điện thoại');
    }
  }

  async function handleStudentLogin() {
    if (!password) return toast.error('Vui lòng nhập mật khẩu!');
    try {
      const data = await loginStudent(phone, password);
      setUser(data.user || { role: 'student' });
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    }
  }

  async function handleTeacherLogin() {
    if (!tUser || !tPass) return toast.error('Vui lòng nhập đầy đủ!');
    try {
      const data = await loginTeacher(tUser, tPass);
      setUser(data.user || { role: 'teacher' });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Sai tài khoản hoặc mật khẩu');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📚</div>
          <h2 className="text-2xl font-bold text-gray-800">Hệ Thống E-Learning</h2>
          <p className="text-gray-500 text-sm mt-1">Toán Lớp 3</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          {['student', 'teacher'].map(t => (
            <button key={t} onClick={() => { setTab(t); setStep(1); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}>
              {t === 'student' ? '👦 Học Sinh' : '👩‍🏫 Giáo Viên'}
            </button>
          ))}
        </div>

        {tab === 'student' ? (
          <div className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại phụ huynh</label>
                  <input className="input" placeholder="Nhập SĐT..." value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheckPhone()} />
                </div>
                <button className="btn-primary w-full" onClick={handleCheckPhone}>
                  Kiểm tra &amp; Tiếp tục →
                </button>
              </>
            ) : (
              <>
                <div className="bg-indigo-50 text-indigo-700 rounded-lg px-4 py-2 text-sm font-medium">
                  👋 Chào {studentName}!
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                  <input className="input" type="password" placeholder="Nhập mật khẩu..."
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStudentLogin()} />
                </div>
                <button className="btn-primary w-full" onClick={handleStudentLogin}>
                  Vào Lớp Học 🚀
                </button>
                <button className="text-sm text-gray-400 underline w-full text-center"
                  onClick={() => { setStep(1); setPassword(''); }}>
                  Quay lại nhập SĐT
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input className="input" placeholder="Username" value={tUser}
                onChange={e => setTUser(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input className="input" type="password" placeholder="Password" value={tPass}
                onChange={e => setTPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} />
            </div>
            <button className="btn-primary w-full" onClick={handleTeacherLogin}>
              Đăng Nhập Giáo Viên
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
