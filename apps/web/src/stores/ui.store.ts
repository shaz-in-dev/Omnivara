import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Notifications panel
  notificationsPanelOpen: boolean;
  toggleNotificationsPanel: () => void;
  closeNotificationsPanel: () => void;

  // AI Copilot panel
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;

  // Active modal
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()(
  persist<UiState>(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((s: UiState) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

      // Command Palette
      commandPaletteOpen: false,
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((s: UiState) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      // Theme
      theme: 'system',
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),

      // Notifications
      notificationsPanelOpen: false,
      toggleNotificationsPanel: () => set((s: UiState) => ({ notificationsPanelOpen: !s.notificationsPanelOpen })),
      closeNotificationsPanel: () => set({ notificationsPanelOpen: false }),

      // AI Copilot
      copilotOpen: false,
      setCopilotOpen: (open: boolean) => set({ copilotOpen: open }),
      toggleCopilot: () => set((s: UiState) => ({ copilotOpen: !s.copilotOpen })),

      // Modal
      activeModal: null,
      openModal: (modalId: string) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'omnivara-ui',
      partialize: (state: UiState) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }) as UiState,
    },
  ),
);
