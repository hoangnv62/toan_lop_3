import Sidebar from '../components/Sidebar';
import ChatBot from '../components/shared/ChatBot';

export default function TeacherLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-auto">
        {children}
      </main>
      <ChatBot />
    </div>
  );
}
