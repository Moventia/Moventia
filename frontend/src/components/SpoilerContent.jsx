import { useState } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';

export function SpoilerContent({ children, className = '' }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm animate-in fade-in duration-300">
          {children}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className={`w-full text-left cursor-pointer group ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-all duration-200">
        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
        <span className="text-sm text-yellow-500/90 font-medium">
          This review contains spoilers
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-yellow-500/60 group-hover:text-yellow-500/90 transition-colors">
          <Eye className="h-3.5 w-3.5" />
          Reveal
        </span>
      </div>
    </button>
  );
}
