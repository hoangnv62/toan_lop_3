import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiChevronUp, FiFileText, FiLoader } from 'react-icons/fi';
import { fetchExam } from '../../api/examService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Nút "Xem đề thi" dưới tin nhắn chatbot vừa tạo đề. Nội dung đề đi kèm ngay trong lượt chat
// (initialExam) nên bấm là hiện, không tốn thêm lượt gọi model; sau khi tải lại trang thì chỉ
// còn examId → bấm lần đầu mới gọi API lấy đề.
export default function ChatExamPreview({ examId, initialExam }) {
  const [exam, setExam] = useState(initialExam ?? null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  // Đề mở ra nằm khuất dưới khung chat — cuộn tới để giáo viên thấy ngay.
  useEffect(() => {
    if (open) boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [open]);

  async function handleToggle() {
    if (open) return setOpen(false);
    if (!exam) {
      setLoading(true);
      try {
        setExam(await fetchExam(examId));
      } catch (err) {
        toast.error(err?.message || 'Không tải được đề thi');
        return;
      } finally {
        setLoading(false);
      }
    }
    setOpen(true);
  }

  return (
    <div className="ml-9 w-[calc(100%-2.25rem)] max-w-[80%]">
      <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading}>
        {loading ? <FiLoader size={13} className="animate-spin" />
          : open ? <FiChevronUp size={13} /> : <FiFileText size={13} />}
        {open ? 'Ẩn đề thi' : 'Xem đề thi'}
      </Button>

      {open && exam && (
        <div ref={boxRef} className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm space-y-3">
          <div>
            <p className="font-semibold text-slate-900">{exam.name}</p>
            <p className="text-xs text-slate-400">{exam.questions.length} câu hỏi</p>
          </div>
          <ol className="space-y-3">
            {exam.questions.map((q, qi) => (
              <li key={q.questionId ?? qi}>
                <p className="font-medium text-slate-800">Câu {qi + 1}. {q.questionContent}</p>
                <ul className="mt-1 space-y-0.5">
                  {q.answers.map((a, ai) => {
                    const correct = Boolean(Number(a.isCorrected));
                    return (
                      <li key={a.answerId ?? ai}
                          className={cn('flex items-start gap-1.5 rounded-md px-2 py-0.5',
                            correct ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600')}>
                        <span className="shrink-0">{LETTERS[ai] ?? ai + 1}.</span>
                        <span className="flex-1">{a.content}</span>
                        {correct && <FiCheck size={13} className="mt-0.5 shrink-0" />}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && (
                  <p className="mt-1 text-xs text-slate-500">Giải thích: {q.explanation}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
