import React, { useState, useRef } from 'react';
import {
  Plus, LayoutGrid, ChevronLeft, Menu,
  Sparkles, ArrowRight, RefreshCw, ArrowUpRight
} from 'lucide-react';
import GraphView from './components/GraphView';
import DetailPanel from './components/DetailPanel';
import { generateLearningPath, enrichNodeDescriptions } from './services/geminiService';
import { GraphData, Node, RecommendedTopic } from './types';
import { topicCategories, allTopics } from './data/topics';

interface HistoryItem {
  id: string;
  topic: string;
  timestamp: number;
  data: GraphData;
}

const groupDotColor: Record<string, string> = {
  Foundation: '#f59e0b',
  Core:       '#f59e0b',
  Advanced:   '#3b82f6',
  Practical:  '#a855f7',
  Related:    '#94a3b8',
};

const getGroupColorClass = (group: string) => {
  switch (group) {
    case 'Foundation': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Core': return 'bg-amber-200 text-amber-900 border-amber-300';
    case 'Advanced': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Practical': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  }
};

const suggestionSets = [
  [
    { title: 'React 性能优化', desc: '掌握 memo、useMemo、代码分割等核心优化技巧', query: 'React 性能优化' },
    { title: '机器学习基础', desc: '从监督学习到神经网络，系统构建 ML 知识体系', query: '机器学习基础' },
    { title: '高并发系统设计', desc: '构建支撑百万级 QPS 的后端系统架构设计', query: '高并发系统设计' },
    { title: '产品经理思维', desc: '从发现问题到 MVP 验证，锻造产品经理核心能力', query: '产品经理思维' },
    { title: 'Python 数据分析', desc: '用 Pandas 与 NumPy 挖掘数据背后的商业洞察', query: 'Python 数据分析' },
    { title: 'Web 渗透测试', desc: 'OWASP Top 10 漏洞原理、SQL 注入与防御实战', query: 'Web 渗透测试' },
  ],
  [
    { title: 'TypeScript 高级编程', desc: '类型体操、泛型与实用工具类型深度解析', query: 'TypeScript 高级编程' },
    { title: '大语言模型原理', desc: 'Transformer 架构、预训练与微调技术详解', query: '大语言模型原理' },
    { title: 'Kubernetes 运维', desc: '容器编排、服务发现与云原生应用部署', query: 'Kubernetes 架构与运维' },
    { title: '用户体验设计', desc: '以用户为中心的设计流程与可用性研究方法', query: '用户体验设计 UX' },
    { title: 'SQL 高级查询', desc: '窗口函数、CTE 与复杂查询性能优化技巧', query: 'SQL 高级查询优化' },
    { title: '密码学基础', desc: '对称加密、非对称加密与数字签名原理', query: '密码学基础' },
  ],
  [
    { title: 'RAG 应用开发', desc: '检索增强生成架构：向量数据库与检索策略', query: 'RAG 应用开发' },
    { title: 'Next.js 全栈开发', desc: 'App Router、服务端组件与全栈部署实践', query: 'Next.js 全栈开发' },
    { title: '微服务架构设计', desc: '服务拆分、治理与 API 网关核心设计模式', query: '微服务架构设计' },
    { title: '增长黑客', desc: 'AARRR 模型、北极星指标与用户增长策略', query: '增长黑客策略' },
    { title: '数据可视化', desc: 'D3.js、ECharts 与数据叙事设计原则', query: '数据可视化' },
    { title: '零信任安全架构', desc: '"永不信任，始终验证"的现代安全设计实践', query: '零信任架构' },
  ],
];

const quickChips = [
  { label: '🤖 AI 技术', query: '大语言模型原理' },
  { label: '💻 前端开发', query: 'React 进阶开发' },
  { label: '☁️ 后端架构', query: '高并发系统设计' },
  { label: '📊 数据科学', query: 'Python 数据分析' },
  { label: '🎨 产品设计', query: '用户体验设计' },
];

function App() {
  const [query, setQuery] = useState('');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTopic, setActiveTopic] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'learning-space' | 'graph'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNodeListOpen, setIsNodeListOpen] = useState(false);
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);
  const [isEnriching, setIsEnriching] = useState(false);
  const [streamNodeCount, setStreamNodeCount] = useState(0);
  const [streamLabels, setStreamLabels] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const processTopicGeneration = async (topicQuery: string) => {
    if (!topicQuery.trim()) return;
    setCurrentView('graph');
    setIsLoading(true);
    setError(null);
    setSelectedNode(null);
    setGraphData({ nodes: [], edges: [] });
    setActiveTopic(topicQuery);
    setQuery(topicQuery);
    setIsNodeListOpen(false);
    setStreamNodeCount(0);
    setStreamLabels([]);

    try {
      // Phase 1: 流式生成，实时反馈进度
      const data = await generateLearningPath(
        topicQuery,
        (count, labels) => {
          setStreamNodeCount(count);
          setStreamLabels(labels);
        }
      );
      setGraphData(data);
      setIsLoading(false);

      const newItem: HistoryItem = { id: Date.now().toString(), topic: topicQuery, timestamp: Date.now(), data };
      setHistory(prev => {
        const filtered = prev.filter(item => item.topic.toLowerCase() !== topicQuery.toLowerCase());
        return [newItem, ...filtered];
      });

      // Phase 2: 后台批量生成节点简介
      setIsEnriching(true);
      try {
        const descriptions = await enrichNodeDescriptions(
          data.nodes.map(n => ({ id: n.id, label: n.label })),
          topicQuery
        );
        setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => ({
            ...n,
            description: descriptions[n.id] || n.description,
          })),
        }));
      } catch {
        // 简介生成失败不影响主流程
      } finally {
        setIsEnriching(false);
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = '生成学习路径失败，请尝试其他主题或稍后再试。';
      const message = err?.message || '';
      if (message.includes('QUOTA_EXCEEDED') || message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'API 调用次数已达上限。请稍后再试或检查 API Key 配额。';
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    processTopicGeneration(query);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processTopicGeneration(query);
    }
  };

  const handleNewTopic = () => {
    setQuery('');
    setGraphData({ nodes: [], edges: [] });
    setSelectedNode(null);
    setError(null);
    setActiveTopic('');
    setCurrentView('home');
    setIsNodeListOpen(false);
  };

  const handleRecommendedClick = (rec: RecommendedTopic) => {
    processTopicGeneration(rec.query);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setCurrentView('graph');
    setGraphData(item.data);
    setActiveTopic(item.topic);
    setQuery(item.topic);
    setSelectedNode(null);
    setError(null);
    setIsNodeListOpen(false);
  };

  const currentSuggestions = suggestionSets[suggestionSetIndex];

  return (
    <div className="flex h-screen w-screen bg-zinc-50 text-zinc-800 font-sans overflow-hidden">

      {/* ── UNIFIED LEFT PANEL ── */}
      <aside className={`flex-shrink-0 bg-white border-r border-zinc-100 z-30 transition-[width] duration-300 ease-in-out overflow-hidden ${
        currentView === 'graph' || isSidebarOpen ? 'w-64' : 'w-0'
      }`}>
        <div className="w-64 h-full relative">

          {/* ── Home / Learning-space sidebar ── */}
          {currentView !== 'graph' && (
            <div className="absolute inset-0 flex flex-col animate-panel-in">

              {/* Brand header */}
              <div className="h-14 px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src="/icon.png" alt="icon" className="w-7 h-7 object-contain" />
                  <span className="text-sm font-semibold text-zinc-800 tracking-tight">KnowledgePath</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Nav */}
              <div className="px-3 pt-3 pb-2 space-y-0.5 flex-shrink-0">
                <button
                  onClick={handleNewTopic}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    currentView === 'home'
                      ? 'bg-zinc-100 text-zinc-800 font-medium'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>新主题</span>
                </button>
                <button
                  onClick={() => setCurrentView('learning-space')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    currentView === 'learning-space'
                      ? 'bg-zinc-100 text-zinc-800 font-medium'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>探索空间</span>
                </button>
              </div>

              <div className="px-3 flex-shrink-0">
                <div className="h-px bg-zinc-100" />
              </div>

              {/* History */}
              <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
                <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest px-2 mb-2">历史记录</p>
                {history.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-zinc-300">暂无记录</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all truncate text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                      >
                        {item.topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-100 flex-shrink-0">
                <p className="text-[10px] text-zinc-300 text-center">Powered by DeepSeek</p>
              </div>
            </div>
          )}

          {/* ── Graph view left panel ── */}
          {currentView === 'graph' && (
            <div className="absolute inset-0 flex flex-col animate-panel-in">

              {/* Brand / Back header */}
              <div className="h-14 px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={handleNewTopic}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-xs font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>返回</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <img src="/icon.png" alt="icon" className="w-6 h-6 object-contain" />
                  <span className="text-xs font-semibold text-zinc-700 tracking-tight">KnowledgePath</span>
                </div>
              </div>

              {/* Topic info card */}
              {activeTopic && (
                <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex-shrink-0">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">当前主题</p>
                  <p className="text-sm font-semibold text-zinc-800 leading-snug">{activeTopic}</p>
                  {!isLoading && graphData.nodes.length > 0 && (
                    <p className="text-[10px] text-zinc-400 mt-1">{graphData.nodes.length} 个知识节点</p>
                  )}
                  {isLoading && streamNodeCount > 0 && (
                    <p className="text-[10px] text-amber-500 mt-1">已发现 {streamNodeCount} 个...</p>
                  )}
                </div>
              )}

              {/* Section header */}
              <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">知识节点</p>
                {isEnriching && (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 rounded-full border-t-transparent animate-spin flex-shrink-0" />
                )}
              </div>

              {/* Loading: streaming labels */}
              {isLoading && (
                <div className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
                  {streamLabels.length === 0
                    ? [...Array(7)].map((_, i) => (
                        <div key={i} className="h-9 rounded-xl bg-zinc-50 animate-pulse"
                          style={{ animationDelay: `${i * 70}ms`, opacity: 1 - i * 0.1 }} />
                      ))
                    : streamLabels.map((label, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-50 animate-fade-in">
                          <div className="w-4 h-4 rounded-full bg-zinc-200 flex-shrink-0 animate-pulse" />
                          <span className="text-xs text-zinc-400 truncate">{label}</span>
                        </div>
                      ))
                  }
                </div>
              )}

              {/* Loaded: real node list */}
              {!isLoading && graphData.nodes.length > 0 && (
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                  {[...graphData.nodes].sort((a, b) => a.orderId - b.orderId).map((node, i) => {
                    const dot = groupDotColor[node.group] || '#94a3b8';
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs mb-0.5 transition-all flex items-center gap-2.5 animate-fade-in ${
                          isSelected ? 'bg-amber-50' : 'hover:bg-zinc-50'
                        }`}
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: dot }}
                        >
                          {node.orderId}
                        </span>
                        <span className={`flex-1 min-w-0 truncate font-medium ${isSelected ? 'text-amber-700' : 'text-zinc-600'}`}>
                          {node.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* History at bottom */}
              {!isLoading && history.length > 0 && (
                <div className="border-t border-zinc-100 p-2 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest px-2 mb-1.5">历史记录</p>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {history.map(item => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all truncate ${
                          activeTopic === item.topic
                            ? 'text-amber-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {item.topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-100 flex-shrink-0">
                <p className="text-[10px] text-zinc-300 text-center">Powered by DeepSeek</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 relative h-full flex flex-col overflow-hidden">

        {/* Sidebar open button */}
        {!isSidebarOpen && currentView !== 'graph' && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-3.5 left-4 z-40 w-9 h-9 bg-white rounded-lg shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* ── HOME VIEW ── */}
        {currentView === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f5f5f0] overflow-y-auto">
            <div className="w-full max-w-2xl flex flex-col items-center gap-6 -mt-6">

              {/* Title */}
              <div className="text-center flex flex-col items-center gap-3">
                <img src="/icon.png" alt="icon" className="w-16 h-16 object-contain drop-shadow-md" />
                <h1 className="text-[2rem] font-bold text-zinc-800 leading-tight tracking-tight">
                  准备开始了吗
                </h1>
                <p className="text-zinc-400 text-sm -mt-1">输入任意主题，AI 即刻生成可视化知识学习路径</p>
              </div>

              {/* Input box */}
              <div className="w-full bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <form onSubmit={handleSearch}>
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); adjustTextareaHeight(); }}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={`从任何想法开始...\n例如「React 性能优化」或「机器学习基础」`}
                    className="w-full px-5 pt-4 pb-2 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none resize-none bg-transparent leading-relaxed"
                    style={{ minHeight: '88px' }}
                    autoFocus
                  />
                  <div className="px-4 pb-3.5 flex items-center justify-between">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      title="AI 建议"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-300 hidden sm:block">Enter 发送 · Shift+Enter 换行</span>
                      <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="w-8 h-8 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {quickChips.map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => processTopicGeneration(chip.query)}
                    className="px-3 py-1.5 bg-white rounded-full text-xs text-zinc-500 border border-zinc-100 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Suggestions */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">试试这些例子</span>
                  </div>
                  <button
                    onClick={() => setSuggestionSetIndex(i => (i + 1) % suggestionSets.length)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-2 py-1 rounded-md hover:bg-white"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>换一换</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => processTopicGeneration(sug.query)}
                      className="text-left p-4 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 leading-snug">
                            {sug.title}
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                            {sug.desc}
                          </div>
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

        {/* ── LEARNING SPACE VIEW ── */}
        {currentView === 'learning-space' && (
          <div className="flex-1 overflow-y-auto bg-[#f5f5f0] animate-fade-in">
            <div className="max-w-5xl mx-auto px-8 py-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-amber-500" />
                  探索空间
                </h2>
                <p className="text-zinc-400 text-sm mt-1">精选各领域学习路径，点击即可开始探索</p>
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {topicCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-white text-zinc-500 border border-zinc-100 hover:border-zinc-200 hover:text-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(allTopics[selectedCategory] || []).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleRecommendedClick(item)}
                    className="text-left p-4 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all group"
                  >
                    <div className="text-xl mb-3">{item.icon}</div>
                    <h3 className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 line-clamp-2 leading-snug">
                      {item.label}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GRAPH VIEW ── */}
        {currentView === 'graph' && (
          <div className="flex-1 relative overflow-hidden animate-graph-enter">

            {/* Error notification */}
            {error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white border border-zinc-100 p-4 rounded-xl shadow-lg max-w-sm w-full mx-4 flex items-start animate-fade-in-down">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-red-500">生成出错</h3>
                  <p className="text-xs text-zinc-400 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-3 text-zinc-300 hover:text-zinc-500 text-lg leading-none transition-colors">×</button>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin" />
                </div>
              </div>
            )}

            {/* Enriching indicator */}
            {!isLoading && isEnriching && (
              <div className="absolute bottom-6 right-6 z-10 bg-white/90 backdrop-blur px-3.5 py-2 rounded-full shadow-sm border border-zinc-100 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-amber-400 rounded-full border-t-transparent animate-spin" />
                <p className="text-xs text-zinc-400">补全节点简介中...</p>
              </div>
            )}

            <GraphView
              data={graphData}
              onNodeClick={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id}
            />

            {selectedNode && (
              <DetailPanel
                node={selectedNode}
                mainTopic={activeTopic}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
