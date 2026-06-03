import { create } from "zustand";

type UiStore = {
  isNavigationOpen: boolean;
  setNavigationOpen: (isOpen: boolean) => void;
  toggleNavigation: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  isNavigationOpen: false,
  setNavigationOpen: (isOpen) => set({ isNavigationOpen: isOpen }),
  toggleNavigation: () =>
    set((state) => ({ isNavigationOpen: !state.isNavigationOpen })),
}));
