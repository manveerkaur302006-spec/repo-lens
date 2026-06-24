import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function UrlInput({ onSubmit, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8 w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <form className="flex w-full max-w-2xl gap-3" onSubmit={handleSubmit}>
        <input
          type="url"
          className="flex-1 px-6 py-4 rounded-xl border border-glassBorder bg-white/5 text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          placeholder="https://github.com/owner/repository"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="px-8 py-4 rounded-xl border-none bg-gradient-to-br from-primary to-indigo-400 text-white font-semibold text-lg cursor-pointer transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <>Analyzing <Loader2 className="animate-spin" size={20} /></>
          ) : (
            <>Analyze <ArrowRight size={20} /></>
          )}
        </button>
      </form>
      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-lg w-full max-w-2xl text-left border border-red-400/20">
          {error}
        </div>
      )}
    </div>
  );
}
