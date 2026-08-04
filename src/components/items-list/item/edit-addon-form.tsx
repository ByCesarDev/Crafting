import { useState } from "react";

import { ArrowLeftIcon, FolderIcon, Trash2Icon } from "lucide-react";

import { useCustomItemStore } from "@/stores/custom-item";
import { useSettingsStore } from "@/stores/settings";
import { selectMinecraftVersion } from "@/stores/settings/selectors";

interface EditAddonFormProps {
  groupName: string;
  onClose: () => void;
  onRenamed: (newGroupName: string) => void;
  onDeleted: () => void;
}

export const EditAddonForm = ({ groupName, onClose, onRenamed, onDeleted }: EditAddonFormProps) => {
  const minecraftVersion = useSettingsStore(selectMinecraftVersion);
  const renameCustomItemGroup = useCustomItemStore((state) => state.renameCustomItemGroup);
  const deleteCustomItemGroup = useCustomItemStore((state) => state.deleteCustomItemGroup);

  const term = minecraftVersion === "bedrock" ? "Addon" : "Mod";
  const [name, setName] = useState(groupName);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed !== groupName) {
      renameCustomItemGroup(groupName, trimmed);
      onRenamed(trimmed);
    }
    onClose();
  };

  const handleDelete = () => {
    deleteCustomItemGroup(groupName);
    onDeleted();
    onClose();
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded p-1 transition-colors"
            onClick={onClose}
          >
            <ArrowLeftIcon size={16} />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <FolderIcon size={16} className="text-primary" />
            Edit {term} Folder
          </span>
        </div>

        <button
          type="button"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
          onClick={handleDelete}
        >
          <Trash2Icon size={13} />
          <span>Delete Folder</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          {term} Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            className="border-input bg-background text-foreground focus:ring-ring rounded-md border px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-inset"
            autoFocus
          />
        </label>

        <button
          type="button"
          disabled={name.trim().length === 0}
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary cursor-pointer rounded-md border px-3 py-2 text-xs font-medium shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
