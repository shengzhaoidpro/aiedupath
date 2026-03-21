import React, { useState } from 'react';
import { Star, Share2, Check } from 'lucide-react';
import { PathVersion } from '../types';

interface VersionBarProps {
  versions: PathVersion[];
  currentVersion: number;
  activeTopic: string;
  onSwitch: (versionNum: number) => void;
  onToggleStar: (versionNum: number) => void;
}

export default function VersionBar({
  versions,
  currentVersion,
  activeTopic,
  onSwitch,
  onToggleStar,
}: VersionBarProps) {
  const [copiedVersion, setCopiedVersion] = useState<number | null>(null);

  const handleShare = (versionNum: number) => {
    const params = new URLSearchParams({ topic: activeTopic, v: String(versionNum) });
    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedVersion(versionNum);
      setTimeout(() => setCopiedVersion(null), 2000);
    }).catch(() => {
      // Fallback for browsers that block clipboard without user gesture
      prompt('复制分享链接', url);
    });
  };

  const activeVersion = versions.find((v) => v.version === currentVersion);

  return (
    <div className="flex-shrink-0 h-10 px-4 bg-white border-b border-zinc-100 flex items-center gap-1 overflow-x-auto custom-scrollbar">
      <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest flex-shrink-0 pr-2 border-r border-zinc-100 mr-1">
        版本历史
      </span>

      {versions.map((v) => {
        const isActive = v.version === currentVersion;
        return (
          <button
            key={v.version}
            onClick={() => onSwitch(v.version)}
            title={v.iterationNote ? `迭代说明：${v.iterationNote}` : `v${v.version} · ${new Date(v.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex-shrink-0 ${
              isActive
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
            }`}
          >
            <span>v{v.version}</span>
            {v.isStarred && (
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            )}
          </button>
        );
      })}

      {/* Actions for active version */}
      {activeVersion && (
        <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-zinc-100 flex-shrink-0">
          <button
            onClick={() => onToggleStar(currentVersion)}
            title={activeVersion.isStarred ? '取消收藏' : '收藏此版本'}
            className={`p-1 rounded-md transition-colors ${
              activeVersion.isStarred
                ? 'text-amber-400 hover:text-amber-500'
                : 'text-zinc-300 hover:text-amber-400 hover:bg-amber-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeVersion.isStarred ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => handleShare(currentVersion)}
            title="复制分享链接"
            className="p-1 rounded-md text-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            {copiedVersion === currentVersion ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
          {copiedVersion === currentVersion && (
            <span className="text-[10px] text-emerald-500 font-medium ml-0.5 animate-fade-in">
              已复制
            </span>
          )}
        </div>
      )}
    </div>
  );
}
