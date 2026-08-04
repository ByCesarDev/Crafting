import { AlertVariant, useAlertStore } from "@/stores/alert";

export type ConfirmationBypassEvent = {
  shiftKey: boolean;
};

export const showAlert = (
  message: string,
  options?: { title?: string; variant?: AlertVariant },
): Promise<boolean> => {
  return useAlertStore.getState().showAlert({
    message,
    title: options?.title,
    variant: options?.variant ?? "info",
    isConfirm: false,
  });
};

export const showConfirm = (
  message: string,
  options?: {
    title?: string;
    variant?: AlertVariant;
    confirmText?: string;
    cancelText?: string;
  },
): Promise<boolean> => {
  return useAlertStore.getState().showAlert({
    message,
    title: options?.title ?? "Confirmation Required",
    variant: options?.variant ?? "warning",
    confirmText: options?.confirmText ?? "Confirm",
    cancelText: options?.cancelText ?? "Cancel",
    isConfirm: true,
  });
};

export const confirmAction = (
  message: string,
  event?: ConfirmationBypassEvent,
  options?: {
    title?: string;
    variant?: AlertVariant;
    confirmText?: string;
    cancelText?: string;
  },
): Promise<boolean> => {
  if (event?.shiftKey) {
    return Promise.resolve(true);
  }

  return showConfirm(message, options);
};
