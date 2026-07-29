import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { matchPath, useLocation } from 'react-router-dom';
import { FiX, FiSend, FiLoader } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, getChatHistory } from '../../api/chatService';
import { useAuth } from '../../context/auth-context';
import chatbotIcon from '../../assets/chatbot.png';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mdComponents = {
  p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul:     ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
  li:     ({ children }) => <li className="leading-snug">{children}</li>,
  code:   ({ children }) => <code className="bg-black/10 rounded-sm px-1 py-0.5 text-xs font-mono">{children}</code>,
  pre:    ({ children }) => <pre className="bg-black/10 rounded-sm p-2 text-xs font-mono overflow-x-auto my-1">{children}</pre>,
};

const WELCOME_STUDENT = 'Xin chào! Mình là trợ lý Toán lớp 3. Bạn cần giúp gì không? 😊';
const WELCOME_TEACHER = 'Xin chào thầy/cô! Tôi là trợ lý giảng dạy Toán lớp 3. Tôi có thể hỗ trợ soạn bài, ra đề thi hoặc gợi ý phương pháp giảng dạy. Thầy/cô cần giúp gì?';

// Các trang không được hiện chatbot. Màn làm bài bị chặn để học sinh không
// hỏi AI đáp án ngay trong lúc thi.
const HIDDEN_ROUTES = ['/student/exam/:examId'];

export default function ChatBot() {
  const { user } = useAuth();
  const { pathname } = useLocation();
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
  if (HIDDEN_ROUTES.some(route => matchPath(route, pathname))) return null;

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
    <Button
      onClick={() => setOpen(o => !o)}
      size="icon-lg"
      className="fixed bottom-6 right-6 z-50 size-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-105"
      title="Hỏi đáp Toán"
    >
      {open ? <FiX size={22} /> : <img src={chatbotIcon} alt="chat" className="w-9 h-9 object-contain" />}
    </Button>
  );

  const panel = open && (
    <Card className="fixed bottom-20 right-6 z-50 w-[400px] sm:w-[520px] h-[740px] max-h-[calc(100vh-7rem)] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden hover:translate-y-0 hover:shadow-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 shrink-0">
        <Avatar className="size-8 rounded-xl bg-white/20">
          <AvatarImage src={chatbotIcon} alt="chat" className="object-contain p-0.5" />
          <AvatarFallback className="rounded-xl bg-transparent text-white text-xs">AI</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">Trợ lý Toán</p>
          <p className="text-xs text-indigo-200">Toán lớp 3 · Luôn sẵn sàng giúp bạn</p>
        </div>
        <Button onClick={() => setOpen(false)} variant="ghost" size="icon-sm"
          className="ml-auto text-indigo-200 hover:bg-white/15 hover:text-white">
          <FiX size={16} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3 space-y-3">
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
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-100 shrink-0 flex items-end gap-2">
        <Textarea ref={inputRef} rows={1} className="flex-1 resize-none rounded-xl max-h-20" placeholder="Nhập câu hỏi Toán..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          size="icon"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
        >
          {loading ? <FiLoader size={15} className="animate-spin" /> : <FiSend size={15} />}
        </Button>
      </div>
    </Card>
  );

  return createPortal(
    <>{button}{panel}</>,
    document.body
  );
}
