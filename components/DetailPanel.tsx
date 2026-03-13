import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Node, NodeDetailData } from '../types';
import { fetchNodeDetails } from '../services/geminiService';

interface DetailPanelProps {
  node: Node | null;
  mainTopic: string;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ node, mainTopic, onClose }) => {
  const [data, setData] = useState<NodeDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node && mainTopic) {
      setLoading(true);
      setData(null);
      fetchNodeDetails(node.label, mainTopic)
        .then(setData)
        .catch(err => {
          console.error(err);
          let msg = "加载详细内容失败，请重试。";
          const message = err?.message || '';
          if (message.includes('QUOTA_EXCEEDED') || message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
             msg = "API 配额不足，无法加载详情。请稍后再试。";
          }
          setData({ content: msg, sources: [] });
        })
        .finally(() => setLoading(false));
    }
  }, [node, mainTopic]);

  if (!node) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[600px] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl transition-transform duration-300 transform flex flex-col z-50 text-slate-800">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/80 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full text-xs font-bold text-white shadow-sm">
              {node.orderId}
            </span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border
              ${node.group === 'Foundation' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                node.group === 'Core' ? 'bg-yellow-200 text-yellow-900 border-yellow-300' :
                node.group === 'Advanced' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                node.group === 'Practical' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {node.group}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">{node.label}</h2>
          <p className="text-slate-500 text-sm mt-1">{node.description}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
        {loading ? (
          <div className="space-y-6 animate-pulse max-w-2xl mx-auto">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-3">
               <div className="h-3 bg-slate-200 rounded w-full"></div>
               <div className="h-3 bg-slate-200 rounded w-full"></div>
               <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            </div>
            <div className="h-32 bg-slate-100 rounded-lg w-full mt-6 border border-slate-200"></div>
             <div className="space-y-3">
               <div className="h-3 bg-slate-200 rounded w-full"></div>
               <div className="h-3 bg-slate-200 rounded w-4/5"></div>
            </div>
          </div>
        ) : data ? (
          <div className="max-w-2xl mx-auto">
            <ReactMarkdown
               components={{
                // Typography & Layout
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-100" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-blue-500 before:rounded-full before:inline-block" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3" {...props} />,
                p: ({node, ...props}) => <div className="text-slate-600 text-[15px] leading-7 mb-5 text-justify" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 bg-slate-100 px-1 rounded" {...props} />,
                em: ({node, ...props}) => <em className="text-slate-800 italic" {...props} />,
                
                // Lists
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 space-y-2 mb-6 text-slate-600 marker:text-blue-400" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 space-y-2 mb-6 text-slate-600 marker:text-blue-500 marker:font-medium" {...props} />,
                li: ({node, ...props}) => <li className="leading-7 pl-1" {...props} />,
                
                // Block Elements
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-blue-400 bg-blue-50/50 pl-4 py-3 my-6 italic text-slate-700 rounded-r-lg" {...props} />
                ),
                hr: ({node, ...props}) => <hr className="my-8 border-slate-200" {...props} />,
                
                // Code
                code: ({node, inline, className, children, ...props}: any) => {
                   const match = /language-(\w+)/.exec(className || '');
                   const isInline = !match && inline;
                   
                   if (isInline) {
                      return (
                         <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 mx-1" {...props}>
                           {children}
                         </code>
                      );
                   }
                   
                   return (
                     <div className="relative group my-6">
                        <div className="absolute -top-3 right-4 bg-slate-800 text-xs text-slate-300 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {match ? match[1] : 'code'}
                        </div>
                        <div className="bg-slate-900 rounded-lg p-5 overflow-x-auto shadow-inner custom-scrollbar text-sm font-mono leading-relaxed text-slate-300">
                           <code className={className} {...props}>
                             {children}
                           </code>
                        </div>
                     </div>
                   );
                },

                // Custom Links & Citations
                a: ({node, ...props}) => {
                  const href = props.href || '';
                  
                  // Custom rendering for injected citations [1](citation:0)
                  if (href.startsWith('citation:')) {
                    const index = parseInt(href.split(':')[1], 10);
                    const source = data.sources[index];
                    
                    if (source) {
                      return (
                        <span className="relative inline-block group align-top text-[10px] leading-none no-underline ml-0.5 -mt-1">
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-4 h-4 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all cursor-pointer border border-blue-200 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {index + 1}
                          </a>
                          
                          {/* Hover Tooltip */}
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 text-center z-50 pointer-events-none">
                             <span className="block line-clamp-2 leading-snug">{source.title}</span>
                             <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
                          </span>
                        </span>
                      );
                    }
                  }

                  // Default rendering for standard links
                  return (
                    <a {...props} className="text-blue-600 font-medium hover:text-blue-700 hover:underline underline-offset-2 decoration-blue-200 transition-colors" target="_blank" rel="noopener noreferrer">
                      {props.children}
                    </a>
                  );
                }
               }}
            >
              {data.content}
            </ReactMarkdown>

            {/* References / Grounding Sources Section */}
            {data.sources.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  参考资料 (References)
                </h3>
                <ul className="space-y-3">
                  {data.sources.map((source, idx) => (
                    source.uri && (
                      <li key={idx} className="flex items-start group p-2 rounded-lg hover:bg-slate-50 transition-colors -mx-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold mr-3 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <a 
                          href={source.uri}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-slate-600 hover:text-blue-700 leading-relaxed break-all transition-colors flex-1"
                        >
                          {source.title}
                          <svg className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </li>
                    )
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
             </div>
             <p className="text-slate-400 font-medium">暂无详细内容</p>
             <p className="text-slate-400 text-xs mt-1">请尝试重新生成或选择其他节点</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;