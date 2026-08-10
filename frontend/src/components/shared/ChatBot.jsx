import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {matchPath, useLocation} from 'react-router-dom';
import {FiLoader, FiMaximize2, FiMinimize2, FiPlus, FiSend, FiSquare, FiX} from 'react-icons/fi';
import {IoCheckmarkOutline} from 'react-icons/io5';
import {LuCopy} from "react-icons/lu";
import {toast} from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {clearChatHistory, getChatHistory, streamChat} from '../../api/chatService';
import {useAuth} from '../../context/auth-context';
import chatbotIcon from '../../assets/chatbot.png';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {cn} from '@/lib/utils';

const mdComponents = {
    p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
    ul: ({children}) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
    li: ({children}) => <li className="leading-snug">{children}</li>,
    code: ({children}) => <code className="bg-black/10 rounded-sm px-1 py-0.5 text-xs font-mono">{children}</code>,
    pre: ({children}) => <pre
        className="bg-black/10 rounded-sm p-2 text-xs font-mono overflow-x-auto my-1">{children}</pre>,
};

const WELCOME_STUDENT = 'Xin chào! Mình là trợ lý Toán lớp 3. Bạn cần giúp gì không? 😊';
const WELCOME_TEACHER = 'Xin chào thầy/cô! Tôi là trợ lý giảng dạy Toán lớp 3. Tôi có thể hỗ trợ soạn bài, ra đề thi hoặc gợi ý phương pháp giảng dạy. Thầy/cô cần giúp gì?';

// Các trang không được hiện chatbot. Màn làm bài bị chặn để học sinh không
// hỏi AI đáp án ngay trong lúc thi.
const HIDDEN_ROUTES = ['/student/exam/:examId'];

// Chỉ dùng khi không gọi được tới server (mất mạng, backend chết). Lỗi model
// thì backend tự trả câu xin lỗi — xem backend/src/chat/fallback-messages.js.
const OFFLINE_TEACHER = [
    'Xin lỗi thầy/cô, tôi đang không kết nối được. Thầy/cô kiểm tra mạng rồi gửi lại câu hỏi giúp tôi nhé!',
    'Tôi vừa mất liên lạc với hệ thống mất rồi thầy/cô ạ. Thầy/cô thử lại sau một chút nhé!',
];
const OFFLINE_STUDENT = [
    'Ôi, hình như mạng của mình vừa đứt mất rồi. Bạn thử hỏi lại giúp mình nhé!',
    'Mình không kết nối được, chưa nghe thấy câu hỏi của bạn. Bạn gửi lại giúp mình nha!',
];

const pickOffline = (isTeacher) => {
    const list = isTeacher ? OFFLINE_TEACHER : OFFLINE_STUDENT;
    return list[Math.floor(Math.random() * list.length)];
};

// navigator.clipboard vắng mặt ở non-secure context, và có mặt nhưng vẫn ném
// NotAllowedError khi tab không được focus / thiếu quyền. Phải bắt cả hai
// trường hợp rồi mới rơi xuống textarea ẩn, không thì báo lỗi oan.
function copyViaTextarea(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('execCommand copy failed');
}

async function copyText(text) {
    try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard API unavailable');
        await navigator.clipboard.writeText(text);
    } catch {
        copyViaTextarea(text);
    }
}

function CopyButton({text, className}) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await copyText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Không copy được, bạn thử bôi đen rồi Ctrl+C nhé');
        }
    }

    return (
        <Button
            onClick={handleCopy}
            variant="ghost"
            size="icon-sm"
            title={copied ? 'Đã copy' : 'Copy tin nhắn'}
            aria-label={copied ? 'Đã copy tin nhắn' : 'Copy tin nhắn'}
            className={cn(
                // slate-400 là tông icon phụ dùng chung trong dự án (xem RelativesCard)
                'text-shadow-slate-950 hover:text-indigo-600 hover:bg-indigo-50',
                copied && 'text-emerald-600 hover:text-emerald-600',
                className
            )}
        >
            {copied ? <IoCheckmarkOutline size={16}/> : <LuCopy size={16} fontWeight={2}/>}
        </Button>
    );
}

// Đi kèm mọi bong bóng của bot — kể cả lúc đang nghĩ — để bong bóng không bị
// dịch ngang khi câu trả lời thay chỗ chỉ báo loading.
function BotAvatar() {
    return (
        <Avatar className="size-7 rounded-xl bg-indigo-100 shrink-0 self-end mb-0.5">
            <AvatarImage src={chatbotIcon} alt="" className="object-contain p-0.5"/>
            <AvatarFallback className="rounded-xl bg-indigo-100 text-[10px] font-bold text-indigo-600">
                AI
            </AvatarFallback>
        </Avatar>
    );
}

export default function ChatBot() {
    const {user} = useAuth();
    const {pathname} = useLocation();
    const welcome = user?.role === 'teacher' ? WELCOME_TEACHER : WELCOME_STUDENT;
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [messages, setMessages] = useState([{role: 'assistant', content: welcome}]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [toolLabel, setToolLabel] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const [clearing, setClearing] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const abortRef = useRef(null);

    // App gắn key={user.id} cho ChatBot nên đổi tài khoản là component remount
    // sạch state — chỗ này chỉ còn lo nạp lịch sử của đúng người đang đăng nhập.
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        getChatHistory().then(data => {
            if (cancelled) return;
            // Gán cả khi rỗng: tài khoản chưa có lịch sử thì phải chỉ còn mỗi lời
            // chào, chứ không giữ nguyên những gì đang hiển thị.
            setMessages([{role: 'assistant', content: welcome}, ...(data.messages ?? [])]);
        }).catch(() => {
        });
        return () => { cancelled = true; };
    }, [user, welcome]);

    // Rời trang / đổi tài khoản giữa chừng: cắt stream đang chạy, không thì model
    // vẫn sinh tiếp và vẫn tính token dù không còn ai đọc.
    useEffect(() => () => abortRef.current?.abort(), []);

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({behavior: 'smooth'});
            inputRef.current?.focus();
        }
    }, [open, messages]);

    if (!user) return null;
    if (HIDDEN_ROUTES.some(route => matchPath(route, pathname))) return null;

    async function handleSend() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = {role: 'user', content: text};
        const history = [...messages, userMsg];
        setMessages(history);
        setInput('');
        setLoading(true);

        // placeholder tin nhắn AI đang stream
        const placeholder = {role: 'assistant', content: ''};
        setMessages([...history, placeholder]);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await streamChat([userMsg], {
                signal: controller.signal,
                onToken: (token) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: updated[updated.length - 1].content + token,
                        };
                        return updated;
                    });
                },
                onDone: () => {
                    setLoading(false);
                    setToolLabel(null);
                },
                onToolStart: (data) => setToolLabel(data.label),
                onToolDone: () => setToolLabel(null),
            });
        } catch {
            // Người dùng chủ động dừng: bỏ hẳn cặp câu hỏi + đoạn trả lời dở, khớp
            // với việc backend xóa chúng khỏi DB. Ô nhập để trống vì hủy là để hỏi
            // việc khác, không phải để hỏi lại câu cũ.
            if (controller.signal.aborted) {
                setMessages(history.slice(0, -1));
                setLoading(false);
                setToolLabel(null);
                return;
            }
            // Chỉ chạy khi không nối được tới server — lỗi từ phía model đã được
            // backend chuyển thành một câu xin lỗi và stream về như token bình thường.
            setMessages(prev => {
                const updated = [...prev];
                const failed = updated[updated.length - 1];
                const apology = pickOffline(user.role === 'teacher');
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: failed?.content ? `${failed.content}\n\n${apology}` : apology,
                };
                return updated;
            });
            setLoading(false);
        } finally {
            abortRef.current = null;
        }
    }

    function handleStop() {
        abortRef.current?.abort();
    }

    // Phiên chat sống 24h nên hội thoại hôm trước vẫn nằm trong ngữ cảnh gửi cho
    // model. Nút này xóa phiên để bắt đầu lại từ đầu — hữu ích khi mạch hội thoại
    // đã lệch hoặc trước khi trình bày cho người khác xem.
    async function handleClear() {
        setClearing(true);
        try {
            abortRef.current?.abort();
            await clearChatHistory();
            setMessages([{role: 'assistant', content: welcome}]);
            setInput('');
            setToolLabel(null);
            setConfirmClear(false);
            inputRef.current?.focus();
        } catch (err) {
            toast.error(err?.message || 'Không xóa được cuộc trò chuyện');
        } finally {
            setClearing(false);
        }
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const button = (
        <Button
            onClick={() => setOpen(o => !o)}
            size="icon-lg"
            className="fixed bottom-6 right-6 z-50 size-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-105"
            title="Hỏi đáp Toán"
        >
            {open ? <FiX size={22}/> : <img src={chatbotIcon} alt="chat" className="w-9 h-9 object-contain"/>}
        </Button>
    );

    const panel = open && (
        <Card className={cn(
            'fixed bottom-20 right-6 z-50 p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden',
            'hover:translate-y-0 hover:shadow-2xl transition-[width,height] duration-200 ease-out',
            // Giới hạn kích thước nằm trong min() của chính width/height, KHÔNG dùng
            // max-w/max-h: chuyển giữa max-width 1000px và none không nội suy được,
            // khiến panel nhảy vọt ra 100vw rồi mới co lại khi bấm thu nhỏ.
            expanded
                ? 'w-[min(1000px,calc(100vw_-_3rem))] h-[calc(100vh_-_7rem)]'
                : 'w-[min(400px,calc(100vw_-_3rem))] sm:w-[min(520px,calc(100vw_-_3rem))] h-[min(740px,calc(100vh_-_7rem))]'
        )}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 shrink-0">
                <Avatar className="size-8 rounded-xl bg-white/20">
                    <AvatarImage src={chatbotIcon} alt="chat" className="object-contain p-0.5"/>
                    <AvatarFallback className="rounded-xl bg-transparent text-white text-xs">AI</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-semibold text-white">Trợ lý Toán</p>
                    <p className="text-xs text-indigo-200">Toán lớp 3 · Luôn sẵn sàng giúp bạn</p>
                </div>
                <Button onClick={() => setConfirmClear(true)} variant="ghost" size="icon-sm"
                        disabled={loading || clearing}
                        title="Cuộc trò chuyện mới" aria-label="Bắt đầu cuộc trò chuyện mới"
                        className="ml-auto text-indigo-200 hover:bg-white/15 hover:text-white">
                    {clearing ? <FiLoader size={15} className="animate-spin"/> : <FiPlus size={16}/>}
                </Button>
                <Button onClick={() => setExpanded(e => !e)} variant="ghost" size="icon-sm"
                        title={expanded ? 'Thu nhỏ' : 'Phóng to'}
                        aria-label={expanded ? 'Thu nhỏ khung chat' : 'Phóng to khung chat'}
                        className="text-indigo-200 hover:bg-white/15 hover:text-white">
                    {expanded ? <FiMinimize2 size={15}/> : <FiMaximize2 size={15}/>}
                </Button>
                <Button onClick={() => setOpen(false)} variant="ghost" size="icon-sm"
                        title="Đóng" aria-label="Đóng khung chat"
                        className="text-indigo-200 hover:bg-white/15 hover:text-white">
                    <FiX size={16}/>
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="px-4 py-3 space-y-3">
                    {messages.map((m, i) => {
                        if (m.content === '' && i === messages.length - 1) return null; // placeholder ẩn khi chưa có token
                        const isUser = m.role === 'user';
                        return (
                            // Cột: hàng [avatar + bong bóng] ở trên, nút copy ở dưới.
                            <div key={i} className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {!isUser && <BotAvatar/>}
                                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                        isUser
                                            ? 'bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap'
                                            : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                                    }`}>
                                        {isUser ? m.content : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                                                {m.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                                {/* ml-9 = bề rộng avatar (28px) + gap (8px), để nút thẳng mép bong bóng */}
                                <CopyButton text={m.content} className={isUser ? '' : 'ml-9'}/>
                            </div>
                        );
                    })}
                    {loading && messages[messages.length - 1]?.content === '' && (
                        toolLabel ? (
                            <div className="flex gap-2 justify-start">
                                <BotAvatar/>
                                <div
                                    className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-indigo-600">
                                    <FiLoader size={13} className="animate-spin shrink-0"/>
                                    <span>{toolLabel}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 justify-start">
                                <BotAvatar/>
                                <div
                                    className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                          style={{animationDelay: '0ms'}}/>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                          style={{animationDelay: '150ms'}}/>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                          style={{animationDelay: '300ms'}}/>
                                </div>
                            </div>
                        )
                    )}
                    <div ref={bottomRef}/>
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-slate-100 shrink-0">
                <div className="px-3 py-3 flex items-end gap-2">
                    <Textarea ref={inputRef} rows={1} className="flex-1 resize-none rounded-xl max-h-20"
                              placeholder="Nhập câu hỏi Toán..." value={input} onChange={e => setInput(e.target.value)}
                              onKeyDown={handleKey}/>
                    {loading ? (
                        <Button
                            onClick={handleStop}
                            size="icon"
                            title="Dừng trả lời"
                            aria-label="Dừng trả lời"
                            className="rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 shrink-0"
                        >
                            <FiSquare size={12} className="fill-current"/>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            size="icon"
                            title="Gửi"
                            aria-label="Gửi câu hỏi"
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                        >
                            <FiSend size={15}/>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );

    const clearDialog = (
        <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bắt đầu cuộc trò chuyện mới?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Toàn bộ tin nhắn trong cuộc trò chuyện hiện tại sẽ bị xóa và không thể
                        khôi phục. Trợ lý cũng sẽ không còn nhớ những gì đã nói trước đó.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={clearing}>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); handleClear(); }}
                                       disabled={clearing}>
                        {clearing ? 'Đang xóa...' : 'Xóa và bắt đầu lại'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return createPortal(
        <>{button}{panel}{clearDialog}</>,
        document.body
    );
}
