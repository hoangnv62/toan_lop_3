import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExam, submitExam } from '../../api/examService';
import { toast } from 'react-toastify';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function ConfirmSubmitModal({ answered, total, onConfirm, onCancel }) {
  const unanswered = total - answered;
  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1 ${
            unanswered > 0 ? 'bg-amber-50' : 'bg-indigo-50'
          }`}>
            <FiAlertCircle size={24} className={unanswered > 0 ? 'text-amber-500' : 'text-indigo-500'} />
          </div>
          <DialogTitle>Xác nhận nộp bài?</DialogTitle>
          <DialogDescription>
            Đã trả lời <span className="font-bold text-slate-800">{answered}/{total}</span> câu hỏi.
          </DialogDescription>
          {unanswered > 0 && (
            <p className="text-xs text-amber-600 font-semibold">
              Còn {unanswered} câu chưa trả lời.
            </p>
          )}
        </DialogHeader>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Làm tiếp</Button>
          <Button variant="gradient" className="flex-1" onClick={onConfirm}>Nộp bài</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentExam() {
  const { examId }  = useParams();
  const navigate    = useNavigate();
  const [exam, setExam]               = useState(null);
  const [answers, setAnswers]         = useState({});
  const [timeLeft, setTimeLeft]       = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef        = useRef(null);
  const timerStartedRef = useRef(false);
  const examDurationRef = useRef(20 * 60);

  useEffect(() => {
    fetchExam(examId).then(data => {
      setExam(data);
      const duration = data.timeLimit || 20 * 60;
      examDurationRef.current = duration;
      setTimeLeft(duration);
    }).catch(() => toast.error('Không tải được bài tập'));
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null || timerStartedRef.current) return;
    timerStartedRef.current = true;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectAnswer(questionId, answerId) {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  }

  async function handleSubmit(auto = false) {
    if (!auto) { setShowConfirm(true); return; }
    setShowConfirm(false);
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeSpent = examDurationRef.current - (timeLeft ?? examDurationRef.current);
      await submitExam(Number(examId), {
        answers: Object.entries(answers).map(([qId, aId]) => ({
          questionId: Number(qId), answerId: Number(aId),
        })),
        timeSpent,
      });
      toast.success('Nộp bài thành công');
      setTimeout(() => navigate(`/exam-result/${examId}`), 800);
    } catch (err) {
      toast.error(err.message || 'Nộp bài thất bại');
      setSubmitting(false);
    }
  }

  const safeTimeLeft = timeLeft ?? 0;
  const mm       = String(Math.floor(safeTimeLeft / 60)).padStart(2, '0');
  const ss       = String(safeTimeLeft % 60).padStart(2, '0');
  const answered = Object.keys(answers).length;
  const total    = exam?.questions?.length ?? 0;
  const pct      = total ? (answered / total) * 100 : 0;

  const timeStatus =
    safeTimeLeft <= 60  ? 'urgent' :
    safeTimeLeft <= 300 ? 'warning' : 'normal';

  const timerCls =
    timeStatus === 'urgent'  ? 'text-red-600 bg-red-50 border-red-200' :
    timeStatus === 'warning' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                               'text-indigo-700 bg-indigo-50 border-indigo-200';

  return (
    <div className="min-h-screen bg-slate-50">
      {showConfirm && (
        <ConfirmSubmitModal
          answered={answered}
          total={total}
          onConfirm={() => handleSubmit(true)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-[0_1px_20px_-4px_rgba(79,70,229,0.1)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{exam?.name || 'Đang tải...'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{answered}/{total} câu đã trả lời</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`font-mono font-bold text-base px-3 py-1 rounded-lg border ${timerCls}`}>
              {mm}:{ss}
            </div>
            <Button variant="gradient" className="py-1.5 px-4" onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        {total > 0 && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">
        {timeLeft === null || !exam ? (
          <div className="flex justify-center py-20">
            <FiLoader size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : exam.questions.map((q, qi) => (
          <Card key={q.questionId} className="p-5 gap-0">
            <p className="font-bold text-slate-900 mb-4 text-sm leading-relaxed">
              <Badge variant="info" className="mr-2">Câu {qi + 1}</Badge>
              {q.questionContent}
            </p>
            <RadioGroup
              className="space-y-2 gap-0"
              value={answers[q.questionId] != null ? String(answers[q.questionId]) : ''}
              onValueChange={v => selectAnswer(q.questionId, Number(v))}>
              {q.answers.map(a => {
                const selected = answers[q.questionId] === a.answerId;
                const inputId = `q${q.questionId}-a${a.answerId}`;
                return (
                  <Label key={a.answerId} htmlFor={inputId}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-sm font-normal cursor-pointer transition-all duration-200 ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold shadow-[0_2px_8px_rgba(79,70,229,0.15)]'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700'
                    }`}>
                    <RadioGroupItem value={String(a.answerId)} id={inputId} className="shrink-0" />
                    {a.content}
                  </Label>
                );
              })}
            </RadioGroup>
          </Card>
        ))}
      </div>
    </div>
  );
}
