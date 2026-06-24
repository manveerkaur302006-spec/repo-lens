import { BookOpen } from 'lucide-react';
import { ReportResponse } from '../types';

interface SummaryPanelProps {
  summary: ReportResponse['summary'];
}

export default function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen size={20} className="text-primary" />
        Repository Summary
      </h3>
      
      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-primary uppercase tracking-wider font-semibold">Purpose</h4>
        <p className="text-textPrimary text-sm leading-relaxed">{summary.purpose}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-primary uppercase tracking-wider font-semibold">Tech Stack</h4>
        <div className="flex flex-wrap gap-2">
          {summary.tech_stack.map(tech => (
            <span key={tech} className="bg-primary/15 border border-primary/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-primary uppercase tracking-wider font-semibold">Architecture</h4>
        <p className="text-textPrimary text-sm leading-relaxed">{summary.architecture}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-primary uppercase tracking-wider font-semibold">Strengths</h4>
        <ul className="list-disc list-inside text-textSecondary text-sm space-y-1">
          {summary.strengths.map(s => <li key={s}>{s}</li>)}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-primary uppercase tracking-wider font-semibold">Weaknesses</h4>
        <ul className="list-disc list-inside text-textSecondary text-sm space-y-1">
          {summary.weaknesses.map(w => <li key={w}>{w}</li>)}
        </ul>
      </div>
    </div>
  );
}
