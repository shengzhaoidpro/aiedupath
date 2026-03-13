import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, Node } from '../types';

interface GraphViewProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  selectedNodeId?: string | null;
}

// Color palette matching the "Roadmap" style (Yellows/Beiges)
const groupColors: Record<string, string> = {
  'Foundation': '#fde047', // Yellow-300 (Bright)
  'Core': '#fef08a',       // Yellow-200
  'Advanced': '#ffedd5',   // Orange-100 (Beige)
  'Practical': '#fef3c7',  // Amber-100 (Light Beige)
  'Related': '#f1f5f9',    // Slate-100 (Greyish)
};

// Chinese labels for the legend
const groupLabels: Record<string, string> = {
  'Foundation': '基础概念',
  'Core': '核心理论',
  'Advanced': '进阶优化',
  'Practical': '实战应用',
  'Related': '相关拓展',
};

const GraphView: React.FC<GraphViewProps> = ({ data, onNodeClick, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Refs to maintain D3 state across renders without triggering effects
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const nodesDataRef = useRef<any[]>([]); // Store current node positions
  const mainGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  
  // Stable callback ref to avoid effect dependency on onNodeClick
  const onNodeClickRef = useRef(onNodeClick);
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Fixed dimensions for the card nodes
  const nodeWidth = 200;
  const nodeHeight = 80;

  // Handle Resize using ResizeObserver to catch sidebar toggles
  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(wrapperRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 1. Initialize and Render Graph
  // This effect runs ONLY when data changes or window resizes.
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svgSelectionRef.current = svg;
    svg.selectAll("*").remove(); // Clear previous

    const { width, height } = dimensions;

    // Create mutable data copies
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.edges.map(d => ({ ...d }));

    // SORT nodes by orderId to ensure proper grid placement logic
    nodes.sort((a, b) => a.orderId - b.orderId);

    nodesDataRef.current = nodes; // Store reference for zoom logic

    // --- GRID LAYOUT CONFIGURATION ---
    // Layout parameters
    const COLUMNS = 4; // Number of nodes per row
    const X_SPACING = 280; // Horizontal distance between node centers
    const Y_SPACING = 150; // Vertical distance between rows
    
    // Calculate total grid size to center it
    const totalRows = Math.ceil(nodes.length / COLUMNS);
    const gridWidth = Math.min(nodes.length, COLUMNS) * X_SPACING;
    const gridHeight = totalRows * Y_SPACING;
    
    // Starting coordinates to center the grid
    // We adjust X by half spacing because grid points are centers
    const startX = (width - gridWidth) / 2 + (X_SPACING / 2);
    const startY = (height - gridHeight) / 2 + (Y_SPACING / 2);

    // Simulation setup
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(200).strength(0.2)) // Weaken links so grid dominates
      .force("charge", d3.forceManyBody().strength(-300)) // Light repulsion
      .force("collide", d3.forceCollide().radius(nodeWidth / 1.5).strength(1)) // Prevent overlap
      // Force X: Drive nodes to their column position
      .force("x", d3.forceX((d: any, i: number) => {
         const col = i % COLUMNS;
         return startX + (col * X_SPACING);
      }).strength(1.5)) // High strength to enforce structure
      // Force Y: Drive nodes to their row position
      .force("y", d3.forceY((d: any, i: number) => {
         const row = Math.floor(i / COLUMNS);
         return startY + (row * Y_SPACING);
      }).strength(1.5));
    
    simulationRef.current = simulation;

    // SVG Group for zooming
    const g = svg.append("g");
    mainGroupRef.current = g;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Render Links
    const link = g.append("g")
      .attr("stroke", "#3b82f6") // Blue-500
      .attr("stroke-opacity", 0.6)
      .selectAll("path") // Using path for potentially curved lines, though straight here
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Arrowhead marker (Blue)
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeWidth / 2 + 10) 
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#3b82f6");

    link.attr("marker-end", "url(#arrowhead)");

    // Group for Nodes
    const nodeGroup = g.append("g")
      .selectAll(".node-group")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClickRef.current) {
          onNodeClickRef.current(d as unknown as Node);
        }
      });

    // 1. ForeignObject for HTML Card Content
    nodeGroup.append("foreignObject")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("background-color", d => groupColors[d.group] || '#fef3c7')
      .style("border", "2px solid #0f172a") // Slate-900
      .style("border-radius", "8px")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("justify-content", "center")
      .style("align-items", "center")
      .style("padding", "8px 12px")
      .style("box-sizing", "border-box")
      .style("box-shadow", "2px 2px 0px rgba(15, 23, 42, 0.1)")
      .style("transition", "transform 0.1s ease")
      .html(d => `
        <div style="width: 100%; text-align: center; margin-bottom: 4px;">
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.2; font-family: 'Inter', sans-serif;">
            ${d.label}
          </div>
        </div>
        <div style="width: 100%; text-align: center; overflow: hidden;">
          <div style="font-size: 10px; color: #475569; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
            ${d.description}
          </div>
        </div>
      `);

    // 2. Order Badge (Top Left Corner)
    const badgeRadius = 10;
    const badgeGroup = nodeGroup.append("g")
      .attr("transform", `translate(${-nodeWidth / 2}, ${-nodeHeight / 2})`);

    badgeGroup.append("circle")
      .attr("r", badgeRadius)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", "#3b82f6") // Blue-500
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    badgeGroup.append("text")
      .text(d => d.orderId)
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#fff");

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup simulation on unmount or data change
    return () => {
      simulation.stop();
    };

  }, [data, dimensions.width, dimensions.height]); 

  // 2. Handle Focus / Zoom to Selected Node
  useEffect(() => {
    if (!selectedNodeId || !nodesDataRef.current.length || !svgSelectionRef.current || !zoomBehaviorRef.current) return;

    const node = nodesDataRef.current.find(n => n.id === selectedNodeId);
    
    if (node) {
      const { width, height } = dimensions;
      const scale = 1.2; 
      
      const panelWidth = 600;
      const availableWidth = width > 1000 ? width - panelWidth : width;
      const centerOffsetX = width > 1000 ? availableWidth / 2 : width / 2;
      
      const tx = centerOffsetX - scale * node.x;
      const ty = height / 2 - scale * node.y;

      const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

      svgSelectionRef.current
        .transition()
        .duration(750) 
        .call(zoomBehaviorRef.current.transform, transform);
    }
  }, [selectedNodeId, dimensions.width, dimensions.height]);

  return (
    <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-slate-50"> 
      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <p>请输入想要学习的主题以生成知识路径。</p>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {/* Legend */}
      {data.nodes.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-lg text-xs z-10">
          <h4 className="font-bold mb-2 text-slate-800">图例 (Legend)</h4>
          {Object.entries(groupColors).map(([group, color]) => (
            <div key={group} className="flex items-center mb-1">
              <span className="w-3 h-3 rounded-full mr-2 border border-slate-300" style={{ backgroundColor: color }}></span>
              <span className="text-slate-600 font-medium">{groupLabels[group] || group}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GraphView;