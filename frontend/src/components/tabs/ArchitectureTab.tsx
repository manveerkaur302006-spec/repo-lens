import { useMemo } from 'react';
import { useAnalysisContext } from '../../context/AnalysisContext';
import { Layers, ChevronRight, FileCode, Database, Box, Workflow } from 'lucide-react';

interface LayerData {
  name: string;
  icon: typeof FileCode;
  color: string;
  items: string[];
}

export default function ArchitectureTab() {
  const { graph } = useAnalysisContext();

  const layers = useMemo<LayerData[]>(() => {
    if (!graph) return [];

    const nodeById = new Map(graph.nodes.map(n => [n.id, n]));

    // Categorize files into architectural layers by path/name heuristics
    const buckets: Record<string, string[]> = {
      'Entry Points': [],
      'Routes / Controllers': [],
      'Services / Logic': [],
      'Models / Data': [],
      'Middleware': [],
      'Config / Utils': [],
      'Other': [],
    };

    for (const node of graph.nodes) {
      if (node.label !== 'File') continue;
      const p = (node.path || node.name || '').toLowerCase();

      if (/main\.|index\.|app\.|server\.|entry/i.test(p)) {
        buckets['Entry Points'].push(node.name);
      } else if (/route|controller|handler|endpoint|view/i.test(p)) {
        buckets['Routes / Controllers'].push(node.name);
      } else if (/service|logic|usecase|use_case|interactor/i.test(p)) {
        buckets['Services / Logic'].push(node.name);
      } else if (/model|schema|entity|migration|orm/i.test(p)) {
        buckets['Models / Data'].push(node.name);
      } else if (/middleware|guard|interceptor|filter|pipe/i.test(p)) {
        buckets['Middleware'].push(node.name);
      } else if (/config|util|helper|constant|setting|env/i.test(p)) {
        buckets['Config / Utils'].push(node.name);
      } else {
        buckets['Other'].push(node.name);
      }
    }

    const iconMap: Record<string, typeof FileCode> = {
      'Entry Points': Workflow,
      'Routes / Controllers': Layers,
      'Services / Logic': Box,
      'Models / Data': Database,
      'Middleware': Layers,
      'Config / Utils': FileCode,
      'Other': FileCode,
    };

    const colorMap: Record<string, string> = {
      'Entry Points': 'text-rose-400 bg-rose-500/15',
      'Routes / Controllers': 'text-blue-400 bg-blue-500/15',
      'Services / Logic': 'text-purple-400 bg-purple-500/15',
      'Models / Data': 'text-amber-400 bg-amber-500/15',
      'Middleware': 'text-cyan-400 bg-cyan-500/15',
      'Config / Utils': 'text-slate-400 bg-slate-500/15',
      'Other': 'text-slate-400 bg-slate-500/15',
    };

    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([name, items]) => ({
        name,
        icon: iconMap[name] || FileCode,
        color: colorMap[name] || 'text-slate-400 bg-slate-500/15',
        items: items.sort(),
      }));
  }, [graph]);

  if (layers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        No architecture data available.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Architecture Layers</h2>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-white/[0.08]" />

          <div className="space-y-3">
            {layers.map((layer, idx) => {
              const Icon = layer.icon;
              const [textColor, bgColor] = layer.color.split(' ');
              return (
                <div key={layer.name} className="relative group">
                  {/* Connector dot */}
                  <div className={`absolute left-[19px] top-5 w-[9px] h-[9px] rounded-full border-2 border-[#0d1117] ${bgColor} z-10`} />

                  <div className="ml-12 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-md ${bgColor} flex items-center justify-center`}>
                        <Icon size={13} className={textColor} />
                      </div>
                      <h3 className="text-sm font-semibold text-white">{layer.name}</h3>
                      <span className="text-[11px] text-slate-500 ml-auto">{layer.items.length} file{layer.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {layer.items.slice(0, 12).map(item => (
                        <span key={item} className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] text-xs text-slate-300 font-mono truncate max-w-[200px]">
                          {item}
                        </span>
                      ))}
                      {layer.items.length > 12 && (
                        <span className="px-2 py-0.5 rounded bg-white/[0.05] text-xs text-slate-500">
                          +{layer.items.length - 12} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow between layers */}
                  {idx < layers.length - 1 && (
                    <div className="flex justify-center ml-12 py-1">
                      <ChevronRight size={14} className="text-slate-600 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
