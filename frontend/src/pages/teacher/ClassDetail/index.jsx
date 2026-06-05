import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../../components/TeacherLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { getClassDetail, updateClass, getClassExams, unassignExam, exportStudents } from '../../../api/classService';
import { exportExam } from '../../../api/examService';
import { getAnnouncements } from '../../../api/announcementService';
import { getRelatives } from '../../../api/relativeService';
import { toast } from 'react-toastify';
import { FiLoader } from 'react-icons/fi';
import StudentResultsModal from './StudentResultsModal';
import RelativesModal from './RelativesModal';
import ClassHeader from './ClassHeader';
import ExamList from './ExamList';
import StudentRoster from './StudentRoster';
import AddStudentCard from './AddStudentCard';
import ImportCard from './ImportCard';
import AnnouncementsCard from './AnnouncementsCard';

export default function ClassDetail() {
  const { classId } = useParams();
  const [detail, setDetail]               = useState(null);
  const [assignedExams, setAssignedExams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [studentPage, setStudentPage]     = useState(1);
  const [studentPages, setStudentPages]   = useState(1);
  const [exportingId, setExportingId]     = useState(null);
  const [exportingStudents, setExportingStudents] = useState(false);
  const [relModal, setRelModal]           = useState(null);
  const [relList, setRelList]             = useState([]);
  const [relLoading, setRelLoading]       = useState(false);
  const [studentModal, setStudentModal]   = useState(null);

  useEffect(() => { load(); }, [classId, studentPage]);

  async function load() {
    try {
      const [data, exams, ann] = await Promise.all([
        getClassDetail(classId, studentPage),
        getClassExams(classId),
        getAnnouncements(classId).catch(() => []),
      ]);
      setDetail(data);
      setStudentPages(data.studentPages ?? 1);
      setAssignedExams(exams);
      setAnnouncements(Array.isArray(ann) ? ann : []);
    } catch (err) {
      toast.error(err.message || 'Không tải được thông tin lớp');
    }
  }

  async function handleUpdate(name) {
    if (!name.trim()) { toast.error('Tên lớp không được trống'); throw new Error(); }
    try {
      await updateClass(classId, name);
      toast.success('Cập nhật tên thành công');
      load();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
      throw err;
    }
  }

  async function handleExport(examId, examName) {
    setExportingId(examId);
    try {
      await exportExam(examId, `${examName}.xlsx`);
    } catch (err) {
      toast.error(err.message || 'Xuất file thất bại');
    } finally { setExportingId(null); }
  }

  async function handleUnassign(examId) {
    try {
      await unassignExam(classId, examId);
      toast.success('Đã thu hồi bài tập');
      load();
    } catch (err) {
      toast.error(err.message || 'Thu hồi thất bại');
    }
  }

  async function handleExportStudents() {
    setExportingStudents(true);
    try {
      await exportStudents(classId, detail.className);
    } catch (err) {
      toast.error(err.message || 'Xuất file thất bại');
    } finally { setExportingStudents(false); }
  }

  async function handleViewRelatives(student) {
    setRelModal({ student });
    setRelLoading(true);
    try {
      setRelList(await getRelatives(student.id));
    } catch {
      setRelList([]);
    } finally {
      setRelLoading(false);
    }
  }

  if (!detail) return (
    <TeacherLayout>
      <div className="flex items-center justify-center h-64">
        <FiLoader size={24} className="animate-spin text-indigo-400" />
      </div>
    </TeacherLayout>
  );

  return (
    <TeacherLayout>
      <ErrorBoundary>
        {relModal && (
          <RelativesModal
            student={relModal.student}
            relatives={relList}
            loading={relLoading}
            onClose={() => { setRelModal(null); setRelList([]); }}
          />
        )}
        {studentModal && (
          <StudentResultsModal
            student={studentModal.student}
            onClose={() => setStudentModal(null)}
          />
        )}

        <ClassHeader
          detail={detail}
          assignedExams={assignedExams}
          announcements={announcements}
          onUpdate={handleUpdate}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          <div className="xl:col-span-2 space-y-5">
            <ExamList
              exams={assignedExams}
              exportingId={exportingId}
              onExport={handleExport}
              onUnassign={handleUnassign}
            />
            <StudentRoster
              classId={classId}
              students={detail.students}
              totalStudents={detail.totalStudents}
              classAvg={detail.classAvg}
              page={studentPage}
              pages={studentPages}
              exportingStudents={exportingStudents}
              onExportStudents={handleExportStudents}
              onPageChange={setStudentPage}
              onViewExams={s => setStudentModal({ student: s })}
              onViewRelatives={handleViewRelatives}
              onRemoved={load}
            />
          </div>
          <div className="space-y-5">
            <AddStudentCard classId={classId} onAssigned={load} />
            <ImportCard classId={classId} onUploaded={load} />
            <AnnouncementsCard classId={classId} announcements={announcements} onChanged={load} />
          </div>
        </div>
      </ErrorBoundary>
    </TeacherLayout>
  );
}
