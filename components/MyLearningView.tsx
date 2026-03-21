import React from 'react';
import { BookOpen, Clock, Trash2, ArrowRight, Layers } from 'lucide-react';
import { MyLearningItem } from '../types';
import { loadVersions } from '../services/versionService';

interface MyLearningViewProps {
  items: MyLearningItem[];
  onNavigate: (topic: string) => void;
  onRemove: (topic: string) => void;
}

export default function MyLearningView({ items, onNavigate, onRemove }: MyLearningViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f0] p-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-4 shadow-sm">
          <BookOpen className="w-7 h-7 text-zinc-200" />
        </div>
        <h3 className="text-base font-semibold text-zinc-400 mb-1.5">还没有学习计划</h3>
        <p className="text-sm text-zinc-300 text-center leading-relaxed">
          在知识路径页面点击「加入我的学习」<br />即可收藏感兴趣的主题
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f5f0] animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-zinc-800">我的学习</h2>
          </div>
          <span className="text-sm text-zinc-400">{items.length} 个主题</span>
        </div>

        {/* Topic list */}
        <div className="space-y-2.5">
          {items.map((item) => {
            const versions = loadVersions(item.topic);
            const latest = versions[versions.length - 1];
            const cardCount = latest?.path.phases.flatMap((p) => p.cards).length ?? 0;

            return (
              <div
                key={item.topic}
                className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex items-center gap-4 hover:border-zinc-200 hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-800 mb-1 truncate">{item.topic}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    {latest && (
                      <>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Clock className="w-3 h-3" />
                          {latest.path.estimated_hours}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Layers className="w-3 h-3" />
                          {cardCount} 张卡片 · v{latest.version}
                        </span>
                      </>
                    )}
                    <span className="text-[11px] text-zinc-300">
                      {new Date(item.addedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 加入
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onRemove(item.topic)}
                    className="p-1.5 text-zinc-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="移除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate(item.topic)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    <span>继续学习</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
