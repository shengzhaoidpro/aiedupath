import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, Node } from '../types';

interface GraphViewProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  selectedNodeId?: string | null;
}

// Per-level zone + node styling
const levelStyles: Record<number, {
  zoneBg: string; zoneStroke: string;
  nodeBg: string; nodeBorder: string;
  dot: string; label: string;
}> = {
  0: {
    zoneBg: '#fffdf5', zoneStroke: '#fde68a',
    nodeBg: '#fffbeb', nodeBorder: '#fde68a',
    dot: '#f59e0b', label: '起步阶段',
  },
  1: {
    zoneBg: '#f5f9ff', zoneStroke: '#bfdbfe',
    nodeBg: '#eff6ff', nodeBorder: '#bfdbfe',
    dot: '#3b82f6', label: '核心模块',
  },
  2: {
    zoneBg: '#fdf9ff', zoneStroke: '#e9d5ff',
    nodeBg: '#faf5ff', nodeBorder: '#e9d5ff',
    dot: '#a855f7', label: '知识要点',
  },
};

const fallbackStyle = {
  zoneBg: '#f8fafc', zoneStroke: '#e2e8f0',
  nodeBg: '#f8fafc', nodeBorder: '#e2e8f0',
  dot: '#94a3b8', label: '拓展内容',
};

const NODE_W = 158;
const NODE_H = 108;
const X_GAP = 16;        // horizontal gap between nodes within a row
const Y_GAP = 14;        // vertical gap between rows within a zone
const ZONE_PAD_X = 36;   // horizontal padding inside zone rect
const ZONE_PAD_TOP = 48; // space for zone label + top padding
const ZONE_PAD_BOT = 28; // bottom padding inside zone rect
const ZONE_GAP = 44;     // vertical gap between zones
const ZONE_R = 16;       // corner radius
const MAX_PER_ROW = 5;   // max nodes per row

interface ZoneRect {
  level: number;
  x: number; y: number; w: number; h: number;
}

function computeLayout(nodes: Node[]): {
  positions: Map<string, { x: number; y: number }>;
  zones: ZoneRect[];
} {
  const positions = new Map<string, { x: number; y: number }>();
  const zones: ZoneRect[] = [];
  if (!nodes.length) return { positions, zones };

  const byLevel = new Map<number, Node[]>();
  for (const n of nodes) {
    const lv = n.level ?? 0;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv)!.push(n);
  }

  const levels = [...byLevel.keys()].sort((a, b) => a - b);

  // Zone width based on max nodes per row (capped at MAX_PER_ROW)
  let maxLevelNodes = 0;
  for (const [, ns] of byLevel) maxLevelNodes = Math.max(maxLevelNodes, ns.length);
  const maxRowNodes = Math.min(maxLevelNodes, MAX_PER_ROW);
  const maxContentW = maxRowNodes * NODE_W + Math.max(0, maxRowNodes - 1) * X_GAP;
  const zoneW = maxContentW + ZONE_PAD_X * 2;
  const zoneX = -zoneW / 2;

  let curY = 0;

  for (const level of levels) {
    const levelNodes = byLevel.get(level)!;

    // Split into rows of MAX_PER_ROW
    const rows: Node[][] = [];
    for (let i = 0; i < levelNodes.length; i += MAX_PER_ROW) {
      rows.push(levelNodes.slice(i, i + MAX_PER_ROW));
    }

    rows.forEach((row, rowIdx) => {
      // Center each row horizontally within the zone
      const rowContentW = row.length * NODE_W + Math.max(0, row.length - 1) * X_GAP;
      const startX = zoneX + ZONE_PAD_X + (maxContentW - rowContentW) / 2;
      const nodeY = curY + ZONE_PAD_TOP + rowIdx * (NODE_H + Y_GAP) + NODE_H / 2;

      row.forEach((node, i) => {
        positions.set(node.id, {
          x: startX + i * (NODE_W + X_GAP) + NODE_W / 2,
          y: nodeY,
        });
      });
    });

    const numRows = rows.length;
    const zoneH = ZONE_PAD_TOP + numRows * NODE_H + Math.max(0, numRows - 1) * Y_GAP + ZONE_PAD_BOT;
    zones.push({ level, x: zoneX, y: curY, w: zoneW, h: zoneH });
    curY += zoneH + ZONE_GAP;
  }

  return { positions, zones };
}

const GraphView: React.FC<GraphViewProps> = ({ data, onNodeClick, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dims, setDims] = React.useState({ w: 0, h: 0 });

  const nodeIds = data.nodes.map(n => n.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { positions, zones } = useMemo(() => computeLayout(data.nodes), [nodeIds]);

  // Resize observer
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([e]) =>
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    );
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Setup D3 zoom (once)
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', ev => g.attr('transform', ev.transform.toString()));

    zoomRef.current = zoom;
    svg.call(zoom);
    return () => { svg.on('.zoom', null); };
  }, []);

  // Fit all zones into view when node structure changes
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || !dims.w || !zones.length) return;

    const margin = 48;
    const minX = zones[0].x - margin;
    const maxX = zones[0].x + zones[0].w + margin;
    const minY = zones[0].y - margin;
    const lastZone = zones[zones.length - 1];
    const maxY = lastZone.y + lastZone.h + margin;
    const gW = maxX - minX;
    const gH = maxY - minY;

    const scale = Math.min(1, (dims.w - 80) / gW, (dims.h - 80) / gH);
    const tx = (dims.w - gW * scale) / 2 - minX * scale;
    const ty = (dims.h - gH * scale) / 2 - minY * scale;

    d3.select(svgRef.current)
      .transition().duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIds, dims.w, dims.h]);

  // Zoom to selected node
  useEffect(() => {
    if (!selectedNodeId || !svgRef.current || !zoomRef.current || !dims.w) return;
    const p = positions.get(selectedNodeId);
    if (!p) return;

    const scale = 1.15;
    const panelW = dims.w > 1000 ? 600 : 0;
    const cx = (dims.w - panelW) / 2;
    const cy = dims.h / 2;

    d3.select(svgRef.current)
      .transition().duration(500)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(cx - scale * p.x, cy - scale * p.y).scale(scale)
      );
  }, [selectedNodeId, positions, dims]);

  // Vertical Bezier: bottom of source → top of target
  const edgePath = (srcId: string, tgtId: string): string | null => {
    const s = positions.get(srcId);
    const t = positions.get(tgtId);
    if (!s || !t) return null;
    const x1 = s.x, y1 = s.y + NODE_H / 2;
    const x2 = t.x, y2 = t.y - NODE_H / 2;
    const my = (y1 + y2) / 2;
    return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
  };

  return (
    <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-[#f5f5f0]">
      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <p>请输入想要学习的主题以生成知识路径。</p>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full">
        <defs>
          <marker id="arr" viewBox="0 -5 10 10" refX="8" refY="0"
            markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#94a3b8" />
          </marker>
        </defs>

        <g ref={gRef}>
          {/* ── Zone backgrounds ── */}
          {zones.map(zone => {
            const s = levelStyles[zone.level] || fallbackStyle;
            const num = String(zone.level + 1).padStart(2, '0');
            return (
              <g key={`zone-${zone.level}`}>
                <rect
                  x={zone.x} y={zone.y}
                  width={zone.w} height={zone.h}
                  rx={ZONE_R} ry={ZONE_R}
                  fill={s.zoneBg}
                  stroke={s.zoneStroke}
                  strokeWidth={1.5}
                />
                {/* Zone label: numbered dot + text */}
                <circle cx={zone.x + 22} cy={zone.y + 22} r={8} fill={s.dot} />
                <text x={zone.x + 22} y={zone.y + 22}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fontWeight="bold" fill="#fff"
                  style={{ pointerEvents: 'none' }}>
                  {num}
                </text>
                <text x={zone.x + 36} y={zone.y + 26}
                  fontSize={12} fontWeight={600}
                  fill={s.dot} letterSpacing={0.3}
                  style={{ pointerEvents: 'none' }}>
                  {s.label}
                </text>
              </g>
            );
          })}

          {/* ── Edges ── */}
          {data.edges.map((edge, i) => {
            const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as Node).id;
            const tgtId = typeof edge.target === 'string' ? edge.target : (edge.target as Node).id;
            const d = edgePath(srcId, tgtId);
            if (!d) return null;
            return (
              <path key={i} d={d} fill="none"
                stroke="#cbd5e1" strokeWidth={1.5}
                strokeDasharray="5,4" markerEnd="url(#arr)" />
            );
          })}

          {/* ── Nodes ── */}
          {data.nodes.map(node => {
            const p = positions.get(node.id);
            if (!p) return null;
            const selected = selectedNodeId === node.id;
            const s = levelStyles[node.level ?? 0] || fallbackStyle;
            return (
              <g key={node.id}
                transform={`translate(${p.x - NODE_W / 2},${p.y - NODE_H / 2})`}
                onClick={() => onNodeClick(node)}
                style={{ cursor: 'pointer' }}>

                <foreignObject width={NODE_W} height={NODE_H}>
                  <div style={{
                    width: '100%', height: '100%',
                    backgroundColor: s.nodeBg,
                    border: `1.5px solid ${selected ? s.dot : s.nodeBorder}`,
                    borderRadius: 12,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-start',
                    padding: '10px 12px', boxSizing: 'border-box',
                    boxShadow: selected
                      ? `0 0 0 3px ${s.dot}33`
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}>
                    {/* Title row: dot + label */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 6,
                      marginBottom: node.description ? 5 : 0,
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        backgroundColor: s.dot,
                        flexShrink: 0, marginTop: 4,
                      }} />
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: '#1e293b',
                        lineHeight: 1.35, flex: 1,
                      }}>
                        {node.label}
                      </div>
                    </div>
                    {/* Description */}
                    {node.description && (
                      <div style={{
                        fontSize: 11, color: '#64748b',
                        lineHeight: 1.55, paddingLeft: 13,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      }}>
                        {node.description}
                      </div>
                    )}
                  </div>
                </foreignObject>

                {/* Order badge */}
                <circle cx={0} cy={0} r={10} fill={s.dot} stroke="#fff" strokeWidth={1.5} />
                <text x={0} y={0} textAnchor="middle" dy=".35em"
                  fontSize={10} fontWeight="bold" fill="#fff"
                  style={{ pointerEvents: 'none' }}>
                  {node.orderId}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default GraphView;
