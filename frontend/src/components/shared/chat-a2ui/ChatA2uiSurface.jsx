import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle } from 'react-icons/fi';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { A2uiSurface } from '@a2ui/react/v0_9';
import { sendA2uiAction } from '../../../api/chatService';
import { shadcnCatalog } from './catalog';

// Dựng một "surface" A2UI (vd. form giao bài) mà chatbot gửi trong part `data-a2ui`:
// { surfaceId, messages: [createSurface, updateComponents, updateDataModel], status?, summary? }.
// Bấm nút trong form → action A2UI gửi về backend, backend chạy thẳng tool (không gọi model).
export default function ChatA2uiSurface({ surface, sessionId, onSubmitted }) {
  const [busy, setBusy] = useState(false);
  // MessageProcessor giữ trạng thái form (giá trị đang nhập) → tạo 1 lần cho mỗi surface.
  // Giữ onSubmitted của lần đầu là đủ: ChatBot chỉ gọi setMessages dạng hàm cập nhật bên trong.
  const [state] = useState(() => {
    const processor = new MessageProcessor([shadcnCatalog], async (action) => {
      setBusy(true);
      try {
        onSubmitted(await sendA2uiAction(action, sessionId));
      } catch (err) {
        // Sai dữ liệu (hạn nộp ở quá khứ, thiếu lớp...) → báo lỗi, form vẫn mở để sửa.
        toast.error(err?.message || 'Không gửi được form');
      } finally {
        setBusy(false);
      }
    });
    try {
      processor.processMessages(surface.messages);
      return { model: processor.model.surfacesMap.get(surface.surfaceId) };
    } catch (err) {
      console.error('[a2ui] surface không hợp lệ', err);
      return { model: null };
    }
  });

  if (surface.status === 'submitted') {
    return (
      <div className={'flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 '
        + 'px-3 py-2 text-xs text-emerald-700'}>
        <FiCheckCircle size={14} className="mt-0.5 shrink-0"/>
        <span>Đã gửi form — {surface.summary}</span>
      </div>
    );
  }
  if (!state.model) {
    return (
      <p className="text-xs text-slate-400">
        Không hiển thị được form — thầy/cô nhờ chatbot mở lại nhé.
      </p>
    );
  }
  return (
    // fieldset disabled khóa mọi ô nhập + nút trong lúc đang gửi.
    <fieldset disabled={busy} className="min-w-0 disabled:opacity-60">
      <A2uiSurface surface={state.model}/>
    </fieldset>
  );
}
