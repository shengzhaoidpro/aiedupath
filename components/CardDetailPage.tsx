import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, Bot } from 'lucide-react';
import { Card, ParsedDetail } from '../types';
import { buildActionPrompt, fetchCardDetail } from '../services/geminiService';
import ResourcesBlock from './ResourcesBlock';
import AiTutorPanel from './AiTutorPanel';

interface CardDetailPageProps {
  card: Card;
  mainTopic: string;
  onBack: () => void;
}

function parseDetailResponse(rawText: string): ParsedDetail {
  const SPLIT = '---RESOURCES---';
  const idx = rawText.indexOf(SPLIT);
  if (idx === -1) return { mainContent: rawText, resources: null };
  const mainContent = rawText.slice(0, idx).trim();
  const raw = rawText.slice(idx + SPLIT.length).trim();
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return { mainContent, resources: JSON.parse(clean) };
  } catch {
    return { mainContent, resources: null };
  }
}

// ── Markdown components ────────────────────────────────────────────────────────

const REAL_CODE_LANGS = new Set([
  'js','javascript','ts','typescript','python','py','java','c','cpp','c++',
  'cs','csharp','go','rust','ruby','rb','php','swift','kotlin','scala','dart','r',
  'bash','sh','shell','zsh','fish','powershell','ps1',
  'sql','html','css','scss','sass','less',
  'json','yaml','yml','toml','xml','graphql','markdown','md',
]);

const md: Record<string, React.ComponentType<any>> = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-slate-900 mt-10 mb-4 pb-2 border-b border-slate-100 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[15px] font-semibold text-slate-800 mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[14px] font-semibold text-slate-700 mt-4 mb-1.5">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-[15px] text-slate-600 leading-[1.9] mb-4">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-500">{children}</em>,
  del: ({ children }) => <del className="line-through text-slate-400">{children}</del>,
  ul: ({ children }) => (
    <ul className="mb-4 pl-5 space-y-2 list-disc marker:text-slate-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 pl-5 space-y-2 list-decimal marker:text-slate-500 marker:font-medium">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] text-slate-600 leading-[1.8] pl-1">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-amber-300 pl-4 py-1 my-5 text-slate-500 italic text-[14px] leading-7 bg-amber-50/40 rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
  th: ({ children }) => (
    <th className="text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-[14px] text-slate-600 px-5 py-3">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50/60 transition-colors">{children}</tr>
  ),
  hr: () => <hr className="my-8 border-slate-100" />,
  code: ({ inline, className, children }: any) => {
    if (inline) {
      return (
        <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-[13px] font-mono border border-slate-200 mx-0.5">
          {children}
        </code>
      );
    }
    const lang = /language-(\w+)/.exec(className || '')?.[1];
    const isCode = lang && REAL_CODE_LANGS.has(lang.toLowerCase());
    if (isCode) {
      return (
        <div className="my-6 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700/60">
            <span className="text-[12px] text-slate-400 font-mono">{lang}</span>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
          </div>
          <div className="bg-slate-900 px-5 py-5 overflow-x-auto">
            <code className="text-[14px] font-mono leading-relaxed text-slate-300 block">{children}</code>
          </div>
        </div>
      );
    }
    return (
      <div className="my-6 rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
          <span className="text-[11px] text-slate-500 font-medium">示意图</span>
        </div>
        <pre className="px-5 py-4 text-[14px] text-slate-700 leading-7 whitespace-pre-wrap font-sans bg-white m-0 overflow-x-auto">
          {String(children).replace(/\n$/, '')}
        </pre>
      </div>
    );
  },
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-blue-200 hover:decoration-blue-500 transition-colors">
      {children}
    </a>
  ),
};

// ── Loading skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 bg-slate-100 rounded w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-100 rounded-full" />
        <div className="h-4 bg-slate-100 rounded-full w-11/12" />
        <div className="h-4 bg-slate-100 rounded-full w-4/5" />
      </div>
      <div className="h-6 bg-slate-100 rounded w-1/4 mt-2" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />
            <div className={`h-4 bg-slate-100 rounded-full ${i === 3 ? 'w-3/4' : 'w-full'}`} />
          </div>
        ))}
      </div>
      <div className="h-6 bg-slate-100 rounded w-1/4 mt-2" />
      <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
      <div className="h-6 bg-slate-100 rounded w-1/4 mt-2" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />
            <div className={`h-4 bg-slate-100 rounded-full ${i === 2 ? 'w-2/3' : 'w-full'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CardDetailPage({ card, mainTopic, onBack }: CardDetailPageProps) {
  const [initialContent, setInitialContent] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTutorOpen, setIsTutorOpen] = useState(true);
  const [tutorQuestion, setTutorQuestion] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setInitialContent('');
    setIsInitialLoading(true);
    setTutorQuestion(null);

    const prompt = buildActionPrompt(card, mainTopic);
    let accumulated = '';

    fetchCardDetail(prompt, (chunk) => {
      accumulated += chunk;
      setInitialContent(accumulated);
    }, ctrl.signal)
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setInitialContent('加载失败，请返回后重试。');
      })
      .finally(() => setIsInitialLoading(false));

    return () => ctrl.abort();
  }, [card.card_id]);

  const MdContent = ({ children }: { children: string }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{children}</ReactMarkdown>
  );

  const { mainContent, resources } = parseDetailResponse(initialContent);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white animate-fade-in">

      {/* ── Top bar ── */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-slate-100 flex-shrink-0 bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-[13px] font-medium flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回路径</span>
        </button>

        <div className="w-px h-4 bg-slate-100 flex-shrink-0" />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg leading-none flex-shrink-0">{card.icon}</span>
          <span className="text-[14px] font-semibold text-slate-800 truncate">{card.card_name}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
            {card.resource_type}
          </span>
          {card.is_recommended_start && (
            <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-medium">
              推荐起点
            </span>
          )}
          {/* AI Tutor toggle */}
          <button
            onClick={() => setIsTutorOpen(v => !v)}
            title={isTutorOpen ? '关闭 AI 导师' : '打开 AI 导师'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors ${
              isTutorOpen
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI 导师</span>
          </button>
        </div>
      </div>

      {/* ── Card context strip ── */}
      <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-slate-400 flex-1 truncate">{card.card_subtitle}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-full font-medium">
              {card.card_tag}
            </span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] text-slate-400">{mainTopic}</span>
          </div>
        </div>
      </div>

      {/* ── Body: main content + AI panel ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main content (scrollable) */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-2xl mx-auto px-6 py-8">
            {isInitialLoading && !initialContent ? (
              <Skeleton />
            ) : (
              <div className="[&>*:first-child]:mt-0">
                <MdContent>{mainContent}</MdContent>
                {!isInitialLoading && resources && (
                  <ResourcesBlock
                    resources={resources}
                    onFollowUp={(q) => {
                      setIsTutorOpen(true);
                      // small delay so panel opens first
                      setTimeout(() => setTutorQuestion(q), 50);
                    }}
                  />
                )}
              </div>
            )}
            <div className="h-8" />
          </div>
        </div>

        {/* AI Tutor Panel */}
        {isTutorOpen && (
          <AiTutorPanel
            card={card}
            mainTopic={mainTopic}
            onClose={() => setIsTutorOpen(false)}
            externalQuestion={tutorQuestion}
            onExternalHandled={() => setTutorQuestion(null)}
          />
        )}
      </div>
    </div>
  );
}
