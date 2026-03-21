import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Persona } from '../types';

interface PersonaCardProps {
  persona: Persona | null;
  isLoading: boolean;
  onPersonaChange: (p: Persona) => void;
}

const PROFESSIONS = ['设计师', '工程师', '产品经理', '学生', '其他'];

const TECH_LEVELS: { label: string; value: Persona['tech_level'] }[] = [
  { label: '入门（无技术背景）', value: 'low' },
  { label: '中级（有编程经验）', value: 'mid' },
  { label: '高级（技术专家）', value: 'high' },
];

const GOALS = ['工具使用', '原理理解', '职业转型', '团队应用'];

const TECH_LEVEL_LABELS: Record<string, string> = {
  low: '入门',
  mid: '中级',
  high: '高级',
};

export default function PersonaCard({ persona, isLoading, onPersonaChange }: PersonaCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full bg-white border border-zinc-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm animate-fade-in">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
        <span className="text-[12px] text-zinc-400">正在分析你的背景...</span>
      </div>
    );
  }

  if (!persona) return null;

  return (
    <div className="w-full bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in">

      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">AI 对你的理解</span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditOpen(!isEditOpen)}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <span>不对？编辑</span>
          {isEditOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Summary pills */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-[12px] text-zinc-600">
          <span className="text-zinc-400">职业：</span>{persona.profession}
        </span>
        <span className="text-[12px] text-zinc-600">
          <span className="text-zinc-400">水平：</span>{TECH_LEVEL_LABELS[persona.tech_level] ?? persona.tech_level}
        </span>
        <span className="text-[12px] text-zinc-600">
          <span className="text-zinc-400">目标：</span>{persona.goal}
        </span>
        <span className="text-[12px] text-zinc-600">
          <span className="text-zinc-400">先验：</span>
          {persona.prior_knowledge.length > 0 ? persona.prior_knowledge.join('、') : '无'}
        </span>
      </div>

      {/* Collapsed summary tag */}
      {!isEditOpen && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-medium">
            {persona.inferred_summary}
          </span>
        </div>
      )}

      {/* Edit panel */}
      {isEditOpen && (
        <div className="border-t border-zinc-50 bg-zinc-50/50 px-4 py-3 space-y-3 animate-fade-in">

          <div className="grid grid-cols-2 gap-2.5">
            {/* Profession */}
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                职业方向
              </label>
              <select
                value={persona.profession}
                onChange={(e) => onPersonaChange({ ...persona, profession: e.target.value })}
                className="w-full text-[12px] text-zinc-700 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-300 transition-colors cursor-pointer"
              >
                {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Tech level */}
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                技术水平
              </label>
              <select
                value={persona.tech_level}
                onChange={(e) => onPersonaChange({ ...persona, tech_level: e.target.value as Persona['tech_level'] })}
                className="w-full text-[12px] text-zinc-700 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-300 transition-colors cursor-pointer"
              >
                {TECH_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Goal chips */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              学习目标
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onPersonaChange({ ...persona, goal: g })}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    persona.goal === g
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
