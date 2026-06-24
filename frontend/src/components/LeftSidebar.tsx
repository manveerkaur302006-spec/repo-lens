import { useAnalysisContext, CenterTab } from '../context/AnalysisContext';
import FileTree from './FileTree';
import {
  LayoutDashboard, Layers, GitFork, Network,
  FileCode, Hash, Database, Box, ArrowRightLeft,
  ChevronLeft, ChevronRight, FolderTree
} from 'lucide-react';

const NAV_ITEMS: { id: CenterTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'architecture', label: 'Architecture', icon: Layers },
  { id: 'dependencies', label: 'Dependencies', icon: GitFork },
  { id: 'graph', label: 'Graph', icon: Network },
];

export default function LeftSidebar() {
  const { report, files, activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed } = useAnalysisContext();

  const stats = report?.stats;

  const quickStats = stats ? [
    { icon: FileCode, label: 'Files', value: stats.total_files },
    { icon: Database, label: 'Classes', value: stats.total_classes },
    { icon: Box, label: 'Functions', value: stats.total_functions },
    { icon: Hash, label: 'LOC', value: stats.total_loc },
    { icon: ArrowRightLeft, label: 'Imports', value: stats.total_imports || 0 },
  ] : [];

  if (sidebarCollapsed) {
    return (
      <div className="w-12 shrink-0 flex flex-col items-center py-3 gap-2 border-r border-white/[0.06] bg-[#0d1117]/50">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <div className="w-6 h-px bg-white/[0.06] my-1" />
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${activeTab === item.id
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                }`}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0d1117]/50 overflow-hidden">
      {/* Collapse button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Navigation</span>
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Nav items */}
      <div className="px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === item.id
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 h-px bg-white/[0.06]" />

      {/* File Explorer */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
          <FolderTree size={12} />
          Explorer
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 min-h-0">
        {files ? (
          <FileTree data={files} />
        ) : (
          <p className="text-slate-600 text-xs px-3">No files available</p>
        )}
      </div>

      {/* Quick Stats */}
      {quickStats.length > 0 && (
        <>
          <div className="mx-4 my-2 h-px bg-white/[0.06]" />
          <div className="px-4 py-3 shrink-0">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Quick Stats</p>
            <div className="grid grid-cols-2 gap-2">
              {quickStats.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-1.5 text-xs">
                    <Icon size={12} className="text-slate-500" />
                    <span className="text-slate-400">{s.label}</span>
                    <span className="text-white font-semibold ml-auto tabular-nums">
                      {s.value >= 1000 ? (s.value / 1000).toFixed(1) + 'k' : s.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
