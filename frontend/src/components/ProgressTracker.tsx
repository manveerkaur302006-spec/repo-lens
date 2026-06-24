interface ProgressTrackerProps {
  progress: number;
  currentStep: string;
  status: string;
}

export default function ProgressTracker({ progress, currentStep, status }: ProgressTrackerProps) {
  const isActive = status !== 'completed' && status !== 'failed';
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center text-sm text-textSecondary">
        <span className="font-medium text-textPrimary">{currentStep || 'Initializing...'}</span>
        <span className="tabular-nums font-medium">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out ${isActive ? 'animate-shimmer bg-[length:200%_100%]' : ''}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
