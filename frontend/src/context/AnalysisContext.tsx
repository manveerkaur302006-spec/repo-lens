import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReportResponse, GraphData, FileTreeNode, GraphNode } from '../types';

export type CenterTab = 'overview' | 'architecture' | 'dependencies' | 'graph';

interface SelectedEntity {
  id: string;
  name: string;
  type: string;
  path?: string;
  loc?: number;
  dependencies?: string[];
  dependents?: string[];
}

interface AnalysisContextType {
  report: ReportResponse | null;
  graph: GraphData | null;
  files: FileTreeNode | null;
  jobId: string;
  activeTab: CenterTab;
  setActiveTab: (tab: CenterTab) => void;
  selectedEntity: SelectedEntity | null;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function useAnalysisContext() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysisContext must be used within AnalysisProvider');
  return ctx;
}

interface AnalysisProviderProps {
  children: ReactNode;
  report: ReportResponse | null;
  graph: GraphData | null;
  files: FileTreeNode | null;
  jobId: string;
}

export function AnalysisProvider({ children, report, graph, files, jobId }: AnalysisProviderProps) {
  const [activeTab, setActiveTab] = useState<CenterTab>('overview');
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AnalysisContext.Provider value={{
      report, graph, files, jobId,
      activeTab, setActiveTab,
      selectedEntity, setSelectedEntity,
      sidebarCollapsed, setSidebarCollapsed,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}
