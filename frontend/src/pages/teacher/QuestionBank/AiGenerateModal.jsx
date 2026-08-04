import { useState } from 'react';
import { FiZap, FiLoader, FiSave, FiArrowLeft, FiCheckCircle, FiEdit2, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { generateBankQuestions, saveBankQuestionsBatch } from '../../../api/questionBankService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const MAX_QUESTIONS = 50;
const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
// Trên ngưỡng này backend phải chia nhiều lệnh gọi nên chờ lâu hẳn — báo trước
// để giáo viên không tưởng là treo.
const SLOW_THRESHOLD = 20;

export default function AiGenerateModal({ lessons = [], defaultLessonId = null, onClose, onSaved }) {
  const [lessonId, setLessonId]       = useState(defaultLessonId);
  const [numQuestions, setNum]        = useState('10');
  const [description, setDescription] = useState('');
  const [generating, setGenerating]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [result, setResult]           = useState(null);   // { questions, requested }
  const [picked, setPicked]           = useState([]);      // chỉ số câu được chọn
  const [editingIdx, setEditingIdx]   = useState(null);    // câu đang mở để sửa

  // Sửa thẳng vào state — không có nút Hủy riêng cho từng câu vì đây vẫn là bản
  // nháp chưa lưu, muốn bỏ hết thì bấm "Tạo lại".
  function patchQuestion(i, patch) {
    setResult(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) => qi === i ? { ...q, ...patch } : q),
    }));
  }

  function patchAnswer(i, ai, content) {
    setResult(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) => qi !== i ? q : {
        ...q,
        answers: q.answers.map((a, idx) => idx === ai ? { ...a, content } : a),
      }),
    }));
  }

  function setCorrect(i, ai) {
    setResult(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) => qi !== i ? q : {
        ...q,
        answers: q.answers.map((a, idx) => ({ ...a, isCorrect: idx === ai })),
      }),
    }));
  }

  // Sửa tay có thể làm câu hỏi hỏng (xóa trắng nội dung, bỏ đáp án đúng) — chặn
  // trước khi gửi lên, và chỉ soát những câu đang được chọn lưu.
  function findInvalid(questions) {
    for (const i of [...picked].sort((a, b) => a - b)) {
      const q = questions[i];
      const at = `Câu ${i + 1}`;
      if (!q.content.trim()) return `${at} chưa có nội dung`;
      const emptyIdx = q.answers.findIndex(a => !a.content.trim());
      if (emptyIdx !== -1) return `${at}: đáp án ${ANSWER_LABELS[emptyIdx] ?? emptyIdx + 1} đang trống`;
      if (q.answers.filter(a => a.isCorrect).length !== 1) return `${at} phải có đúng 1 đáp án đúng`;
    }
    return null;
  }

  const count = parseInt(numQuestions) || 0;
  const countInvalid = count < 1 || count > MAX_QUESTIONS;

  async function handleGenerate() {
    if (!lessonId) return toast.error('Vui lòng chọn chủ đề');
    if (countInvalid) return toast.error(`Số câu hỏi phải từ 1 đến ${MAX_QUESTIONS}`);
    setGenerating(true);
    try {
      const data = await generateBankQuestions({ lessonId, numQuestions: count, description });
      setResult(data);
      setPicked(data.questions.map((_, i) => i));
      setEditingIdx(null);
      // AI thường trả ít hơn số yêu cầu khi số lớn — nói rõ thay vì im lặng.
      if (data.questions.length < data.requested) {
        toast.warning(`AI chỉ tạo được ${data.questions.length}/${data.requested} câu hợp lệ`);
      } else {
        toast.success(`Đã tạo ${data.questions.length} câu hỏi`);
      }
    } catch (err) {
      toast.error(err.message || 'AI không phản hồi, thử lại');
    } finally { setGenerating(false); }
  }

  async function handleSave() {
    if (picked.length === 0) return toast.error('Chưa chọn câu hỏi nào để lưu');
    const invalid = findInvalid(result.questions);
    if (invalid) return toast.error(invalid);

    const questions = [...picked].sort((a, b) => a - b).map(i => {
      const q = result.questions[i];
      return {
        content: q.content.trim(),
        explanation: (q.explanation || '').trim(),
        answers: q.answers.map(a => ({ content: a.content.trim(), isCorrect: a.isCorrect })),
      };
    });
    setSaving(true);
    try {
      const { saved } = await saveBankQuestionsBatch({ lessonId, questions });
      toast.success(`Đã lưu ${saved} câu hỏi vào ngân hàng`);
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  }

  function togglePick(i) {
    setPicked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  const lessonTitle = lessons.find(l => l.id === lessonId)?.title;

  return (
    <Dialog open onOpenChange={open => !open && !generating && !saving && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
          <DialogTitle>Tạo câu hỏi bằng AI</DialogTitle>
          <DialogDescription className="text-xs">
            {result ? `Xem lại, sửa nếu cần rồi chọn câu muốn lưu — ${lessonTitle}` : 'AI soạn câu hỏi trắc nghiệm, bạn xem lại và sửa được trước khi lưu'}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {!result ? (
            <>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Chủ đề <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={lessonId == null ? undefined : String(lessonId)}
                  onValueChange={v => setLessonId(Number(v))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn chủ đề..." /></SelectTrigger>
                  <SelectContent>
                    {lessons.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lessons.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Chưa có bài học nào — hãy tạo bài học ở mục "Quản lý bài học" trước.
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Số câu hỏi <span className="text-slate-400 font-normal">(1–{MAX_QUESTIONS})</span>
                </Label>
                <Input
                  type="number" min={1} max={MAX_QUESTIONS}
                  value={numQuestions}
                  onChange={e => setNum(e.target.value)}
                  className="w-32"
                />
                {countInvalid && numQuestions !== '' && (
                  <p className="text-xs text-red-500 mt-1.5">Chỉ tạo được từ 1 đến {MAX_QUESTIONS} câu mỗi lần.</p>
                )}
                {!countInvalid && count > SLOW_THRESHOLD && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Tạo {count} câu có thể mất 1–2 phút, vui lòng không đóng cửa sổ này.
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả thêm</Label>
                <Textarea
                  className="resize-none" rows={3}
                  placeholder="VD: phép cộng có nhớ trong phạm vi 100, có bài toán đố..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
                  <Checkbox
                    checked={picked.length === result.questions.length}
                    onCheckedChange={() => setPicked(prev =>
                      prev.length === result.questions.length ? [] : result.questions.map((_, i) => i)
                    )}
                    aria-label="Chọn tất cả câu hỏi"
                  />
                  Đã chọn {picked.length}/{result.questions.length} câu
                </label>
              </div>

              <ScrollArea className="max-h-[45vh]">
                <div className="space-y-2 pr-3">
                  {result.questions.map((q, i) => {
                    const editing = editingIdx === i;
                    return (
                      <div key={i} className={
                        'flex items-start gap-3 rounded-xl border px-3 py-2.5 ' +
                        (editing ? 'border-indigo-300 bg-white' : 'border-slate-100 bg-slate-50/60')
                      }>
                        <Checkbox
                          className="mt-1 shrink-0"
                          checked={picked.includes(i)}
                          onCheckedChange={() => togglePick(i)}
                          aria-label={`Chọn câu ${i + 1}`}
                        />

                        <div className="flex-1 min-w-0">
                          {editing ? (
                            <div className="space-y-2.5">
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-semibold text-slate-500 mt-2">{i + 1}.</span>
                                <Textarea
                                  className="resize-none flex-1" rows={2}
                                  placeholder="Nội dung câu hỏi..."
                                  value={q.content}
                                  onChange={e => patchQuestion(i, { content: e.target.value })}
                                  autoFocus
                                />
                              </div>

                              {/* Vùng chọn giới hạn ở radio + chữ cái, tránh tranh chấp với ô nhập text */}
                              <RadioGroup
                                className="space-y-1.5 gap-0"
                                value={String(q.answers.findIndex(a => a.isCorrect))}
                                onValueChange={v => setCorrect(i, Number(v))}>
                                {q.answers.map((a, ai) => (
                                  <div key={ai} className={
                                    'flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 ' +
                                    (a.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200')
                                  }>
                                    <RadioGroupItem
                                      value={String(ai)}
                                      id={`ai-q${i}-a${ai}`}
                                      className="shrink-0 border-emerald-400 text-emerald-500"
                                    />
                                    <Label htmlFor={`ai-q${i}-a${ai}`}
                                      className={'text-xs font-bold w-4 shrink-0 cursor-pointer ' + (a.isCorrect ? 'text-emerald-600' : 'text-slate-400')}>
                                      {ANSWER_LABELS[ai] ?? ai + 1}
                                    </Label>
                                    <Input
                                      className="flex-1 h-8 text-sm"
                                      placeholder={`Đáp án ${ANSWER_LABELS[ai] ?? ai + 1}...`}
                                      value={a.content}
                                      onChange={e => patchAnswer(i, ai, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </RadioGroup>

                              <Input
                                className="h-8 text-sm"
                                placeholder="Giải thích (không bắt buộc)..."
                                value={q.explanation || ''}
                                onChange={e => patchQuestion(i, { explanation: e.target.value })}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-900">{i + 1}. {q.content}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {q.answers.map((a, ai) => (
                                  <Badge key={ai} variant={a.isCorrect ? 'success' : 'neutral'} className="text-xs font-normal">
                                    {a.isCorrect && <FiCheckCircle size={11} className="mr-1" />}
                                    {a.content}
                                  </Badge>
                                ))}
                              </div>
                              {q.explanation && (
                                <p className="text-xs text-slate-500 mt-1.5">Giải thích: {q.explanation}</p>
                              )}
                            </>
                          )}
                        </div>

                        <Button
                          variant="ghost" size="icon-xs"
                          className="shrink-0 mt-0.5"
                          title={editing ? 'Xong' : 'Sửa câu hỏi'}
                          onClick={() => setEditingIdx(editing ? null : i)}>
                          {editing ? <FiCheck size={14} className="text-emerald-600" /> : <FiEdit2 size={14} />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 sm:justify-between">
          {result ? (
            <>
              <Button variant="ghost" onClick={() => { setResult(null); setPicked([]); setEditingIdx(null); }} disabled={saving}>
                <FiArrowLeft size={15} /> Tạo lại
              </Button>
              <Button variant="gradient" onClick={handleSave} disabled={saving || picked.length === 0}>
                {saving
                  ? <><FiLoader size={15} className="animate-spin" /> Đang lưu...</>
                  : <><FiSave size={15} /> Lưu {picked.length} câu vào ngân hàng</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={generating}>Hủy</Button>
              <Button variant="gradient" onClick={handleGenerate} disabled={generating || countInvalid || !lessonId}>
                {generating
                  ? <><FiLoader size={15} className="animate-spin" /> Đang tạo...</>
                  : <><FiZap size={15} /> Tạo bằng AI</>}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
