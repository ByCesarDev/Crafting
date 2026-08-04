import { useState } from "react";

import { ArrowLeftIcon, FolderPlusIcon } from "lucide-react";

import { useSettingsStore } from "@/stores/settings";
import { selectMinecraftVersion } from "@/stores/settings/selectors";

interface AddAddonFormProps {
  onClose: () => void;
  onAddonCreated: (groupName: string) => void;
}

export const AddAddonForm = ({ onClose, onAddonCreated }: AddAddonFormProps) => {
  const minecraftVersion = useSettingsStore(selectMinecraftVersion);
  const term = minecraftVersion === "bedrock" ? "Addon" : "Mod";

  const [addonName, setAddonName] = useState("");

  const handleCreate = () => {
    const trimmed = addonName.trim();
    if (!trimmed) return;
    onAddonCreated(trimmed);
    onClose();
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded p-1 transition-colors"
          onClick={onClose}
        >
          <ArrowLeftIcon size={16} />
        </button>
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <FolderPlusIcon size={16} className="text-primary" />
          New {term} Folder
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          {term} Name
          <input
            type="text"
            placeholder="e.g. Custom Tools..."
            value={addonName}
            onChange={(e) => setAddonName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            className="border-input bg-background text-foreground focus:ring-ring rounded-md border px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-inset"
            autoFocus
          />
        </label>

        <button
          type="button"
          disabled={addonName.trim().length === 0}
          onClick={handleCreate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary cursor-pointer rounded-md border px-3 py-2 text-xs font-medium shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create {term} Folder
        </button>
      </div>
    </div>
  );
};
