import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, LayoutGrid, ChevronLeft, Menu,
  Sparkles, ArrowRight, RefreshCw, ArrowUpRight, Wand2, User, X, BookOpen,
} from 'lucide-react';
import PathView from './components/PathView';
import CardDetailPanel from './components/CardDetailPanel';
import VersionBar from './components/VersionBar';
import PersonaCard from './components/PersonaCard';
import MyLearningView from './components/MyLearningView';
import { generatePath, generateIteration, parsePersona } from './services/geminiService';
import { loadVersions, saveNewVersion, toggleStar } from './services/versionService';
import { loadMyLearning, addToMyLearning, removeFromMyLearning } from './services/myLearningService';
import { LearningPath, Card, RecommendedTopic, PathVersion, Persona, MyLearningItem } from './types';
import { topicCategories, allTopics } from './data/topics';

interface HistoryItem {
  id: string;
  topic: string;
  timestamp: number;
  data: LearningPath;
}

const suggestionSets = [
  [
    { title: 'Prompt Engineering', desc: '从零掌握提示词结构、角色设定与 Chain-of-Thought 推理技巧', query: 'Prompt Engineering 提示词工程' },
    { title: 'AI Agent 开发', desc: '构建能自主规划、调用工具、完成复杂任务的智能体系统', query: 'AI Agent 开发' },
    { title: 'RAG 应用开发', desc: '检索增强生成：向量数据库、分块策略与召回优化实战', query: 'RAG 检索增强生成应用开发' },
    { title: '大语言模型原理', desc: 'Transformer 架构、注意力机制与预训练技术深度解析', query: '大语言模型原理' },
    { title: 'Function Calling 实战', desc: '让 LLM 调用外部 API 和工具，打通 AI 与真实世界的接口', query: 'LLM Function Calling 工具调用' },
    { title: 'LangChain 框架开发', desc: 'Chain、Memory、Agent 全套组件，快速构建 LLM 应用', query: 'LangChain 框架开发实战' },
  ],
  [
    { title: 'MCP 协议与工具集成', desc: 'Model Context Protocol：让 AI 安全访问本地与远程资源', query: 'MCP Model Context Protocol 工具集成' },
    { title: 'Multi-Agent 系统设计', desc: '多智能体协作、任务分解与 AutoGen / CrewAI 框架实践', query: 'Multi-Agent 多智能体系统设计' },
    { title: '向量数据库与语义检索', desc: 'Embedding 原理、相似度搜索与 Pinecone / Qdrant 选型指南', query: '向量数据库与语义检索' },
    { title: 'AI 工作流自动化', desc: 'Dify / n8n / Coze 搭建无代码 AI 流水线，释放生产力', query: 'AI 工作流自动化' },
    { title: '模型微调 Fine-tuning', desc: 'LoRA、QLoRA 与 SFT 全流程：让模型专注你的业务场景', query: 'LLM 模型微调 Fine-tuning LoRA' },
    { title: 'AI 编程助手开发', desc: '基于 LSP 与 LLM 打造代码补全、解释与重构智能助手', query: 'AI 编程助手开发' },
  ],
  [
    { title: 'Skill Agent 构建', desc: '设计具备技能调度能力的 AI Agent，实现专业领域自动化', query: 'Skill Agent 技能智能体构建' },
    { title: '多模态 AI 应用', desc: '图文理解、视觉问答与跨模态生成技术开发实战', query: '多模态 AI 应用开发' },
    { title: 'AI 安全与对齐', desc: 'RLHF、Constitutional AI 与 Red Teaming 核心方法论', query: 'AI 安全与对齐技术' },
    { title: 'AI 产品设计', desc: '从用户意图到交互范式，设计以 AI 为核心的产品体验', query: 'AI 产品设计方法论' },
    { title: '扩散模型与图像生成', desc: 'Stable Diffusion 原理、ControlNet 与 LoRA 风格定制', query: '扩散模型与 AI 图像生成' },
    { title: 'AI 评估与测试', desc: 'Benchmark 设计、幻觉检测与 LLM 应用质量保障体系', query: 'LLM AI 评估与测试' },
  ],
];

const quickChips = [
  { label: '🤖 AI Agent', query: 'AI Agent 开发' },
  { label: '✍️ Prompt 工程', query: 'Prompt Engineering 提示词工程' },
  { label: '🔗 RAG 应用', query: 'RAG 检索增强生成应用开发' },
  { label: '🛠️ MCP 协议', query: 'MCP Model Context Protocol 工具集成' },
  { label: '🧬 模型微调', query: 'LLM 模型微调 Fine-tuning LoRA' },
];

// ── URL hash helpers ──────────────────────────────────────────────────────────

function setUrlHash(topic: string, version: number) {
  const params = new URLSearchParams({ topic, v: String(version) });
  window.history.replaceState(null, '', `#${params.toString()}`);
}

function clearUrlHash() {
  window.history.replaceState(null, '', window.location.pathname);
}

function parseUrlHash(): { topic: string; version: number } | null {
  try {
    const hash = window.location.hash;
    if (!hash || hash === '#') return null;
    const params = new URLSearchParams(hash.slice(1));
    const topic = params.get('topic');
    const version = parseInt(params.get('v') || '0', 10);
    if (topic && version > 0) return { topic, version };
  } catch { /* ignore */ }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [query, setQuery] = useState('');
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeTopic, setActiveTopic] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'learning-space' | 'path' | 'my-learning'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);

  // Version management state
  const [versions, setVersions] = useState<PathVersion[]>([]);
  const [currentVersionNum, setCurrentVersionNum] = useState(1);

  // Iteration input state
  const [iterationNote, setIterationNote] = useState('');
  const [isIterating, setIsIterating] = useState(false);

  // My Learning state
  const [myLearningItems, setMyLearningItems] = useState<MyLearningItem[]>(() => loadMyLearning());

  // Persona state
  const [contextText, setContextText] = useState('');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isParsingPersona, setIsParsingPersona] = useState(false);
  const [pathPersonaOpen, setPathPersonaOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iterationRef = useRef<HTMLTextAreaElement>(null);
  const personaAbortRef = useRef<AbortController | null>(null);

  // ── Load from URL hash on mount ───────────────────────────────────────────
  useEffect(() => {
    const parsed = parseUrlHash();
    if (!parsed) return;
    const storedVersions = loadVersions(parsed.topic);
    const target = storedVersions.find((v) => v.version === parsed.version);
    if (target) {
      setActiveTopic(parsed.topic);
      setQuery(parsed.topic);
      setVersions(storedVersions);
      setCurrentVersionNum(parsed.version);
      setLearningPath(target.path);
      setCurrentView('path');
    }
  }, []);

  // ── Persona parsing ───────────────────────────────────────────────────────
  const handleContextBlur = async () => {
    const text = contextText.trim();
    if (!text) { setPersona(null); return; }

    personaAbortRef.current?.abort();
    const ctrl = new AbortController();
    personaAbortRef.current = ctrl;
    setIsParsingPersona(true);

    try {
      const parsed = await parsePersona(text, ctrl.signal);
      setPersona(parsed);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Persona parse failed:', err);
    } finally {
      setIsParsingPersona(false);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // ── Fresh path generation ─────────────────────────────────────────────────
  const processTopicGeneration = async (topicQuery: string) => {
    if (!topicQuery.trim()) return;
    setCurrentView('path');
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setSelectedCard(null);
    setLearningPath(null);
    setActiveTopic(topicQuery);
    setQuery(topicQuery);
    setIterationNote('');

    // Load existing versions for this topic (don't reset — append as next version)
    const existingVersions = loadVersions(topicQuery);
    setVersions(existingVersions);

    const partial: LearningPath = {
      topic: topicQuery, summary: '', estimated_hours: '',
      phases: [], tip: { recommended_start_card_id: '', tip_text: '' },
    };

    try {
      const path = await generatePath(topicQuery, {
        persona,
        onHeader: (header) => {
          Object.assign(partial, header);
          setLearningPath({ ...partial });
        },
        onPhase: (phase) => {
          partial.phases.push(phase);
          setLearningPath({ ...partial });
          setIsLoading(false);
        },
      });

      setLearningPath(path);

      const updatedVersions = saveNewVersion(topicQuery, path);
      setVersions(updatedVersions);
      setCurrentVersionNum(updatedVersions.length);
      setUrlHash(topicQuery, updatedVersions.length);

      const newItem: HistoryItem = { id: Date.now().toString(), topic: topicQuery, timestamp: Date.now(), data: path };
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.topic.toLowerCase() !== topicQuery.toLowerCase());
        return [newItem, ...filtered];
      });
    } catch (err: any) {
      console.error(err);
      let errorMessage = '生成学习路径失败，请尝试其他主题或稍后再试。';
      const message = err?.message || '';
      if (message.includes('QUOTA_EXCEEDED') || message.includes('429')) {
        errorMessage = 'API 调用次数已达上限。请稍后再试或检查 API Key 配额。';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // ── Iteration generation ──────────────────────────────────────────────────
  const handleIterate = async () => {
    const note = iterationNote.trim();
    if (!note || !learningPath || isIterating || isStreaming) return;

    const previousPath = learningPath;
    setIsIterating(true);
    setIsLoading(true);
    setIsStreaming(true);
    setSelectedCard(null);
    setError(null);
    setLearningPath(null);
    setIterationNote('');

    const partial: LearningPath = {
      topic: activeTopic, summary: '', estimated_hours: '',
      phases: [], tip: { recommended_start_card_id: '', tip_text: '' },
    };

    try {
      const newPath = await generateIteration(activeTopic, previousPath, note, {
        persona,
        onHeader: (header) => {
          Object.assign(partial, header);
          setLearningPath({ ...partial });
        },
        onPhase: (phase) => {
          partial.phases.push(phase);
          setLearningPath({ ...partial });
          setIsLoading(false);
        },
      });

      setLearningPath(newPath);

      const updatedVersions = saveNewVersion(activeTopic, newPath, note);
      setVersions(updatedVersions);
      setCurrentVersionNum(updatedVersions.length);
      setUrlHash(activeTopic, updatedVersions.length);

      const newItem: HistoryItem = { id: Date.now().toString(), topic: activeTopic, timestamp: Date.now(), data: newPath };
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.topic.toLowerCase() !== activeTopic.toLowerCase());
        return [newItem, ...filtered];
      });
    } catch (err: any) {
      console.error(err);
      setLearningPath(previousPath); // revert to previous on error
      let errorMessage = '迭代生成失败，已恢复上一版本。';
      const message = err?.message || '';
      if (message.includes('QUOTA_EXCEEDED') || message.includes('429')) {
        errorMessage = 'API 调用次数已达上限。请稍后再试。';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setIsIterating(false);
    }
  };

  // ── Version switching ─────────────────────────────────────────────────────
  const handleVersionSwitch = (versionNum: number) => {
    const target = versions.find((v) => v.version === versionNum);
    if (!target) return;
    setCurrentVersionNum(versionNum);
    setLearningPath(target.path);
    setSelectedCard(null);
    setUrlHash(activeTopic, versionNum);
  };

  const handleToggleStar = (versionNum: number) => {
    const updatedVersions = toggleStar(activeTopic, versionNum);
    setVersions(updatedVersions);
  };

  // ── My Learning ───────────────────────────────────────────────────────────
  const isCurrentTopicSaved = myLearningItems.some((i) => i.topic === activeTopic);

  const handleToggleMyLearning = () => {
    const updated = isCurrentTopicSaved
      ? removeFromMyLearning(activeTopic)
      : addToMyLearning(activeTopic);
    setMyLearningItems(updated);
  };

  const handleRemoveFromMyLearning = (topic: string) => {
    setMyLearningItems(removeFromMyLearning(topic));
  };

  const handleNavigateToMyLearningTopic = (topic: string) => {
    const storedVersions = loadVersions(topic);
    if (storedVersions.length > 0) {
      const latest = storedVersions[storedVersions.length - 1];
      setActiveTopic(topic);
      setQuery(topic);
      setVersions(storedVersions);
      setCurrentVersionNum(latest.version);
      setLearningPath(latest.path);
      setCurrentView('path');
      setSelectedCard(null);
      setError(null);
      setIterationNote('');
      setUrlHash(topic, latest.version);
      const newItem: HistoryItem = { id: Date.now().toString(), topic, timestamp: Date.now(), data: latest.path };
      setHistory((prev) => {
        const filtered = prev.filter((i) => i.topic.toLowerCase() !== topic.toLowerCase());
        return [newItem, ...filtered];
      });
    } else {
      processTopicGeneration(topic);
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); processTopicGeneration(query); };
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processTopicGeneration(query); }
  };
  const handleIterationKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIterate(); }
  };

  const handleNewTopic = () => {
    setQuery(''); setLearningPath(null); setSelectedCard(null);
    setError(null); setActiveTopic(''); setCurrentView('home');
    setIsLoading(false); setIsStreaming(false);
    setVersions([]); setCurrentVersionNum(1); setIterationNote('');
    clearUrlHash();
  };

  const loadHistoryItem = (item: HistoryItem) => {
    const storedVersions = loadVersions(item.topic);
    const latestVersion = storedVersions.length > 0 ? storedVersions[storedVersions.length - 1] : null;
    setCurrentView('path');
    setLearningPath(latestVersion?.path ?? item.data);
    setActiveTopic(item.topic);
    setQuery(item.topic);
    setSelectedCard(null);
    setError(null);
    setVersions(storedVersions);
    setCurrentVersionNum(latestVersion?.version ?? 1);
    setIterationNote('');
    if (latestVersion) {
      setUrlHash(item.topic, latestVersion.version);
    }
  };

  const currentSuggestions = suggestionSets[suggestionSetIndex];
  const allCards = learningPath?.phases.flatMap((p) => p.cards) ?? [];

  return (
    <div className="flex h-screen w-screen bg-zinc-50 text-zinc-800 font-sans overflow-hidden">

      {/* ── LEFT SIDEBAR ── */}
      <aside className={`flex-shrink-0 bg-white border-r border-zinc-100 z-30 transition-[width] duration-300 ease-in-out overflow-hidden ${
        currentView === 'path' || isSidebarOpen ? 'w-64' : 'w-0'
      }`}>
        <div className="w-64 h-full relative">

          {currentView !== 'path' && (
            <div className="absolute inset-0 flex flex-col animate-panel-in">
              <div className="h-14 px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src="/icon.png" alt="icon" className="w-7 h-7 object-contain" />
                  <span className="text-sm font-semibold text-zinc-800 tracking-tight">KnowledgePath</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="px-3 pt-3 pb-2 space-y-0.5 flex-shrink-0">
                <button onClick={handleNewTopic} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${currentView === 'home' ? 'bg-zinc-100 text-zinc-800 font-medium' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
                  <Plus className="w-4 h-4" /><span>新主题</span>
                </button>
                <button onClick={() => setCurrentView('learning-space')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${currentView === 'learning-space' ? 'bg-zinc-100 text-zinc-800 font-medium' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
                  <LayoutGrid className="w-4 h-4" /><span>探索空间</span>
                </button>
                <button onClick={() => setCurrentView('my-learning')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${currentView === 'my-learning' ? 'bg-zinc-100 text-zinc-800 font-medium' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
                  <BookOpen className="w-4 h-4" />
                  <span>我的学习</span>
                  {myLearningItems.length > 0 && (
                    <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full leading-none">
                      {myLearningItems.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="px-3 flex-shrink-0"><div className="h-px bg-zinc-100" /></div>
              <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
                <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest px-2 mb-2">历史记录</p>
                {history.length === 0 ? (
                  <div className="py-8 text-center"><p className="text-xs text-zinc-300">暂无记录</p></div>
                ) : (
                  <div className="space-y-0.5">
                    {history.map((item) => (
                      <button key={item.id} onClick={() => loadHistoryItem(item)} className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all truncate text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800">
                        {item.topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-zinc-100 flex-shrink-0">
                <p className="text-[10px] text-zinc-300 text-center">Powered by DeepSeek</p>
              </div>
            </div>
          )}

          {currentView === 'path' && (
            <div className="absolute inset-0 flex flex-col animate-panel-in">
              <div className="h-14 px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
                <button onClick={handleNewTopic} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-xs font-medium">
                  <ChevronLeft className="w-4 h-4" /><span>返回</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <img src="/icon.png" alt="icon" className="w-6 h-6 object-contain" />
                  <span className="text-xs font-semibold text-zinc-700 tracking-tight">KnowledgePath</span>
                </div>
              </div>

              {activeTopic && (
                <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex-shrink-0">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">当前主题</p>
                  <p className="text-sm font-semibold text-zinc-800 leading-snug">{activeTopic}</p>
                  {!isLoading && learningPath && (
                    <p className="text-[10px] text-zinc-400 mt-1">{allCards.length} 张学习卡片 · v{currentVersionNum}</p>
                  )}
                </div>
              )}

              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">学习卡片</p>
              </div>

              {isLoading ? (
                <div className="flex-1 px-3 space-y-1.5">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-9 rounded-xl bg-zinc-50 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                  {allCards.map((card, i) => (
                    <button
                      key={card.card_id}
                      onClick={() => setSelectedCard(card)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs mb-0.5 transition-all flex items-center gap-2.5 animate-fade-in ${selectedCard?.card_id === card.card_id ? 'bg-amber-50' : 'hover:bg-zinc-50'}`}
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <span className="text-sm flex-shrink-0">{card.icon}</span>
                      <span className={`flex-1 min-w-0 truncate font-medium ${selectedCard?.card_id === card.card_id ? 'text-amber-700' : 'text-zinc-600'}`}>
                        {card.card_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!isLoading && history.length > 0 && (
                <div className="border-t border-zinc-100 p-2 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest px-2 mb-1.5">历史记录</p>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {history.map((item) => (
                      <button key={item.id} onClick={() => loadHistoryItem(item)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all truncate ${activeTopic === item.topic ? 'text-amber-700 font-medium' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'}`}>
                        {item.topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 py-3 border-t border-zinc-100 flex-shrink-0">
                <p className="text-[10px] text-zinc-300 text-center">Powered by DeepSeek</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 relative h-full flex flex-col overflow-hidden">

        {!isSidebarOpen && currentView !== 'path' && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-3.5 left-4 z-40 w-9 h-9 bg-white rounded-lg shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors">
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* ── HOME ── */}
        {currentView === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f5f5f0] overflow-y-auto">
            <div className="w-full max-w-2xl flex flex-col items-center gap-6 -mt-6">
              <div className="text-center flex flex-col items-center gap-3">
                <img src="/icon.png" alt="icon" className="w-16 h-16 object-contain drop-shadow-md" />
                <h1 className="text-[2rem] font-bold text-zinc-800 leading-tight tracking-tight">准备开始了吗</h1>
                <p className="text-zinc-400 text-sm -mt-1">输入任意主题，AI 即刻生成可视化知识学习路径</p>
              </div>

              <div className="form-glow-wrapper w-full">
              <div className="relative z-[1] w-full bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <form onSubmit={handleSearch}>
                  <textarea ref={textareaRef} value={query}
                    onChange={(e) => { setQuery(e.target.value); adjustTextareaHeight(); }}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={`从任何想法开始...\n例如「React 性能优化」或「机器学习基础」`}
                    className="w-full px-5 pt-4 pb-2 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none resize-none bg-transparent leading-relaxed"
                    style={{ minHeight: '88px' }} autoFocus
                  />
                  {/* 关于你 — context / persona input */}
                  <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-50">
                    <User className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
                    <input
                      type="text"
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      onBlur={handleContextBlur}
                      placeholder="关于你（可选）：职业、经验背景、学这个的目的，用自己的话说就行"
                      className="flex-1 text-[12px] text-zinc-600 placeholder-zinc-300 focus:outline-none bg-transparent"
                    />
                    {isParsingPersona && (
                      <div className="flex gap-1 flex-shrink-0">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1 h-1 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-3.5 flex items-center justify-between">
                    <button type="button" className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-300 hidden sm:block">Enter 发送 · Shift+Enter 换行</span>
                      <button type="submit" disabled={!query.trim() || isLoading} className="w-8 h-8 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              </div>

              {/* PersonaCard — shown after persona is parsed */}
              {(isParsingPersona || persona) && (
                <div className="w-full">
                  <PersonaCard
                    persona={persona}
                    isLoading={isParsingPersona}
                    onPersonaChange={setPersona}
                  />
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                {quickChips.map((chip) => (
                  <button key={chip.label} onClick={() => processTopicGeneration(chip.query)} className="px-3 py-1.5 bg-white rounded-full text-xs text-zinc-500 border border-zinc-100 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm">
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">试试这些例子</span>
                  </div>
                  <button onClick={() => setSuggestionSetIndex((i) => (i + 1) % suggestionSets.length)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-2 py-1 rounded-md hover:bg-white">
                    <RefreshCw className="w-3 h-3" /><span>换一换</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentSuggestions.map((sug, idx) => (
                    <button key={idx} onClick={() => processTopicGeneration(sug.query)} className="text-left p-4 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 leading-snug">{sug.title}</div>
                          <div className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">{sug.desc}</div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-200 group-hover:text-zinc-400 flex-shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LEARNING SPACE ── */}
        {currentView === 'learning-space' && (
          <div className="flex-1 overflow-y-auto bg-[#f5f5f0] animate-fade-in">
            <div className="max-w-5xl mx-auto px-8 py-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-amber-500" />探索空间
                </h2>
                <p className="text-zinc-400 text-sm mt-1">精选各领域学习路径，点击即可开始探索</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {topicCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500 border border-zinc-100 hover:border-zinc-200 hover:text-zinc-700'}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(allTopics[selectedCategory] || []).map((item: RecommendedTopic) => (
                  <button key={item.id} onClick={() => processTopicGeneration(item.query)} className="text-left p-4 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all group">
                    <div className="text-xl mb-3">{item.icon}</div>
                    <h3 className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 line-clamp-2 leading-snug">{item.label}</h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MY LEARNING ── */}
        {currentView === 'my-learning' && (
          <MyLearningView
            items={myLearningItems}
            onNavigate={handleNavigateToMyLearningTopic}
            onRemove={handleRemoveFromMyLearning}
          />
        )}

        {/* ── PATH VIEW ── */}
        {currentView === 'path' && (
          <div className="flex-1 relative flex flex-col overflow-hidden animate-graph-enter">

            {/* Error banner */}
            {error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white border border-zinc-100 p-4 rounded-xl shadow-lg max-w-sm w-full mx-4 flex items-start animate-fade-in-down">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-red-500">生成出错</h3>
                  <p className="text-xs text-zinc-400 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-3 text-zinc-300 hover:text-zinc-500 text-lg leading-none transition-colors">×</button>
              </div>
            )}

            {/* Persona overlay — floats top-right when tag is clicked */}
            {pathPersonaOpen && persona && (
              <div className="absolute top-3 right-4 z-30 w-80 animate-fade-in-down">
                <div className="relative shadow-xl rounded-2xl">
                  <button
                    onClick={() => setPathPersonaOpen(false)}
                    className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <PersonaCard
                    persona={persona}
                    isLoading={false}
                    onPersonaChange={setPersona}
                  />
                </div>
              </div>
            )}

            {/* Full-screen loading spinner */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f5f5f0]">
                <div className="relative w-10 h-10 mb-4">
                  <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-zinc-400">
                  {isIterating ? `正在优化「${activeTopic}」路径...` : `正在为「${activeTopic}」设计学习路径...`}
                </p>
              </div>
            )}

            {/* Version bar — show when path is ready and we have versions */}
            {!isLoading && learningPath && versions.length > 0 && (
              <VersionBar
                versions={versions}
                currentVersion={currentVersionNum}
                activeTopic={activeTopic}
                onSwitch={handleVersionSwitch}
                onToggleStar={handleToggleStar}
              />
            )}

            {/* Path content */}
            {!isLoading && learningPath && (
              <>
                <PathView
                  path={learningPath}
                  selectedCardId={selectedCard?.card_id}
                  onCardClick={setSelectedCard}
                  isStreaming={isStreaming}
                  persona={persona}
                  onPersonaTagClick={() => setPathPersonaOpen(true)}
                  isInMyLearning={isCurrentTopicSaved}
                  onToggleMyLearning={handleToggleMyLearning}
                />

                {/* ── Iteration input bar ── */}
                {!isStreaming && (
                  <div className="flex-shrink-0 border-t border-zinc-100 bg-white px-4 py-3">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 focus-within:border-amber-300 focus-within:bg-white transition-all">
                        <Wand2 className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
                        <textarea
                          ref={iterationRef}
                          value={iterationNote}
                          onChange={(e) => {
                            setIterationNote(e.target.value);
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
                          }}
                          onKeyDown={handleIterationKeyDown}
                          placeholder="告诉 AI 哪里不够好，例如：太理论了，想要更多实战内容"
                          className="flex-1 bg-transparent text-[13px] text-zinc-700 placeholder-zinc-300 resize-none focus:outline-none leading-relaxed"
                          rows={1}
                        />
                        <button
                          onClick={handleIterate}
                          disabled={!iterationNote.trim() || isIterating}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed rounded-xl text-white text-[12px] font-medium transition-colors flex-shrink-0"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>优化路径</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-300 text-center mt-1.5">
                        Enter 发送 · 将生成 v{versions.length + 1}，当前版本 v{currentVersionNum} 自动保存
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Backdrop + card detail panel */}
            {selectedCard && (
              <>
                <div
                  className="absolute inset-0 z-40 animate-backdrop-in"
                  style={{ background: 'rgba(15,15,20,0.06)' }}
                  onClick={() => setSelectedCard(null)}
                />
                <CardDetailPanel
                  card={selectedCard}
                  mainTopic={activeTopic}
                  onClose={() => setSelectedCard(null)}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
