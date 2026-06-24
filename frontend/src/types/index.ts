export interface AnalyzeResponse {
  job_id: string;
}

export interface StatusResponse {
  status: string;
  progress: number;
  current_step: string;
  error_message?: string;
}

export interface ReportResponse {
  summary: {
    purpose: string;
    tech_stack: string[];
    architecture: string;
    strengths: string[];
    weaknesses: string[];
  };
  stats: {
    total_files: number;
    total_loc: number;
    total_functions: number;
    total_classes: number;
    total_imports: number;
    languages: Record<string, number>;
  };
}

export interface QueryResponse {
  answer: string;
  sources: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  name: string;
  path?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: string;
  children?: FileTreeNode[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: string[];
}
