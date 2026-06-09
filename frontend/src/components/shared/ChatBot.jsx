import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiSend, FiLoader } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, getChatHistory } from '../../api/chatService';
import { useAuth } from '../../context/AuthContext';
import chatbotIcon from '../../assets/chatbot.png';

const mdComponents = {
  p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul:     ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
  li:     ({ children }) => <li className="leading-snug">{children}</li>,
  code:   ({ children }) => <code className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
  pre:    ({ children }) => <pre className="bg-black/10 rounded p-2 text-xs font-mono overflow-x-auto my-1">{children}</pre>,
};

const WELCOME_STUDENT = 'Xin chào! Mình là trợ lý Toán lớp 3. Bạn cần giúp gì không? 😊';
const WELCOME_TEACHER = 'Xin chào thầy/cô! Tôi là trợ lý giảng dạy Toán lớp 3. Tôi có thể hỗ trợ soạn bài, ra đề thi hoặc gợi ý phương pháp giảng dạy. Thầy/cô cần giúp gì?';

export default function ChatBot() {
  const { user } = useAuth();
  const welcome = user?.role === 'teacher' ? WELCOME_TEACHER : WELCOME_STUDENT;
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([{ role: 'assistant', content: welcome }]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [toolLabel, setToolLabel] = useState(null);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => {
    if (!user) return;
    getChatHistory().then(data => {
      if (data.messages?.length > 0) {
        setMessages([{ role: 'assistant', content: welcome }, ...data.messages]);
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  if (!user) return null;

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    // placeholder tin nhắn AI đang stream
    const placeholder = { role: 'assistant', content: '' };
    setMessages([...history, placeholder]);

    try {
      await streamChat(
        [userMsg],
        (token) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + token,
            };
            return updated;
          });
        },
        () => { setLoading(false); setToolLabel(null); },
        (data) => setToolLabel(data.label),
        () => setToolLabel(null),
      );
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Xin lỗi, mình gặp lỗi rồi. Bạn thử lại nhé!' };
        return updated;
      });
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const button = (
    <button
      onClick={() => setOpen(o => !o)}
      className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      style={{ width: 52, height: 52 }}
      title="Hỏi đáp Toán"
    >
      {open ? <FiX size={22} /> : <img src={chatbotIcon} alt="chat" className="w-9 h-9 object-contain" />}
    </button>
  );

  const panel = open && (
    <div className="fixed bottom-20 right-6 z-50 w-[400px] sm:w-[520px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
      style={{ height: 740 }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
          <img src={chatbotIcon} alt="chat" className="w-7 h-7 object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Trợ lý Toán</p>
          <p className="text-xs text-indigo-200">Toán lớp 3 · Luôn sẵn sàng giúp bạn</p>
        </div>
        <button onClick={() => setOpen(false)}
          className="ml-auto text-indigo-200 hover:text-white transition-colors">
          <FiX size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => {
          if (m.content === '' && i === messages.length - 1) return null; // placeholder ẩn khi chưa có token
          return (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap'
                  : 'bg-slate-100 text-slate-700 rounded-bl-sm'
              }`}>
                {m.role === 'user' ? m.content : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}
        {loading && messages[messages.length - 1]?.content === '' && (
          toolLabel ? (
            <div className="flex justify-start">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-indigo-600">
                <FiLoader size={13} className="animate-spin shrink-0" />
                <span>{toolLabel}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-100 shrink-0 flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition-all"
          placeholder="Nhập câu hỏi Toán..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          style={{ maxHeight: 80 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center transition-colors shrink-0"
        >
          {loading ? <FiLoader size={15} className="animate-spin" /> : <FiSend size={15} />}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>{button}{panel}</>,
    document.body
  );
}
