import { useState } from 'react';
import { useAnalysisContext } from '../context/AnalysisContext';
import ChatPanel from './ChatPanel';
import {
  Compass, Layers, Shield, Network, Database, RefreshCw,
  Zap, FileSearch, MessageSquare, Info, X,
  FileCode, ArrowRightLeft
} from 'lucide-react';

const SUGGESTED_ACTIONS = [
  { icon: Compass, label: 'Find Entry Point', prompt: 'What is the main entry point of this repository? How does the application start?' },
  { icon: Layers, label: 'Explain Architecture', prompt: 'Explain the architecture pattern used in this repository. What are the main layers and how do they interact?' },
  { icon: Shield, label: 'Auth Flow', prompt: 'Describe the authentication flow in this repository. What middleware or guards are used?' },
  { icon: Network, label: 'List APIs', prompt: 'List all API endpoints in this repository with their HTTP methods, paths, and descriptions.' },
  { icon: Database, label: 'Database Layer', prompt: 'Describe the database layer. What models/entities exist and how do they relate to each other?' },
  { icon: RefreshCw, label: 'Circular Deps', prompt: 'Are there any circular dependencies in this codebase? Which modules depend on each other cyclically?' },
  { icon: Zap, label: 'Hotspots', prompt: 'What are the most complex or frequently imported files? Where are the code hotspots?' },
  { icon: FileSearch, label: 'Important Files', prompt: 'What are the most important files in this repository and why?' },
];

export default function RightSidebar() {
  const { jobId, selectedEntity } = useAnalysisContext();
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  return (
    <div className="w-[320px] shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0d1117]/50 overflow-hidden">

      {/* Context Panel (when entity selected) */}
      {selectedEntity && (
        <div className="shrink-0 border-b border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              <Info size={12} />
              Selected
            </div>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-indigo-400" />
              <span className="text-sm text-white font-mono truncate">{selectedEntity.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">Type</div>
              <div className="text-slate-300">{selectedEntity.type}</div>
              {selectedEntity.path && (
                <>
                  <div className="text-slate-500">Path</div>
                  <div className="text-slate-300 truncate" title={selectedEntity.path}>{selectedEntity.path}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      <div className="shrink-0 border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
          <Zap size={12} />
          Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {SUGGESTED_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => setPendingPrompt(action.prompt)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-300 transition-all text-left"
              >
                <Icon size={12} className="shrink-0" />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatPanel jobId={jobId} initialPrompt={pendingPrompt} onPromptConsumed={() => setPendingPrompt(null)} />
      </div>
    </div>
  );
}
