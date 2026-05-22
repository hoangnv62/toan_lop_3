from sqlalchemy import text
from extensions import db
from models.class_ import Class, ClassExam, Announcement


class ClassRepository:
    def find_by_id(self, class_id: int) -> Class | None:
        return db.session.get(Class, class_id)

    def find_by_id_and_teacher(self, class_id: int, teacher_id: int) -> Class | None:
        return db.session.execute(
            db.select(Class).where(Class.id == class_id, Class.teacher_id == teacher_id)
        ).scalar_one_or_none()

    def find_by_teacher_with_stats(self, teacher_id: int, page: int = 1, limit: int = 12) -> dict:
        offset = (page - 1) * limit
        total = db.session.execute(
            text("SELECT COUNT(*) FROM classes WHERE teacher_id=:tid"), {"tid": teacher_id}
        ).scalar() or 0
        sql = text("""
            SELECT c.id AS classId, c.class_name AS className,
                COUNT(DISTINCT u.id) AS totalStudents,
                COUNT(sa.id)         AS totalAnswers,
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correctAnswers
            FROM classes c
            LEFT JOIN users u  ON u.class_id=c.id AND u.role='student'
            LEFT JOIN student_answers sa ON sa.student_id=u.id
            LEFT JOIN answers a ON a.id=sa.answer_id
            WHERE c.teacher_id=:tid
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        rows = db.session.execute(sql, {"tid": teacher_id, "limit": limit, "offset": offset}).mappings().all()
        return {
            "items": [dict(r) for r in rows],
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        }

    def get_students_with_avg(self, class_id: int, page: int = 1, limit: int = 15) -> dict:
        offset = (page - 1) * limit
        total = db.session.execute(
            text("SELECT COUNT(*) FROM users WHERE class_id=:cid AND role='student'"), {"cid": class_id}
        ).scalar() or 0
        sql = text("""
            SELECT u.id, u.username, u.full_name, u.dob,
                ROUND(AVG(exam_score), 2) AS avg_score
            FROM users u
            LEFT JOIN (
                SELECT sa.student_id, sa.exam_id,
                    SUM(a.is_correct) / NULLIF(COUNT(sa.id),0) * 10 AS exam_score
                FROM student_answers sa
                JOIN answers a ON a.id=sa.answer_id
                GROUP BY sa.student_id, sa.exam_id
            ) t ON t.student_id=u.id
            WHERE u.class_id=:cid AND u.role='student'
            GROUP BY u.id
            LIMIT :limit OFFSET :offset
        """)
        rows = db.session.execute(sql, {"cid": class_id, "limit": limit, "offset": offset}).mappings().all()
        return {
            "items": [dict(r) for r in rows],
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        }

    def get_students_with_scores(self, class_id: int) -> list[dict]:
        sql = text("""
            SELECT u.id, u.full_name AS name,
                ROUND(
                    SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) * 10.0
                    / NULLIF(COUNT(DISTINCT q.id), 0)
                , 2) AS avg_score
            FROM users u
            LEFT JOIN student_answers sa ON sa.student_id=u.id
            LEFT JOIN answers a ON sa.answer_id=a.id
            LEFT JOIN questions q ON a.question_id=q.id
            WHERE u.class_id=:cid AND u.role='student'
            GROUP BY u.id ORDER BY u.full_name
        """)
        rows = db.session.execute(sql, {"cid": class_id}).mappings().all()
        return [dict(r) for r in rows]

    def get_students_for_export(self, class_id: int) -> list[dict]:
        sql = text("""
            SELECT u.username, u.full_name, u.dob,
                ROUND(AVG(CASE WHEN a.is_correct=1 THEN 10.0 ELSE 0 END), 2) AS avg_score,
                COUNT(DISTINCT sa.exam_id) AS total_exams
            FROM users u
            LEFT JOIN student_answers sa ON sa.student_id=u.id
            LEFT JOIN answers a ON sa.answer_id=a.id
            WHERE u.class_id=:cid AND u.role='student'
            GROUP BY u.id ORDER BY u.full_name
        """)
        rows = db.session.execute(sql, {"cid": class_id}).mappings().all()
        return [dict(r) for r in rows]

    def create(self, teacher_id: int, class_name: str) -> Class:
        cls = Class(teacher_id=teacher_id, class_name=class_name)
        db.session.add(cls)
        db.session.flush()
        return cls

    def update(self, cls: Class, class_name: str) -> None:
        cls.class_name = class_name

    def delete(self, cls: Class) -> None:
        from models.user import User as UserModel
        db.session.execute(
            db.update(UserModel)
            .where(UserModel.class_id == cls.id, UserModel.role == "student")
            .values(class_id=None)
        )
        db.session.delete(cls)


class ClassExamRepository:
    def find_by_class_and_exam(self, class_id: int, exam_id: int) -> ClassExam | None:
        return db.session.execute(
            db.select(ClassExam).where(ClassExam.class_id == class_id, ClassExam.exam_id == exam_id)
        ).scalar_one_or_none()

    def find_by_class_with_stats(self, class_id: int) -> list[dict]:
        sql = text("""
            SELECT ce.exam_id, e.name AS exam_name, l.title AS lesson_name,
                ce.deadline, ce.assigned_at, ce.open_time, ce.time_limit,
                COUNT(DISTINCT sa.student_id) AS completed_count,
                (SELECT COUNT(*) FROM users WHERE class_id=:cid AND role='student') AS total_students
            FROM class_exams ce
            JOIN exams e ON ce.exam_id=e.id
            JOIN lessons l ON e.lesson_id=l.id
            LEFT JOIN student_answers sa
                ON sa.exam_id=ce.exam_id
                AND sa.student_id IN (SELECT id FROM users WHERE class_id=:cid AND role='student')
            WHERE ce.class_id=:cid
            GROUP BY ce.exam_id, e.name, l.title, ce.deadline, ce.assigned_at, ce.open_time, ce.time_limit
            ORDER BY ce.assigned_at DESC
        """)
        rows = db.session.execute(sql, {"cid": class_id}).mappings().all()
        return [dict(r) for r in rows]

    def find_by_exam_and_teacher(self, exam_id: int, teacher_id: int) -> list[dict]:
        sql = text("""
            SELECT c.id AS class_id, c.class_name,
                (ce.exam_id IS NOT NULL) AS assigned,
                ce.deadline, ce.assigned_at, ce.open_time, ce.time_limit
            FROM classes c
            LEFT JOIN class_exams ce ON ce.class_id=c.id AND ce.exam_id=:eid
            WHERE c.teacher_id=:tid
            ORDER BY c.class_name
        """)
        rows = db.session.execute(sql, {"eid": exam_id, "tid": teacher_id}).mappings().all()
        return [dict(r) for r in rows]

    def find_for_student(self, student_id: int, exam_id: int) -> ClassExam | None:
        sql = text("""
            SELECT ce.time_limit FROM class_exams ce
            JOIN users u ON u.class_id = ce.class_id
            WHERE ce.exam_id = :eid AND u.id = :sid
        """)
        row = db.session.execute(sql, {"eid": exam_id, "sid": student_id}).mappings().first()
        return row

    def assign(self, class_id: int, exam_id: int, deadline, open_time, time_limit: int) -> ClassExam:
        ce = ClassExam(class_id=class_id, exam_id=exam_id, deadline=deadline, open_time=open_time, time_limit=time_limit)
        db.session.add(ce)
        db.session.flush()
        return ce

    def update(self, ce: ClassExam, deadline, open_time, time_limit: int) -> None:
        ce.deadline   = deadline
        ce.open_time  = open_time
        ce.time_limit = time_limit

    def unassign(self, ce: ClassExam) -> None:
        db.session.delete(ce)


class AnnouncementRepository:
    def find_by_class(self, class_id: int) -> list[Announcement]:
        return db.session.execute(
            db.select(Announcement)
            .where(Announcement.class_id == class_id)
            .order_by(Announcement.created_at.desc())
        ).scalars().all()

    def find_by_id_and_teacher(self, ann_id: int, teacher_id: int) -> Announcement | None:
        return db.session.execute(
            db.select(Announcement).where(Announcement.id == ann_id, Announcement.teacher_id == teacher_id)
        ).scalar_one_or_none()

    def create(self, class_id: int, teacher_id: int, title: str, content: str) -> Announcement:
        ann = Announcement(class_id=class_id, teacher_id=teacher_id, title=title, content=content)
        db.session.add(ann)
        db.session.flush()
        return ann

    def delete(self, ann: Announcement) -> None:
        db.session.delete(ann)
