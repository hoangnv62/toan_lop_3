import { useState } from 'react';
import { FiPlus, FiX, FiSave, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { createBankQuestion, updateBankQuestion } from '../../../api/questionBankService';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyAnswers() {
  return ['', '', '', ''].map(() => ({ content: '', isCorrect: false }));
}

export default function QuestionFormModal({ initial, lessons = [], defaultLessonId = null, onClose, onSaved }) {
  const isEdit = !!initial;
  const [content, setContent]         = useState(initial?.content || '');
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [lessonId, setLessonId]       = useState(defaultLessonId ?? null);
  const [answers, setAnswers]         = useState(
    initial?.answers
      ? initial.answers.map(a => ({ content: a.content, isCorrect: a.isCorrect === 1 || a.isCorrect === true }))
      : emptyAnswers()
  );
  const [saving, setSaving] = useState(false);

  function updateAnswer(ai, val) {
    setAnswers(prev => prev.map((a, i) => i === ai ? { ...a, content: val } : a));
  }
  function setCorrect(ai) {
    setAnswers(prev => prev.map((a, i) => ({ ...a, isCorrect: i === ai })));
  }
  function addAnswer() {
    if (answers.length >= 6) return;
    setAnswers(prev => [...prev, { content: '', isCorrect: false }]);
  }
  function removeAnswer(ai) {
    if (answers.length <= 2) return;
    setAnswers(prev => prev.filter((_, i) => i !== ai));
  }

  async function handleSave() {
    if (!content.trim()) return toast.error('Nội dung câu hỏi không được trống');
    if (!answers.some(a => a.isCorrect)) return toast.error('Vui lòng chọn 1 đáp án đúng');
    const emptyIdx = answers.findIndex(a => !a.content.trim());
    if (emptyIdx !== -1) return toast.error('Đáp án ' + (ANSWER_LABELS[emptyIdx] ?? emptyIdx + 1) + ' chưa có nội dung');
    setSaving(true);
    try {
      const payload = {
        content: content.trim(),
        explanation: explanation.trim(),
        lessonId: lessonId || null,
        answers: answers.map(a => ({ content: a.content.trim(), isCorrect: !!a.isCorrect })),
      };
      if (isEdit) {
        await updateBankQuestion(initial.id, payload);
        toast.success('Đã cập nhật câu hỏi');
      } else {
        await createBankQuestion(payload);
        toast.success('Đã thêm câu hỏi vào ngân hàng');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  }

  const hasCorrect = answers.some(a => a.isCorrect);

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
          <DialogTitle>{isEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Chủ đề</Label>
            {/* Radix Select không nhận value="" nên dùng sentinel 'none' cho "Chưa phân loại" */}
            <Select
              value={lessonId == null ? 'none' : String(lessonId)}
              onValueChange={v => setLessonId(v === 'none' ? null : Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chưa phân loại</SelectItem>
                {lessons.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </Label>
            <Textarea className="resize-none" rows={3} placeholder="Nhập nội dung câu hỏi..." value={content} onChange={e => setContent(e.target.value)} autoFocus />
          </div>

          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Giải thích đáp án</Label>
            <Textarea className="resize-none" rows={2} placeholder="Giải thích tại sao đáp án đúng là..." value={explanation} onChange={e => setExplanation(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                Đáp án <span className="text-red-500">*</span>
              </p>
              {hasCorrect
                ? <span className="text-xs text-emerald-600 flex items-center gap-1"><FiCheckCircle size={12} /> Đã chọn đáp án đúng</span>
                : <span className="text-xs text-amber-600 flex items-center gap-1"><FiAlertCircle size={12} /> Chưa chọn đáp án đúng</span>}
            </div>
            {/* Vùng chọn giới hạn ở radio + chữ cái đáp án, tránh tranh chấp với ô nhập text */}
            <RadioGroup
              className="space-y-2 gap-0"
              value={String(answers.findIndex(x => x.isCorrect))}
              onValueChange={v => setCorrect(Number(v))}>
              {answers.map((a, ai) => (
                <div key={ai}
                  className={'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ' +
                    (a.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}>
                  <RadioGroupItem
                    value={String(ai)}
                    id={`bank-answer-${ai}`}
                    className="shrink-0 border-emerald-400 text-emerald-500"
                  />
                  <Label htmlFor={`bank-answer-${ai}`}
                    className={'text-xs font-bold w-5 shrink-0 cursor-pointer ' + (a.isCorrect ? 'text-emerald-600' : 'text-slate-400')}>
                    {ANSWER_LABELS[ai] ?? ai + 1}
                  </Label>
                  <Input className="flex-1 bg-transparent outline-hidden text-sm text-slate-700 placeholder-gray-400" placeholder={'Đáp án ' + (ANSWER_LABELS[ai] ?? ai + 1) + '...'} value={a.content} onChange={e => updateAnswer(ai, e.target.value)} />
                  {answers.length > 2 && (
                    <Button
                      variant="ghost" size="icon-xs"
                      title="Xóa đáp án"
                      className="shrink-0 text-slate-300 hover:text-red-400"
                      onClick={e => { e.preventDefault(); removeAnswer(ai); }}>
                      <FiX size={13} />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
            {answers.length < 6 && (
              <Button
                variant="link" size="xs"
                className="mt-2 h-auto px-0 text-indigo-600 hover:text-indigo-700"
                onClick={addAnswer}>
                <FiPlus size={12} /> Thêm đáp án
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-lg shrink-0">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="gradient" onClick={handleSave} disabled={saving}>
            {saving
              ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</>
              : <><FiSave size={14} /> {isEdit ? 'Cập nhật' : 'Thêm câu hỏi'}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
