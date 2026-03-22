import React from 'react';
import { CardResources } from '../types';

interface ResourcesBlockProps {
  resources: CardResources;
  onFollowUp: (question: string) => void;
}

const PLATFORM_ICON: Record<string, string> = {
  'Bilibili': '📺',
  '小红书': '📕',
};

function getPlatformUrl(platform: string, keyword: string): string {
  const encoded = encodeURIComponent(keyword);
  if (platform === 'Bilibili') return `https://search.bilibili.com/all?keyword=${encoded}`;
  if (platform === '小红书') return `https://www.xiaohongshu.com/search_result?keyword=${encoded}`;
  return `https://www.google.com/search?q=${encoded}`;
}

export default function ResourcesBlock({ resources, onFollowUp }: ResourcesBlockProps) {
  return (
    <div className="mt-6 pt-5 border-t border-dashed border-slate-200">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">延伸资源</p>

      {/* Search links */}
      {resources.search_keywords.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {resources.search_keywords.map((item, i) => (
            <a
              key={i}
              href={getPlatformUrl(item.platform, item.keyword)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors no-underline"
            >
              <span className="text-[13px] font-medium text-slate-600 min-w-[72px]">
                {PLATFORM_ICON[item.platform] ?? '🔍'} {item.platform}
              </span>
              <span className="text-[13px] text-blue-600">搜「{item.keyword}」</span>
            </a>
          ))}
        </div>
      )}

      {/* Books / docs */}
      {resources.books.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {resources.books.map((book, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-[13px] font-medium text-slate-700">📖 {book.title}</span>
              <span className="text-[12px] text-slate-400">{book.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Further question */}
      {resources.further_questions.length > 0 && (
        <button
          onClick={() => onFollowUp(resources.further_questions[0])}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-left"
        >
          <span className="text-[13px] text-slate-700">💬 {resources.further_questions[0]}</span>
          <span className="text-[11px] text-amber-600 font-medium whitespace-nowrap ml-3 flex-shrink-0">
            点击追问 →
          </span>
        </button>
      )}
    </div>
  );
}
