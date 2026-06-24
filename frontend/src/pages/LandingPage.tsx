import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, MessageSquareCode, Activity } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import UrlInput from '../components/UrlInput';
import { apiClient } from '../api/client';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { job_id } = await apiClient.analyzeRepo(url);
      navigate(`/loading/${job_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col items-center animate-slide-up">
        <HeroSection />
        <UrlInput onSubmit={handleAnalyze} isLoading={isLoading} error={error} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-primary/20">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary">
              <Network size={32} />
            </div>
            <h3 className="text-xl font-bold">Architecture Graphs</h3>
            <p className="text-textSecondary text-sm">Visualize file dependencies and codebase structure instantly.</p>
          </div>
          
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-primary/20">
            <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
              <MessageSquareCode size={32} />
            </div>
            <h3 className="text-xl font-bold">AI Q&A</h3>
            <p className="text-textSecondary text-sm">Ask questions about the code and get precise, grounded answers.</p>
          </div>
          
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-primary/20">
            <div className="p-4 rounded-2xl bg-accent/10 text-accent">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-bold">Code Metrics</h3>
            <p className="text-textSecondary text-sm">Understand repository health with rich, interactive stats.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
