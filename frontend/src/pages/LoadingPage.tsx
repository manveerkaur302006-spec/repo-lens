import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';
import ProgressTracker from '../components/ProgressTracker';

export default function LoadingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { status, progress, currentStep, error } = useAnalysis(jobId || null);

  useEffect(() => {
    if (status === 'completed' && jobId) {
      navigate(`/analysis/${jobId}`);
    }
  }, [status, jobId, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen">
      <div className="w-full max-w-xl glass-panel p-12 flex flex-col items-center text-center animate-slide-up">
        <h2 className="text-2xl font-bold mb-8">Analyzing Repository...</h2>
        
        <ProgressTracker progress={progress} currentStep={currentStep} status={status} />
        
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 w-full text-left">
            <p className="font-semibold mb-1">Analysis Failed:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
