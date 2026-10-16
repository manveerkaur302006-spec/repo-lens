import { AnalyzeResponse, StatusResponse, ReportResponse, GraphData, FileTreeNode, QueryResponse } from '../types';

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
// Accept both an API origin and a full /api URL so existing deployments keep working.
const API_URL = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;

export const apiClient = {
  async analyzeRepo(repoUrl: string): Promise<AnalyzeResponse> {
    const res = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl })
    });
    if (!res.ok) throw new Error('Failed to start analysis');
    return res.json();
  },

  async getStatus(jobId: string): Promise<StatusResponse> {
    const res = await fetch(`${API_URL}/status/${jobId}`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },

  async getReport(jobId: string): Promise<ReportResponse> {
    const res = await fetch(`${API_URL}/report/${jobId}`);
    if (!res.ok) throw new Error('Failed to get report');
    return res.json();
  },

  async getGraph(jobId: string): Promise<GraphData> {
    const res = await fetch(`${API_URL}/graph/${jobId}`);
    if (!res.ok) throw new Error('Failed to get graph');
    return res.json();
  },

  async getFiles(jobId: string): Promise<{tree: FileTreeNode}> {
    const res = await fetch(`${API_URL}/files/${jobId}`);
    if (!res.ok) throw new Error('Failed to get files');
    return res.json();
  },

  async askQuestion(jobId: string, question: string): Promise<QueryResponse> {
    const res = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, question })
    });
    if (!res.ok) throw new Error('Failed to get answer');
    return res.json();
  }
};
