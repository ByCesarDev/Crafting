import { create } from "zustand";

export type AlertVariant = "info" | "warning" | "error" | "destructive" | "confirm";

export interface AlertModalOptions {
  title?: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

export interface ActiveAlert extends AlertModalOptions {
  id: string;
  resolve: (value: boolean) => void;
}

interface AlertStoreState {
  alert: ActiveAlert | null;
  isExiting: boolean;
  showAlert: (options: AlertModalOptions) => Promise<boolean>;
  closeAlert: (result: boolean) => void;
  finishClose: () => void;
}

let alertCounter = 0;

export const useAlertStore = create<AlertStoreState>((set, get) => ({
  alert: null,
  isExiting: false,

  showAlert: (options) => {
    return new Promise<boolean>((resolve) => {
      alertCounter += 1;
      set({
        alert: {
          ...options,
          id: `alert-${alertCounter}`,
          resolve,
        },
        isExiting: false,
      });
    });
  },

  closeAlert: (result) => {
    const currentAlert = get().alert;
    if (!currentAlert || get().isExiting) return;

    set({ isExiting: true });

    setTimeout(() => {
      const active = get().alert;
      if (active) {
        active.resolve(result);
      }
      set({ alert: null, isExiting: false });
    }, 220);
  },

  finishClose: () => {
    const currentAlert = get().alert;
    if (currentAlert) {
      currentAlert.resolve(false);
    }
    set({ alert: null, isExiting: false });
  },
}));
