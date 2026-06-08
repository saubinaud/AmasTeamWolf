import { useEffect, useState } from 'react';

interface AnimacionDesbloqueoProps {
  claseTitulo: string;
  onComplete: () => void;
}

const CONFETTI_COLORS = ['#FA7B21', '#FCA929', '#FFD700', '#FF6B35', '#FFFFFF'];

const confetti = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 0.5,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  size: 4 + Math.random() * 8,
}));

export function AnimacionDesbloqueo({ claseTitulo, onComplete }: AnimacionDesbloqueoProps) {
  const [phase, setPhase] = useState<'shake' | 'burst' | 'celebrate'>('shake');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('burst'), 600);
    const t2 = setTimeout(() => setPhase('celebrate'), 1200);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      {/* Confetti particles */}
      {phase === 'celebrate' && confetti.map(c => (
        <div
          key={c.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: c.size > 8 ? '2px' : '50%',
            animationDelay: `${c.delay}s`,
            animationDuration: `${2 + Math.random() * 1.5}s`,
          }}
        />
      ))}

      {/* Center content */}
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        {/* Lock icon phases */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Phase: shake */}
          {phase === 'shake' && (
            <div className="animate-unlock-shake">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FA7B21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          )}

          {/* Phase: burst */}
          {phase === 'burst' && (
            <div className="animate-unlock-burst">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FCA929" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" opacity="0.3" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" opacity="0.3" />
              </svg>
              {/* Burst particles */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <div
                  key={angle}
                  className="absolute w-2 h-2 rounded-full bg-[#FCA929] animate-burst-particle"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${angle}deg) translateY(-30px)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Phase: celebrate — golden star */}
          {phase === 'celebrate' && (
            <div className="animate-star-appear">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="#FFD700" stroke="#FCA929" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
            </div>
          )}
        </div>

        {/* Text */}
        {phase === 'celebrate' && (
          <div className="animate-fade-in">
            <p className="text-3xl mb-2">🐺</p>
            <h2 className="text-xl font-bold text-white mb-1">
              Clase desbloqueada!
            </h2>
            <p className="text-[#FCA929] text-sm font-medium">{claseTitulo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
