import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface ChatPanelProps {
  jobId: string;
  initialPrompt?: string | null;
  onPromptConsumed?: () => void;
}

export default function ChatPanel({ jobId, initialPrompt, onPromptConsumed }: ChatPanelProps) {
  const { messages, sendMessage, isLoading } = useChat(jobId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external prompt injection from Suggested Actions
  useEffect(() => {
    if (initialPrompt && !isLoading) {
      sendMessage(initialPrompt);
      onPromptConsumed?.();
    }
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
        <MessageSquare size={14} className="text-indigo-400" />
        <span className="text-xs font-semibold text-white">Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 mt-8 text-xs">
            Ask anything about the repository
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col max-w-[90%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
            <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-indigo-500 text-white rounded-br-sm' 
                : 'bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {msg.sources.map((src, i) => (
                  <span key={i} className="bg-white/[0.06] px-1.5 py-0.5 rounded text-[10px] text-slate-500 truncate max-w-[150px]" title={src}>
                    {src}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="self-start flex gap-1 p-3 bg-white/[0.04] rounded-xl rounded-bl-sm w-fit border border-white/[0.06]">
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="p-3 border-t border-white/[0.06] flex gap-2 shrink-0" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the repo..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-40"
          disabled={!input.trim() || isLoading}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
