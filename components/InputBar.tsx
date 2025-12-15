import React from 'react';

interface InputBarProps {
  onSubmit: (text: string) => void;
  choices: string[];
  isProcessing: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSubmit, choices, isProcessing }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 p-4 z-40 pb-6 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => onSubmit(choice)}
              disabled={isProcessing}
              className={`
                group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 md:p-4 text-left transition-all hover:border-zinc-500 hover:bg-zinc-800
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isProcessing ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                 <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200">
                   {index + 1}
                 </span>
                 <span className="font-serif text-sm text-zinc-300 group-hover:text-zinc-100">
                    {choice}
                 </span>
              </div>
            </button>
          ))}
          {choices.length === 0 && !isProcessing && (
              <div className="col-span-1 md:col-span-2 text-center text-zinc-500 text-sm font-mono italic p-2">
                 No options available.
              </div>
          )}
        </div>
        {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/20 backdrop-blur-[1px] z-10 pointer-events-none">
                <span className="text-xs font-mono tracking-widest text-zinc-500 animate-pulse">THINKING...</span>
            </div>
        )}
      </div>
    </div>
  );
};