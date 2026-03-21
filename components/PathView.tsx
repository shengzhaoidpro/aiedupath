import React from 'react';
import { Clock, Lightbulb, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { LearningPath, Phase, Card, Persona } from '../types';

interface PathViewProps {
  path: LearningPath;
  selectedCardId?: string;
  onCardClick: (card: Card) => void;
  isStreaming?: boolean;
  persona?: Persona | null;
  onPersonaTagClick?: () => void;
  isInMyLearning?: boolean;
  onToggleMyLearning?: () => void;
}

const COLORS: Record<string, {
  section: string; border: string; badge: string; number: string; cardHover: string; tag: string;
}> = {
  teal:   { section: 'bg-teal-50/40',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700 border-teal-200',   number: 'bg-teal-500',   cardHover: 'hover:border-teal-300',   tag: 'bg-teal-50 text-teal-600'   },
  purple: { section: 'bg-purple-50/40', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700 border-purple-200', number: 'bg-purple-500', cardHover: 'hover:border-purple-300', tag: 'bg-purple-50 text-purple-600' },
  coral:  { section: 'bg-rose-50/40',   border: 'border-rose-200',   badge: 'bg-rose-100 text-rose-700 border-rose-200',   number: 'bg-rose-500',   cardHover: 'hover:border-rose-300',   tag: 'bg-rose-50 text-rose-600'   },
  amber:  { section: 'bg-amber-50/40',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700 border-amber-200',  number: 'bg-amber-500',  cardHover: 'hover:border-amber-300',  tag: 'bg-amber-50 text-amber-600'  },
  gray:   { section: 'bg-zinc-50/40',   border: 'border-zinc-200',   badge: 'bg-zinc-100 text-zinc-500 border-zinc-200',   number: 'bg-zinc-400',   cardHover: 'hover:border-zinc-300',   tag: 'bg-zinc-100 text-zinc-500'   },
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  '概念': 'text-sky-400', '拆解': 'text-violet-400', '实战': 'text-rose-400',
  '优化': 'text-amber-400', '部署': 'text-teal-400', '架构': 'text-purple-400',
  '评估': 'text-orange-400', '组织': 'text-blue-400', '创新': 'text-pink-400',
};

function PhaseSection({
  phase, recommendedCardId, selectedCardId, onCardClick,
}: {
  phase: Phase;
  recommendedCardId: string;
  selectedCardId?: string;
  onCardClick: (card: Card) => void;
}) {
  const c = COLORS[phase.phase_color] ?? COLORS.gray;

  return (
    <div className={`mb-6 rounded-2xl border ${c.border} ${c.section} overflow-hidden`}>
      {/* Phase header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className={`w-6 h-6 rounded-full ${c.number} text-white text-[11px] flex items-center justify-center font-bold flex-shrink-0`}>
            {phase.phase_number}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.badge}`}>
            {phase.phase_badge}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">{phase.phase_label}</span>
        </div>
        <h2 className="text-base font-bold text-zinc-800 mb-1.5">{phase.phase_title}</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">{phase.phase_description}</p>
      </div>

      {/* Cards grid */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-3">
        {phase.cards.map((card) => {
          const isRecommended = card.card_id === recommendedCardId || card.is_recommended_start;
          const isSelected = card.card_id === selectedCardId;
          return (
            <button
              key={card.card_id}
              onClick={() => onCardClick(card)}
              className={`text-left p-4 bg-white rounded-xl border transition-all group shadow-xs ${
                isSelected
                  ? `${c.border} border-2 shadow-sm`
                  : `border-zinc-100 ${c.cardHover} hover:shadow-sm`
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <span className="text-2xl leading-none">{card.icon}</span>
                {isRecommended && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold leading-none flex-shrink-0">
                    推荐起点
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-1 leading-snug group-hover:text-zinc-900">
                {card.card_name}
              </h3>
              <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed line-clamp-2">
                {card.card_subtitle}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.tag}`}>
                  {card.card_tag}
                </span>
                <span className={`text-[10px] font-medium ${RESOURCE_TYPE_COLORS[card.resource_type] ?? 'text-zinc-300'}`}>
                  {card.resource_type}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PathView({ path, selectedCardId, onCardClick, isStreaming, persona, onPersonaTagClick, isInMyLearning, onToggleMyLearning }: PathViewProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f5f0] custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Path header */}
        <div className="mb-5 p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-zinc-900 mb-1">{path.topic}</h1>
              <p className="text-sm text-zinc-500 leading-relaxed mb-3">{path.summary}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{path.estimated_hours}</span>
                </div>
                {persona?.inferred_summary && (
                  <button
                    onClick={onPersonaTagClick}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-600 transition-colors group"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>为</span>
                    <span className="font-medium group-hover:text-amber-700">{persona.inferred_summary}</span>
                    <span>定制</span>
                  </button>
                )}
              </div>
            </div>
            {onToggleMyLearning && (
              <button
                onClick={onToggleMyLearning}
                style={{ height: '36px' }}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 rounded-lg transition-all flex-shrink-0 ${
                  isInMyLearning
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                }`}
              >
                <Heart className={`w-3 h-3 ${isInMyLearning ? 'fill-emerald-500' : ''}`} />
                <span>{isInMyLearning ? '已加入学习' : '加入我的学习'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tip banner */}
        {path.tip?.tip_text && (
          <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-amber-700">建议起点：</span>
              <span className="text-xs text-amber-700 leading-relaxed">{path.tip.tip_text}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          </div>
        )}

        {/* Phases */}
        {path.phases.map((phase) => (
          <PhaseSection
            key={phase.phase_number}
            phase={phase}
            recommendedCardId={path.tip?.recommended_start_card_id}
            selectedCardId={selectedCardId}
            onCardClick={onCardClick}
          />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center justify-center gap-2.5 py-6">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="text-xs text-zinc-400">正在生成更多阶段...</span>
          </div>
        )}
      </div>
    </div>
  );
}
