import { AlertTriangleIcon, FolderIcon, Trash2Icon, XIcon } from "lucide-react";

import { deleteCustomItemAndClearRecipeRefs } from "@/lib/editor-actions";
import { useCustomItemStore } from "@/stores/custom-item";

interface DeleteAddonModalProps {
  open: boolean;
  groupName: string;
  itemCount: number;
  termSingular: string; // "Addon" or "Mod"
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAddonModal = ({
  open,
  groupName,
  itemCount,
  termSingular,
  onClose,
  onDeleted,
}: DeleteAddonModalProps) => {
  const deleteCustomItemGroup = useCustomItemStore((state) => state.deleteCustomItemGroup);
  const customItems = useCustomItemStore((state) => state.customItems);

  if (!open) return null;

  const handleDeleteWithItems = () => {
    // Delete all items belonging to this group and clear recipe refs
    const itemsInGroup = customItems.filter(
      (item) => (item.group?.trim() || "General").toLowerCase() === groupName.toLowerCase(),
    );

    for (const item of itemsInGroup) {
      deleteCustomItemAndClearRecipeRefs(item.uid);
    }

    // Delete the group
    deleteCustomItemGroup(groupName, true);
    onDeleted();
    onClose();
  };

  const handleMoveToGeneral = () => {
    // Keep items, just remove group (moves to General)
    deleteCustomItemGroup(groupName, false);
    onDeleted();
    onClose();
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background border-border text-foreground animate-in zoom-in-95 relative flex w-full max-w-md flex-col gap-4 rounded-xl border p-6 shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold">Delete {termSingular} Folder</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-accent text-muted-foreground hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-500">
          <FolderIcon size={24} className="shrink-0" />
          <div className="text-xs">
            <span className="block text-sm font-semibold">{groupName}</span>
            <span>
              Contains {itemCount} {itemCount === 1 ? "custom item" : "custom items"}
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          How would you like to delete the{" "}
          <span className="text-foreground font-semibold">"{groupName}"</span>{" "}
          {termSingular.toLowerCase()} folder?
        </p>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDeleteWithItems}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <Trash2Icon size={16} />
            Delete Folder AND All {itemCount} Items
          </button>

          <button
            type="button"
            onClick={handleMoveToGeneral}
            className="border-input bg-background hover:bg-accent text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
          >
            Delete Folder & Move Items to General
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer py-1 text-center text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
