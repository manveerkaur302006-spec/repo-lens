import { useParams } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';
import { AnalysisProvider, useAnalysisContext } from '../context/AnalysisContext';
import HeaderBar from '../components/HeaderBar';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import OverviewTab from '../components/tabs/OverviewTab';
import ArchitectureTab from '../components/tabs/ArchitectureTab';
import DependenciesTab from '../components/tabs/DependenciesTab';
import GraphTab from '../components/tabs/GraphTab';
import { Loader2 } from 'lucide-react';

function AnalysisDashboard() {
  const { activeTab } = useAnalysisContext();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Header */}
      <HeaderBar />

      {/* Three-panel body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Center Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tab bar */}
          <div className="shrink-0 flex items-center gap-0.5 px-4 pt-2 border-b border-white/[0.06]">
            <TabButton id="overview" label="Overview" />
            <TabButton id="architecture" label="Architecture" />
            <TabButton id="dependencies" label="Dependencies" />
            <TabButton id="graph" label="Graph" />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'architecture' && <ArchitectureTab />}
            {activeTab === 'dependencies' && <DependenciesTab />}
            {activeTab === 'graph' && <GraphTab />}
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}

function TabButton({ id, label }: { id: string; label: string }) {
  const { activeTab, setActiveTab } = useAnalysisContext();
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`px-4 py-2.5 text-xs font-medium transition-all relative
        ${isActive
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-indigo-500 rounded-full" />
      )}
    </button>
  );
}

export default function AnalysisPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { report, graph, files, error, status, progress, currentStep } = useAnalysis(jobId || null);

  if (error && status === 'failed') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!report || !graph) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0e1a] gap-4">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <div className="text-center space-y-1">
          <p className="text-sm text-white font-medium">{currentStep || 'Analyzing...'}</p>
          <p className="text-xs text-slate-500">{progress}% complete</p>
        </div>
        <div className="w-48 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <AnalysisProvider report={report} graph={graph} files={files} jobId={jobId!}>
      <AnalysisDashboard />
    </AnalysisProvider>
  );
}
