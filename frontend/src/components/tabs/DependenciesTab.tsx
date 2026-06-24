import { useMemo, useState } from 'react';
import { useAnalysisContext } from '../../context/AnalysisContext';
import { ArrowRight, ChevronRight, ChevronDown, Package, FileCode, Search } from 'lucide-react';

interface DepNode {
  name: string;
  path: string;
  imports: string[];
  importedBy: string[];
}

export default function DependenciesTab() {
  const { graph } = useAnalysisContext();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const depMap = useMemo<Map<string, DepNode>>(() => {
    const map = new Map<string, DepNode>();
    if (!graph) return map;

    const nodeById = new Map(graph.nodes.map(n => [n.id, n]));

    // Initialize entries for all file/module nodes
    for (const n of graph.nodes) {
      if (n.label === 'File' || n.label === 'Module') {
        map.set(n.id, {
          name: n.name,
          path: n.path || n.name,
          imports: [],
          importedBy: [],
        });
      }
    }

    // Populate import relationships
    for (const edge of graph.edges) {
      if (edge.type !== 'IMPORTS') continue;
      const srcId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      const tgtId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

      const srcNode = nodeById.get(srcId);
      const tgtNode = nodeById.get(tgtId);
      if (!srcNode || !tgtNode) continue;

      const src = map.get(srcId);
      const tgt = map.get(tgtId);
      if (src) src.imports.push(tgtNode.name);
      if (tgt) tgt.importedBy.push(srcNode.name);
    }

    return map;
  }, [graph]);

  const sortedDeps = useMemo(() => {
    const arr = Array.from(depMap.values());
    const filtered = search
      ? arr.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
      : arr;
    // Sort by most imported first
    return filtered.sort((a, b) => b.importedBy.length - a.importedBy.length);
  }, [depMap, search]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (sortedDeps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        No dependency data available.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="shrink-0 p-4 border-b border-white/[0.06]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Dependency list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
        {sortedDeps.map(dep => {
          const isOpen = expanded.has(dep.path);
          const hasRelations = dep.imports.length > 0 || dep.importedBy.length > 0;

          return (
            <div key={dep.path} className="rounded-lg">
              <button
                onClick={() => hasRelations && toggle(dep.path)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${isOpen ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}
                  ${hasRelations ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {hasRelations ? (
                  isOpen
                    ? <ChevronDown size={14} className="text-slate-500 shrink-0" />
                    : <ChevronRight size={14} className="text-slate-500 shrink-0" />
                ) : (
                  <span className="w-[14px] shrink-0" />
                )}

                {dep.name.includes('.') ? (
                  <FileCode size={14} className="text-indigo-400 shrink-0" />
                ) : (
                  <Package size={14} className="text-amber-400 shrink-0" />
                )}

                <span className="text-sm text-white font-mono truncate">{dep.name}</span>

                <div className="ml-auto flex items-center gap-3 shrink-0">
                  {dep.imports.length > 0 && (
                    <span className="text-[11px] text-slate-500">
                      {dep.imports.length} import{dep.imports.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {dep.importedBy.length > 0 && (
                    <span className="text-[11px] text-emerald-400/70">
                      used by {dep.importedBy.length}
                    </span>
                  )}
                </div>
              </button>

              {isOpen && hasRelations && (
                <div className="ml-8 mt-1 mb-2 space-y-2">
                  {dep.imports.length > 0 && (
                    <div className="pl-3 border-l-2 border-indigo-500/20">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Imports</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dep.imports.map((imp, i) => (
                          <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/15 text-xs text-indigo-300 font-mono">
                            <ArrowRight size={10} />
                            {imp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {dep.importedBy.length > 0 && (
                    <div className="pl-3 border-l-2 border-emerald-500/20">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Imported By</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dep.importedBy.map((by, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-300 font-mono">
                            {by}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
