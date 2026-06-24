import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ReportResponse, GraphData, FileTreeNode } from '../types';

export function useAnalysis(jobId: string | null) {
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [files, setFiles] = useState<FileTreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let intervalId: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const res = await apiClient.getStatus(jobId);
        setStatus(res.status);
        setProgress(res.progress);
        setCurrentStep(res.current_step);
        
        if (res.error_message) {
          setError(res.error_message);
        }

        if (res.status === 'completed') {
          clearInterval(intervalId);
          const [reportData, graphData, filesData] = await Promise.all([
            apiClient.getReport(jobId),
            apiClient.getGraph(jobId),
            apiClient.getFiles(jobId)
          ]);
          setReport(reportData);
          setGraph(graphData);
          setFiles(filesData.tree);
        } else if (res.status === 'failed') {
          clearInterval(intervalId);
          setError(res.error_message || 'Analysis failed');
        }
      } catch (err: any) {
        setError(err.message || 'Error checking status');
        clearInterval(intervalId);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [jobId]);

  return { status, progress, currentStep, report, graph, files, error };
}
