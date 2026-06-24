import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphData } from '../types';

interface GraphVisualizationProps {
  data: GraphData;
}

type ViewMode = 'structure' | 'imports' | 'calls';

const COMMUNITY_PALETTE = [
  '#6366F1', '#A855F7', '#EC4899', '#F43F5E', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#D946EF', '#FB923C', '#4ADE80', '#2DD4BF',
];

const TYPE_COLORS: Record<string, string> = {
  Repository: '#FFFFFF',
  File: '#6366F1',
  Class: '#A855F7',
  Function: '#22C55E',
  Module: '#F59E0B',
};

const EDGE_COLORS: Record<string, string> = {
  CONTAINS: 'rgba(99, 102, 241, 0.25)',
  HAS_CLASS: 'rgba(168, 85, 247, 0.25)',
  HAS_FUNCTION: 'rgba(34, 197, 94, 0.25)',
  HAS_METHOD: 'rgba(168, 85, 247, 0.25)',
  IMPORTS: 'rgba(245, 158, 11, 0.4)',
  CALLS: 'rgba(34, 197, 94, 0.4)',
};

const NODE_SIZE: Record<string, number> = {
  Repository: 10,
  File: 6,
  Class: 5,
  Function: 4,
  Module: 4,
};

function getCommunity(node: any): string {
  if (!node.path) return 'root';
  const parts = node.path.split('/');
  return parts.length > 1 ? parts[0] : 'root';
}

function communityColor(community: string): string {
  let hash = 0;
  for (let i = 0; i < community.length; i++) {
    hash = community.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMMUNITY_PALETTE[Math.abs(hash) % COMMUNITY_PALETTE.length];
}

export default function GraphVisualization({ data }: GraphVisualizationProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const [viewMode, setViewMode] = useState<ViewMode>('structure');
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    () => new Set(['File', 'Class', 'Function', 'Module'])
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [colorBy, setColorBy] = useState<'type' | 'community'>('type');

  // Build parent → children map and child → parent map
  const { parentMap, childrenMap } = useMemo(() => {
    const pMap = new Map<string, string>();
    const cMap = new Map<string, string[]>();
    const structTypes = new Set(['CONTAINS', 'HAS_CLASS', 'HAS_METHOD', 'HAS_FUNCTION']);

    for (const e of data.edges) {
      const type = typeof e.type === 'string' ? e.type : '';
      if (!structTypes.has(type)) continue;

      const src = typeof e.source === 'object' ? (e.source as any).id : e.source;
      const tgt = typeof e.target === 'object' ? (e.target as any).id : e.target;
      pMap.set(tgt, src);
      if (!cMap.has(src)) cMap.set(src, []);
      cMap.get(src)!.push(tgt);
    }
    return { parentMap: pMap, childrenMap: cMap };
  }, [data.edges]);

  // Initialize: expand the repository node so its direct children (files) are visible
  useEffect(() => {
    if (data.nodes.length === 0) return;
    const repoNode = data.nodes.find(n => n.label === 'Repository');
    if (repoNode) {
      setExpandedNodes(new Set([repoNode.id]));
    }
  }, [data.nodes]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Click to expand/collapse
  const handleNodeClick = useCallback((node: any) => {
    const hasChildren = childrenMap.has(node.id) && childrenMap.get(node.id)!.length > 0;
    if (!hasChildren) return; // Leaf node, nothing to expand

    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        // Collapse: remove this node and all descendants from expanded set
        const toRemove = [node.id];
        while (toRemove.length > 0) {
          const id = toRemove.pop()!;
          next.delete(id);
          const children = childrenMap.get(id);
          if (children) toRemove.push(...children);
        }
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, [childrenMap]);

  // Compute visible nodes & edges based on view, filters, and expansion state
  const graphData = useMemo(() => {
    const nodeById = new Map(data.nodes.map(n => [n.id, n]));

    if (viewMode === 'structure') {
      // Show only nodes whose parent is expanded (or Repository root)
      const visibleNodeIds = new Set<string>();

      for (const n of data.nodes) {
        if (n.label === 'Repository') {
          visibleNodeIds.add(n.id);
          continue;
        }
        if (!visibleTypes.has(n.label)) continue;

        const parent = parentMap.get(n.id);
        if (parent && expandedNodes.has(parent)) {
          visibleNodeIds.add(n.id);
        }
      }

      const structTypes = new Set(['CONTAINS', 'HAS_CLASS', 'HAS_METHOD', 'HAS_FUNCTION']);
      const filteredEdges = data.edges.filter(e => {
        const type = typeof e.type === 'string' ? e.type : '';
        if (!structTypes.has(type)) return false;
        const src = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tgt = typeof e.target === 'object' ? (e.target as any).id : e.target;
        return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
      });

      const filteredNodes = data.nodes.filter(n => visibleNodeIds.has(n.id));
      return { nodes: filteredNodes, links: filteredEdges };

    } else if (viewMode === 'imports') {
      const filteredEdges = data.edges.filter(e => {
        const type = typeof e.type === 'string' ? e.type : '';
        return type === 'IMPORTS';
      });
      const ids = new Set<string>();
      filteredEdges.forEach(e => {
        ids.add(typeof e.source === 'object' ? (e.source as any).id : e.source);
        ids.add(typeof e.target === 'object' ? (e.target as any).id : e.target);
      });
      return {
        nodes: data.nodes.filter(n => ids.has(n.id)),
        links: filteredEdges,
      };

    } else {
      // calls
      const filteredEdges = data.edges.filter(e => {
        const type = typeof e.type === 'string' ? e.type : '';
        return type === 'CALLS';
      });
      const ids = new Set<string>();
      filteredEdges.forEach(e => {
        ids.add(typeof e.source === 'object' ? (e.source as any).id : e.source);
        ids.add(typeof e.target === 'object' ? (e.target as any).id : e.target);
      });
      return {
        nodes: data.nodes.filter(n => ids.has(n.id)),
        links: filteredEdges,
      };
    }
  }, [data, viewMode, visibleTypes, expandedNodes, parentMap]);

  // Auto-fit after data changes
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        try { fgRef.current?.zoomToFit(400, 60); } catch {}
      }, 500);
    }
  }, [graphData.nodes.length, viewMode]);

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const getNodeColor = (node: any) => {
    if (node.label === 'Repository') return '#FFFFFF';
    if (colorBy === 'community') return communityColor(getCommunity(node));
    return TYPE_COLORS[node.label] || '#999';
  };

  const hasChildrenForNode = (nodeId: string) => {
    return childrenMap.has(nodeId) && childrenMap.get(nodeId)!.length > 0;
  };

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0">

      {/* ─── Toolbar ─── */}
      <div className="absolute top-3 left-3 z-30 flex items-start gap-3 pointer-events-none">

        {/* View Mode */}
        <div className="pointer-events-auto bg-bgMain/90 border border-glassBorder rounded-xl p-3 backdrop-blur-md shadow-lg">
          <div className="text-[10px] text-textSecondary uppercase tracking-widest mb-2 font-bold">View</div>
          <div className="flex flex-col gap-1">
            {(['structure', 'imports', 'calls'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${viewMode === mode
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-textSecondary hover:bg-white/5 hover:text-white'
                  }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters (structure view only) */}
        {viewMode === 'structure' && (
          <div className="pointer-events-auto bg-bgMain/90 border border-glassBorder rounded-xl p-3 backdrop-blur-md shadow-lg">
            <div className="text-[10px] text-textSecondary uppercase tracking-widest mb-2 font-bold">Filter</div>
            <div className="flex flex-col gap-1.5">
              {['File', 'Class', 'Function', 'Module'].map(type => (
                <label key={type} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleTypes.has(type)}
                    onChange={() => toggleType(type)}
                    className="accent-primary w-3.5 h-3.5 rounded"
                  />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                  <span className={visibleTypes.has(type) ? 'text-white' : 'text-textSecondary'}>{type}s</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Color Mode */}
        <div className="pointer-events-auto bg-bgMain/90 border border-glassBorder rounded-xl p-3 backdrop-blur-md shadow-lg">
          <div className="text-[10px] text-textSecondary uppercase tracking-widest mb-2 font-bold">Color</div>
          <div className="flex flex-col gap-1">
            {(['type', 'community'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setColorBy(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${colorBy === mode
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-textSecondary hover:bg-white/5 hover:text-white'
                  }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-3 left-3 z-30 bg-bgMain/90 border border-glassBorder rounded-xl px-4 py-2 backdrop-blur-md shadow-lg flex gap-4 text-xs text-textSecondary">
        <span>Nodes: <span className="text-white font-semibold">{graphData.nodes.length}</span></span>
        <span>Edges: <span className="text-white font-semibold">{graphData.links.length}</span></span>
        <span className="text-[10px] text-textSecondary/50">Click nodes to expand · Click again to collapse</span>
      </div>

      {/* Empty state */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center text-textSecondary">
            <p className="text-lg font-semibold mb-2">No data for this view</p>
            <p className="text-sm">Try switching to a different view mode or adjusting filters.</p>
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      {dimensions.width > 0 && dimensions.height > 0 && graphData.nodes.length > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={(node: any) => {
            const expandable = hasChildrenForNode(node.id);
            const expanded = expandedNodes.has(node.id);
            const suffix = expandable ? (expanded ? ' (click to collapse)' : ' (click to expand)') : '';
            return `${node.name || 'Unknown'} [${node.label}]${suffix}`;
          }}
          nodeColor={getNodeColor}
          nodeVal={(node: any) => NODE_SIZE[node.label] || 4}
          linkColor={(link: any) => {
            const type = typeof link.type === 'string' ? link.type : '';
            return EDGE_COLORS[type] || 'rgba(255,255,255,0.08)';
          }}
          linkWidth={1.5}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          backgroundColor="#0B1020"
          onNodeClick={handleNodeClick}
          dagMode={viewMode === 'structure' ? 'td' : undefined}
          dagLevelDistance={viewMode === 'structure' ? 60 : undefined}
          cooldownTicks={80}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const size = NODE_SIZE[node.label] || 4;
            const r = Math.sqrt(size) * 3;
            const color = getNodeColor(node);
            const isExpandable = hasChildrenForNode(node.id);
            const isExpanded = expandedNodes.has(node.id);

            // Glow for expandable nodes
            if (isExpandable && !isExpanded) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
              ctx.fillStyle = color + '30';
              ctx.fill();
            }

            // Main circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            // Border for expanded nodes
            if (isExpanded) {
              ctx.strokeStyle = '#FFFFFF80';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Label (only when zoomed in enough)
            if (globalScale > 1.5 || node.label === 'Repository') {
              const label = node.name || '';
              const fontSize = Math.max(10 / globalScale, 2);
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.fillStyle = 'rgba(255,255,255,0.8)';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillText(label, node.x, node.y + r + 2);
            }
          }}
        />
      )}
    </div>
  );
}
