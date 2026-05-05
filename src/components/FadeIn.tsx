import { type ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'none';
}

export function FadeIn({ children, className = '', delay = 0, direction = 'up' }: FadeInProps) {
  const { ref, inView } = useInView();
  const translate = direction === 'up' ? 'translateY(16px)' : direction === 'down' ? 'translateY(-16px)' : 'none';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : translate,
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
