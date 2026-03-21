import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, X, MessageCircle } from 'lucide-react';
import { Card, ChatMessage } from '../types';
import { buildActionPrompt, fetchCardDetail, sendFollowUp } from '../services/geminiService';

interface CardDetailPanelProps {
  card: Card;
  mainTopic: string;
  onClose: () => void;
}

// ── Markdown components ───────────────────────────────────────────────────────

const REAL_CODE_LANGS = new Set([
  'js','javascript','ts','typescript','python','py','java','c','cpp','c++',
  'cs','csharp','go','rust','ruby','rb','php','swift','kotlin','scala','dart','r',
  'bash','sh','shell','zsh','fish','powershell','ps1',
  'sql','html','css','scss','sass','less',
  'json','yaml','yml','toml','xml','graphql','markdown','md',
]);

const md: Record<string, React.ComponentType<any>> = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-slate-900 mt-7 mb-3 pb-1.5 border-b border-slate-100">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[14px] font-semibold text-slate-800 mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[13px] font-semibold text-slate-700 mt-4 mb-1.5">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-[14px] text-slate-600 leading-[1.85] mb-4">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-500">{children}</em>,
  del: ({ children }) => <del className="line-through text-slate-400">{children}</del>,
  ul: ({ children }) => (
    <ul className="mb-4 pl-5 space-y-1.5 list-disc marker:text-slate-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 pl-5 space-y-1.5 list-decimal marker:text-slate-500 marker:font-medium marker:text-sm">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[14px] text-slate-600 leading-7 pl-1">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-slate-200 pl-4 py-1 my-5 text-slate-500 italic text-[13px] leading-7">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
  th: ({ children }) => (
    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-[13px] text-slate-600 px-4 py-2.5">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50/60 transition-colors">{children}</tr>
  ),
  hr: () => <hr className="my-6 border-slate-100" />,
  code: ({ inline, className, children }: any) => {
    if (inline) {
      return (
        <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-[12px] font-mono border border-slate-200 mx-0.5">
          {children}
        </code>
      );
    }
    const lang = /language-(\w+)/.exec(className || '')?.[1];
    const isCode = lang && REAL_CODE_LANGS.has(lang.toLowerCase());
    if (isCode) {
      return (
        <div className="my-5 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-mono">{lang}</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            </div>
          </div>
          <div className="bg-slate-900 px-5 py-4 overflow-x-auto">
            <code className="text-[13px] font-mono leading-relaxed text-slate-300 block">{children}</code>
          </div>
        </div>
      );
    }
    return (
      <div className="my-5 rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
          <span className="text-[11px] text-slate-500 font-medium">示意图</span>
        </div>
        <pre className="px-5 py-4 text-[13px] text-slate-700 leading-7 whitespace-pre-wrap font-sans bg-white m-0 overflow-x-auto">
          {String(children).replace(/\n$/, '')}
        </pre>
      </div>
    );
  },
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-blue-200 hover:decoration-blue-500 transition-colors text-[14px]">
      {children}
    </a>
  ),
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-6 py-6 space-y-4 animate-pulse">
      <div className="h-5 bg-slate-100 rounded w-1/3" />
      <div className="space-y-2.5">
        <div className="h-3.5 bg-slate-100 rounded-full" />
        <div className="h-3.5 bg-slate-100 rounded-full w-11/12" />
        <div className="h-3.5 bg-slate-100 rounded-full w-4/5" />
      </div>
      <div className="h-5 bg-slate-100 rounded w-1/4 mt-2" />
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
            <div className={`h-3.5 bg-slate-100 rounded-full ${i === 3 ? 'w-3/4' : 'w-full'}`} />
          </div>
        ))}
      </div>
      <div className="h-5 bg-slate-100 rounded w-1/4 mt-2" />
      <div className="h-24 bg-slate-50 rounded-xl border border-slate-100" />
      <div className="h-5 bg-slate-100 rounded w-1/4 mt-2" />
      <div className="space-y-2.5">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
            <div className={`h-3.5 bg-slate-100 rounded-full ${i === 2 ? 'w-2/3' : 'w-full'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CardDetailPanel({ card, mainTopic, onClose }: CardDetailPanelProps) {
  const [initialContent, setInitialContent] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fullHistory, setFullHistory] = useState<ChatMessage[]>([]);
  const [followUps, setFollowUps] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setInitialContent('');
    setIsInitialLoading(true);
    setFullHistory([]);
    setFollowUps([]);
    setInputValue('');

    const prompt = buildActionPrompt(card, mainTopic);
    let accumulated = '';

    fetchCardDetail(prompt, (chunk) => {
      accumulated += chunk;
      setInitialContent(accumulated);
    }, ctrl.signal)
      .then(() => {
        setFullHistory([
          { role: 'user', content: prompt },
          { role: 'assistant', content: accumulated },
        ]);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setInitialContent('加载失败，请关闭后重试。');
      })
      .finally(() => setIsInitialLoading(false));

    return () => ctrl.abort();
  }, [card.card_id]);

  useEffect(() => {
    if (followUps.length > 0) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [followUps]);

  const handleSubmit = async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...fullHistory, userMsg];
    setFollowUps((p) => [...p, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setFullHistory(newHistory);
    setInputValue('');
    setIsSending(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let response = '';
    try {
      await sendFollowUp(newHistory, (chunk) => {
        response += chunk;
        setFollowUps((p) => {
          const u = [...p];
          u[u.length - 1] = { role: 'assistant', content: response };
          return u;
        });
      }, ctrl.signal);
      setFullHistory((p) => [...p, { role: 'assistant', content: response }]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setFollowUps((p) => {
        const u = [...p];
        u[u.length - 1] = { role: 'assistant', content: '回复失败，请重试。' };
        return u;
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const MdContent = ({ children }: { children: string }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{children}</ReactMarkdown>
  );

  return (
    <div
      className="animate-slide-in-right absolute top-0 right-0 h-full w-full md:w-[700px] bg-white flex flex-col z-50 rounded-tl-2xl"
      style={{ boxShadow: '-1px 0 0 0 rgba(0,0,0,0.04), -6px 0 40px rgba(0,0,0,0.10), -2px 0 12px rgba(0,0,0,0.04)' }}
    >

      {/* ── Toolbar ── */}
      <div className="h-11 px-3 flex items-center gap-2 border-b border-slate-100 flex-shrink-0 rounded-tl-2xl">
        {/* Card identity */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-lg leading-none flex-shrink-0">{card.icon}</span>
          <span className="text-[13px] font-semibold text-slate-800 truncate">{card.card_name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
            {card.resource_type}
          </span>
          {card.is_recommended_start && (
            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-medium ml-0.5">
              推荐起点
            </span>
          )}
          <button
            onClick={onClose}
            title="关闭 (Esc)"
            className="ml-1 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Card context strip ── */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex-shrink-0">
        <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-2">{card.card_subtitle}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-full font-medium">
            {card.card_tag}
          </span>
          <span className="text-[10px] text-slate-300">·</span>
          <span className="text-[10px] text-slate-400">{mainTopic}</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Initial response */}
        {isInitialLoading && !initialContent ? (
          <Skeleton />
        ) : (
          <div className="px-6 py-6 [&>*:first-child]:mt-0">
            <MdContent>{initialContent}</MdContent>
          </div>
        )}

        {/* Follow-up thread */}
        {followUps.length > 0 && (
          <div className="px-5 pb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                <MessageCircle className="w-3 h-3 text-slate-300" />
                <span className="text-[11px] text-slate-400 font-medium">继续追问</span>
              </div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-3">
              {followUps.map((msg, i) =>
                msg.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] px-4 py-2.5 bg-zinc-900 text-white rounded-2xl rounded-tr-sm text-[13px] leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="bg-slate-50 rounded-2xl rounded-tl-sm px-5 py-4 border border-slate-100">
                    {msg.content ? (
                      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <MdContent>{msg.content}</MdContent>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1">
                        {[0, 1, 2].map((d) => (
                          <div key={d} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                            style={{ animationDelay: `${d * 150}ms` }} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      {!isInitialLoading && (
        <div className="border-t border-slate-100 px-4 py-3 flex-shrink-0 bg-white">
          <div className="flex items-end gap-2.5 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-slate-300 focus-within:bg-white transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续追问这个知识点..."
              className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed max-h-32"
              rows={1}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
            <button onClick={handleSubmit}
              disabled={!inputValue.trim() || isSending}
              className="w-8 h-8 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors flex-shrink-0">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 text-center mt-1.5">Enter 发送 · Shift+Enter 换行 · Esc 关闭</p>
        </div>
      )}
    </div>
  );
}
