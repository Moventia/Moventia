import { useState } from 'react';
import { EyeOff, Unlock } from 'lucide-react';

export function SpoilerContent({ children, className = '' }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div className={`relative ${className}`}>
        <p
          className="text-muted-foreground text-sm mb-3"
          style={{
            animation: 'spoilerReveal 350ms ease forwards',
          }}
        >
          {children}
        </p>
        <style>{`
          @keyframes spoilerReveal {
            from { filter: blur(8px); opacity: 0.4; }
            to   { filter: blur(0px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`relative mb-3 cursor-pointer select-none ${className}`}
      onClick={() => setRevealed(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setRevealed(true)}
      title="Click to reveal spoiler"
    >
      {/* Blurred text behind */}
      <p
        className="text-muted-foreground text-sm"
        style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {children}
      </p>

      {/* Centered overlay badge */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(15, 13, 10, 0.75)',
            border: '1px solid rgba(196, 156, 85, 0.35)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 0 16px rgba(196, 156, 85, 0.1)',
            transition: 'border-color 200ms, box-shadow 200ms',
          }}
          className="group-hover:border-primary/60"
        >
          <EyeOff
            style={{ width: 13, height: 13, color: '#c49c55', flexShrink: 0 }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#c49c55', letterSpacing: '0.04em' }}>
            SPOILER
          </span>
          <span style={{ width: '1px', height: '12px', background: 'rgba(196,156,85,0.3)' }} />
          <Unlock style={{ width: 12, height: 12, color: 'rgba(196,156,85,0.6)', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'rgba(196,156,85,0.6)' }}>click to reveal</span>
        </div>
      </div>
    </div>
  );
}
