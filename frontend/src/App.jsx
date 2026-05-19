import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/teacher/Dashboard';
import ManageClass from './pages/teacher/ManageClass';
import ClassDetail from './pages/teacher/ClassDetail';
import ManageLesson from './pages/teacher/ManageLesson';
import LessonDetail from './pages/teacher/LessonDetail';
import StudentHome from './pages/student/StudentHome';
import StudentExam from './pages/student/StudentExam';
import ExamResult from './pages/student/ExamResult';

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Đang tải...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={
          <RequireAuth role="teacher"><Dashboard /></RequireAuth>
        } />
        <Route path="/manage-class" element={
          <RequireAuth role="teacher"><ManageClass /></RequireAuth>
        } />
        <Route path="/class-detail/:classId" element={
          <RequireAuth role="teacher"><ClassDetail /></RequireAuth>
        } />
        <Route path="/manage-lesson" element={
          <RequireAuth role="teacher"><ManageLesson /></RequireAuth>
        } />
        <Route path="/lesson-detail/:lessonId" element={
          <RequireAuth role="teacher"><LessonDetail /></RequireAuth>
        } />

        <Route path="/student" element={
          <RequireAuth role="student"><StudentHome /></RequireAuth>
        } />
        <Route path="/student/exam/:examId" element={
          <RequireAuth role="student"><StudentExam /></RequireAuth>
        } />
        <Route path="/exam-result/:examId" element={
          <RequireAuth role="student"><ExamResult /></RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
