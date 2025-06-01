'use client';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui.store';

export function useKeyboardShortcuts() {
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // ⌘K / Ctrl+K — command palette
      if (modifier && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ⌘B / Ctrl+B — toggle sidebar
      if (modifier && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCommandPalette, toggleSidebar]);
}
