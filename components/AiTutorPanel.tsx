import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, X } from 'lucide-react';
import { Card, ChatMessage } from '../types';
import { sendFollowUp } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 360;

interface AiTutorPanelProps {
  card: Card;
  mainTopic: string;
  onClose: () => void;
  externalQuestion?: string | null;
  onExternalHandled?: () => void;
}

// ── Suggested questions by resource type ──────────────────────────────────────

function getSuggestions(card: Card, mainTopic: string): string[] {
  const isHandsOn = ['实战', '部署', '优化'].includes(card.resource_type);
  if (isHandsOn) {
    return [
      `实际项目中使用 ${card.card_name} 最容易踩的坑是什么？`,
      `有哪些开源案例可以参考 ${card.card_name} 的实现？`,
      `如何评估 ${card.card_name} 在项目中的完成质量？`,
      `${card.card_name} 和类似方案相比各有什么适用场景？`,
    ];
  }
  return [
    `用一句话解释 ${card.card_name}，适合向完全不懂的人说明？`,
    `学习 ${card.card_name} 之前需要先掌握哪些基础？`,
    `${card.card_name} 在 ${mainTopic} 整体体系里处于什么位置？`,
    `${card.card_name} 和哪些概念最容易混淆，怎么区分？`,
  ];
}

// ── Compact markdown for chat messages ───────────────────────────────────────

const ChatMd = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="text-[13px] leading-relaxed mb-1.5 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-1.5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-1.5">{children}</ol>,
      li: ({ children }) => <li className="text-[13px] leading-relaxed">{children}</li>,
      code: ({ inline, children }: any) =>
        inline
          ? <code className="bg-black/10 px-1 py-0.5 rounded text-[12px] font-mono">{children}</code>
          : <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg text-[12px] font-mono overflow-x-auto my-2 leading-relaxed"><code>{children}</code></pre>,
    }}
  >
    {content}
  </ReactMarkdown>
);

// ── Main component ─────────────────────────────────────────────────────────────

export default function AiTutorPanel({
  card, mainTopic, onClose, externalQuestion, onExternalHandled,
}: AiTutorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  const messagesRef = useRef<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const suggestions = getSuggestions(card, mainTopic);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isSendingRef.current = isSending; }, [isSending]);

  // Drag-to-resize
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: width };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startX - ev.clientX; // left edge: drag left = wider
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + delta));
      setWidth(next);
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Reset when card changes
  useEffect(() => {
    abortRef.current?.abort();
    setMessages([]);
    messagesRef.current = [];
    setInputValue('');
    setIsSending(false);
  }, [card.card_id]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Handle external question from ResourcesBlock
  useEffect(() => {
    if (externalQuestion) {
      send(externalQuestion);
      onExternalHandled?.();
    }
  }, [externalQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSendingRef.current) return;

    // Snapshot current messages before appending
    const prevMessages = [...messagesRef.current];

    const next: Message[] = [
      ...prevMessages,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ];
    messagesRef.current = next;
    setMessages(next);
    setInputValue('');
    setIsSending(true);
    isSendingRef.current = true;

    // Build full history for API (include hidden context at start)
    const history: ChatMessage[] = [
      {
        role: 'user',
        content: `我正在学习「${mainTopic}」，当前学习的知识卡片是「${card.card_name}」——${card.card_subtitle}。请作为我的 AI 学习导师，回答我的追问。`,
      },
      {
        role: 'assistant',
        content: `好的，我来帮你深入理解「${card.card_name}」。请随时提问！`,
      },
      ...prevMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmed },
    ];

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let response = '';
    try {
      await sendFollowUp(history, (chunk) => {
        response += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: response };
          messagesRef.current = updated;
          return updated;
        });
      }, ctrl.signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '回复失败，请重试。' };
        messagesRef.current = updated;
        return updated;
      });
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(inputValue);
    }
  };

  return (
    <div
      className="flex-shrink-0 border-l border-slate-100 bg-white flex flex-col relative"
      style={{ width }}
    >
      {/* ── Drag handle ── */}
      <div
        onMouseDown={handleDragStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group z-10 hover:bg-amber-300/60 transition-colors"
        title="拖拽调整宽度"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-slate-200 group-hover:bg-amber-400 transition-colors" />
      </div>

      {/* ── Header ── */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] leading-none">🤖</span>
          </div>
          <span className="text-[13px] font-semibold text-slate-700">AI 导师</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors rounded-md hover:bg-slate-50"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Chat area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 ? (
          // Initial state: greeting + suggestions
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-[13px] text-slate-700 leading-relaxed">
                你好！我是你的 AI 学习导师 👋
                <br />
                关于「<span className="font-medium">{card.card_name}</span>」，随时可以向我提问。
              </p>
            </div>
            <p className="text-[11px] text-slate-400 px-1 pt-1">你可能想了解的问题：</p>
            <div className="space-y-1.5">
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="w-full text-left text-[12.5px] text-slate-600 leading-snug px-3 py-2.5 bg-slate-50 hover:bg-amber-50 hover:text-slate-800 rounded-xl transition-colors border border-transparent hover:border-amber-100"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Conversation
          <div className="space-y-3">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[90%] px-3 py-2 bg-zinc-900 text-white rounded-2xl rounded-tr-sm text-[13px] leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-100 text-slate-700">
                  {msg.content ? (
                    <ChatMd content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      {[0, 1, 2].map(d => (
                        <div
                          key={d}
                          className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${d * 150}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="border-t border-slate-100 p-3 flex-shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-amber-300 focus-within:bg-white transition-all">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="向 AI 导师提问..."
            className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed max-h-24"
            rows={1}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
            }}
          />
          <button
            onClick={() => send(inputValue)}
            disabled={!inputValue.trim() || isSending}
            className="w-7 h-7 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-3 h-3 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-slate-300 text-center mt-1.5">Enter 发送 · Shift+Enter 换行</p>
      </div>
    </div>
  );
}
