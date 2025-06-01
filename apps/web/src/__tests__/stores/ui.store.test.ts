import { act, renderHook } from '@testing-library/react';
import { useUiStore } from '@/stores/ui.store';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      theme: 'system',
      notificationsPanelOpen: false,
      copilotOpen: false,
      activeModal: null,
    });
  });

  describe('sidebar', () => {
    it('toggles collapsed state', () => {
      const { result } = renderHook(() => useUiStore());
      expect(result.current.sidebarCollapsed).toBe(false);
      act(() => result.current.toggleSidebar());
      expect(result.current.sidebarCollapsed).toBe(true);
      act(() => result.current.toggleSidebar());
      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it('sets collapsed directly', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.setSidebarCollapsed(true));
      expect(result.current.sidebarCollapsed).toBe(true);
    });
  });

  describe('command palette', () => {
    it('opens and closes command palette', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.openCommandPalette());
      expect(result.current.commandPaletteOpen).toBe(true);
      act(() => result.current.closeCommandPalette());
      expect(result.current.commandPaletteOpen).toBe(false);
    });

    it('toggles command palette', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.toggleCommandPalette());
      expect(result.current.commandPaletteOpen).toBe(true);
    });
  });

  describe('theme', () => {
    it('sets theme', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.setTheme('dark'));
      expect(result.current.theme).toBe('dark');
      act(() => result.current.setTheme('light'));
      expect(result.current.theme).toBe('light');
    });
  });

  describe('notifications panel', () => {
    it('toggles notifications panel', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.toggleNotificationsPanel());
      expect(result.current.notificationsPanelOpen).toBe(true);
      act(() => result.current.closeNotificationsPanel());
      expect(result.current.notificationsPanelOpen).toBe(false);
    });
  });

  describe('AI copilot', () => {
    it('sets copilot open state', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.setCopilotOpen(true));
      expect(result.current.copilotOpen).toBe(true);
      act(() => result.current.toggleCopilot());
      expect(result.current.copilotOpen).toBe(false);
    });
  });

  describe('modal', () => {
    it('opens and closes modal', () => {
      const { result } = renderHook(() => useUiStore());
      act(() => result.current.openModal('create-lead'));
      expect(result.current.activeModal).toBe('create-lead');
      act(() => result.current.closeModal());
      expect(result.current.activeModal).toBeNull();
    });
  });
});
