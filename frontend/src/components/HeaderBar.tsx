import { useAnalysisContext } from '../context/AnalysisContext';
import { FileCode, Hash, Database, Layers, ArrowRightLeft, GitBranch } from 'lucide-react';

const LANG_COLORS: Record<string, string> = {
  python: '#3572A5',
  javascript: '#f1e05a',
  typescript: '#3178c6',
  java: '#b07219',
  kotlin: '#A97BFF',
  go: '#00ADD8',
  rust: '#dea584',
  c: '#555555',
  'c++': '#f34b7d',
  'c#': '#178600',
  php: '#4F5D95',
  ruby: '#701516',
  html: '#e34c26',
  css: '#563d7c',
  unknown: '#8b949e',
};

export default function HeaderBar() {
  const { report } = useAnalysisContext();
  if (!report) return null;

  const { stats, summary } = report;
  const repoName = summary?.purpose?.split(' ')[0] || 'Repository';
  const totalLangCount = Object.values(stats.languages || {}).reduce((a, b) => a + b, 0) || 1;

  const metrics = [
    { icon: FileCode, label: 'Files', value: stats.total_files },
    { icon: Database, label: 'Classes', value: stats.total_classes },
    { icon: Layers, label: 'Functions', value: stats.total_functions },
    { icon: Hash, label: 'LOC', value: stats.total_loc },
    { icon: ArrowRightLeft, label: 'Imports', value: stats.total_imports || 0 },
  ];

  const fmt = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v);

  return (
    <header className="shrink-0 border-b border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-md px-5 py-3">
      <div className="flex items-center gap-6">
        {/* Logo + repo name */}
        <div className="flex items-center gap-3 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GitBranch size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">RepoLens</h1>
            <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[200px]">Repository Intelligence</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/[0.08]" />

        {/* Metric pills */}
        <div className="flex items-center gap-3">
          {metrics.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
                <Icon size={13} className="text-slate-400" />
                <span className="text-[11px] text-slate-400">{m.label}</span>
                <span className="text-sm font-semibold text-white tabular-nums">{fmt(m.value)}</span>
              </div>
            );
          })}
        </div>

        {/* Language bar */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            {Object.entries(stats.languages || {}).slice(0, 5).map(([lang, count]) => {
              const pct = ((count / totalLangCount) * 100).toFixed(0);
              const color = LANG_COLORS[lang.toLowerCase()] || LANG_COLORS.unknown;
              return (
                <div key={lang} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span>{lang}</span>
                  <span className="text-slate-500">{pct}%</span>
                </div>
              );
            })}
          </div>
          {/* Language bar visual */}
          <div className="w-32 h-2 rounded-full overflow-hidden flex bg-white/[0.06]">
            {Object.entries(stats.languages || {}).map(([lang, count]) => {
              const color = LANG_COLORS[lang.toLowerCase()] || LANG_COLORS.unknown;
              const pct = (count / totalLangCount) * 100;
              return <div key={lang} className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />;
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
