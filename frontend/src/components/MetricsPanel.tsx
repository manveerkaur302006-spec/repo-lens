import { Activity, FileCode, Hash, Database, Layers, ArrowRightLeft } from 'lucide-react';
import StatsCard from './StatsCard';
import { ReportResponse } from '../types';

interface MetricsPanelProps {
  stats: ReportResponse['stats'];
}

const LANG_COLORS: Record<string, string> = {
  python: '#3572A5',
  javascript: '#f1e05a',
  typescript: '#3178c6',
  unknown: '#8b949e'
};

export default function MetricsPanel({ stats }: MetricsPanelProps) {
  const totalLangCount = Object.values(stats.languages || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Activity size={20} className="text-accent" />
        Code Metrics
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard icon={<FileCode size={18} />} label="Files" value={stats.total_files} />
        <StatsCard icon={<Hash size={18} />} label="Lines" value={stats.total_loc} />
        <StatsCard icon={<Database size={18} />} label="Classes" value={stats.total_classes} />
        <StatsCard icon={<Layers size={18} />} label="Functions" value={stats.total_functions} />
        <StatsCard icon={<ArrowRightLeft size={18} />} label="Imports" value={stats.total_imports || 0} />
      </div>

      <div className="mt-2">
        <h4 className="text-sm text-textSecondary mb-2">Language Breakdown</h4>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/5 mb-3">
          {Object.entries(stats.languages || {}).map(([lang, count]) => {
            const color = LANG_COLORS[lang.toLowerCase()] || LANG_COLORS.unknown;
            const percent = (count / totalLangCount) * 100;
            return <div key={lang} className="h-full" style={{ width: `${percent}%`, backgroundColor: color }} title={`${lang}: ${count}`} />;
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(stats.languages || {}).map(([lang]) => (
             <div key={lang} className="flex items-center gap-1 text-textSecondary">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[lang.toLowerCase()] || LANG_COLORS.unknown }}></span>
               {lang}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
