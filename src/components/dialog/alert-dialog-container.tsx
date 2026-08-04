import { useEffect } from "react";
import { createPortal } from "react-dom";

import { AlertTriangleIcon, HelpCircleIcon, InfoIcon, ShieldAlertIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAlertStore } from "@/stores/alert";

export const AlertDialogContainer = () => {
  const alert = useAlertStore((state) => state.alert);
  const isExiting = useAlertStore((state) => state.isExiting);
  const closeAlert = useAlertStore((state) => state.closeAlert);

  useEffect(() => {
    if (!alert) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAlert(false);
      } else if (e.key === "Enter") {
        closeAlert(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [alert, closeAlert]);

  if (!alert || typeof document === "undefined") {
    return null;
  }

  const variant = alert.variant ?? "info";

  const getIcon = () => {
    switch (variant) {
      case "destructive":
      case "error":
        return <ShieldAlertIcon className="text-destructive h-6 w-6 shrink-0" />;
      case "warning":
        return <AlertTriangleIcon className="text-warning h-6 w-6 shrink-0" />;
      case "confirm":
        return <HelpCircleIcon className="text-primary h-6 w-6 shrink-0" />;
      case "info":
      default:
        return <InfoIcon className="text-primary h-6 w-6 shrink-0" />;
    }
  };

  const getDefaultTitle = () => {
    switch (variant) {
      case "destructive":
      case "error":
        return "Action Required";
      case "warning":
        return "Warning";
      case "confirm":
        return "Confirmation Required";
      case "info":
      default:
        return "Notice";
    }
  };

  const title = alert.title ?? getDefaultTitle();
  const confirmText = alert.confirmText ?? (alert.isConfirm ? "Confirm" : "Accept");
  const cancelText = alert.cancelText ?? "Cancel";

  const isDestructive = variant === "destructive" || variant === "error";

  return createPortal(
    <div
      className={cn(
        "bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs",
        isExiting ? "animate-backdrop-exit" : "animate-backdrop-enter",
      )}
      onClick={() => closeAlert(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "border-border bg-background text-foreground flex w-full max-w-md flex-col overflow-hidden rounded-xl border shadow-xl",
          isExiting ? "animate-modal-exit" : "animate-modal-enter",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border flex items-start justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md p-1 transition-colors"
            onClick={() => closeAlert(false)}
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="scrollbar-app max-h-[60vh] overflow-y-auto px-5 py-4">
          <div className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
            {alert.message}
          </div>
        </div>

        <div className="border-border bg-muted/20 flex items-center justify-end gap-2.5 border-t px-5 py-3.5">
          {alert.isConfirm && (
            <button
              type="button"
              className="border-border hover:bg-accent text-foreground cursor-pointer rounded-md border px-3.5 py-1.5 text-xs font-medium transition-colors"
              onClick={() => closeAlert(false)}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-md border px-4 py-1.5 text-xs font-medium shadow-xs transition-colors",
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive"
                : "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
            )}
            onClick={() => closeAlert(true)}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
