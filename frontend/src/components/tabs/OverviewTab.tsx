import { useAnalysisContext } from '../../context/AnalysisContext';
import { BookOpen, Cpu, Shield, AlertTriangle, Zap, Code2 } from 'lucide-react';

export default function OverviewTab() {
  const { report } = useAnalysisContext();
  if (!report) return null;

  const { summary } = report;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Purpose card */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <BookOpen size={14} className="text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Purpose</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{summary.purpose}</p>
        </div>

        {/* Tech Stack + Architecture row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Tech Stack */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <Cpu size={14} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Tech Stack</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.tech_stack.map(tech => (
                <span key={tech} className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Architecture */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Code2 size={14} className="text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Architecture</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{summary.architecture}</p>
          </div>
        </div>

        {/* Strengths + Weaknesses row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Strengths */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Zap size={14} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {summary.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <Shield size={12} className="text-emerald-400 mt-1 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle size={14} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {summary.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <AlertTriangle size={12} className="text-amber-400 mt-1 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
