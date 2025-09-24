import { useEffect } from 'react';

export function useKeyboardShortcuts(callbacks: { [key: string]: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (callbacks[e.key]) {
        callbacks[e.key]();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}
