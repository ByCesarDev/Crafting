import { useMemo, useRef, useState } from "react";

import { DownloadIcon, HardDriveIcon, UploadIcon, XIcon } from "lucide-react";

import { Select } from "@/components/ui/select";
import { downloadBackupFile, parseAndImportBackup } from "@/lib/backup";
import { useAlertStore } from "@/stores/alert";
import { useCustomItemStore } from "@/stores/custom-item";
import { useSettingsStore } from "@/stores/settings";
import { selectMinecraftVersion } from "@/stores/settings/selectors";

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
  initialGroup?: string;
}

export const BackupModal = ({ open, onClose, initialGroup }: BackupModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedExportGroup, setSelectedExportGroup] = useState<string>(initialGroup ?? "all");

  const showAlert = useAlertStore((state) => state.showAlert);
  const groups = useCustomItemStore((state) => state.groups);
  const customItems = useCustomItemStore((state) => state.customItems);
  const version = useSettingsStore(selectMinecraftVersion);

  const addonOrModLabel = version === "bedrock" ? "Addon" : "Mod";

  const allAvailableGroups = useMemo(() => {
    const items = customItems ?? [];
    const itemGroups = items.map((i) => i.group).filter((g): g is string => Boolean(g));
    const set = new Set(["General", ...(groups ?? []), ...itemGroups]);
    return Array.from(set);
  }, [groups, customItems]);

  if (!open) return null;

  const handleExport = () => {
    const groupToExport = selectedExportGroup === "all" ? undefined : selectedExportGroup;
    downloadBackupFile(groupToExport);

    const groupNameText =
      selectedExportGroup === "all" ? "All Addons/Mods" : `"${selectedExportGroup}"`;
    void showAlert({
      title: "Backup Exported",
      message: `Your backup JSON file for ${groupNameText} has been generated and downloaded.`,
      variant: "info",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      setIsImporting(false);
      const content = event.target?.result as string;
      if (!content) {
        void showAlert({
          title: "Import Error",
          message: "Failed to read the selected file.",
          variant: "error",
        });
        return;
      }

      const result = parseAndImportBackup(content);
      if (result.success && result.summary) {
        const { items, groups, tags, recipes } = result.summary;
        void showAlert({
          title: "Import Successful",
          message: `Backup restored successfully!\n\n• ${items} Custom Items\n• ${groups} ${addonOrModLabel} Folders\n• ${tags} Tags\n• ${recipes} Recipes`,
          variant: "info",
        });
        onClose();
      } else {
        void showAlert({
          title: "Import Error",
          message: result.error || "Failed to parse backup file.",
          variant: "error",
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.onerror = () => {
      setIsImporting(false);
      void showAlert({
        title: "Import Error",
        message: "An error occurred while reading the file.",
        variant: "error",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsText(file);
  };

  const groupOptions = [
    { value: "all", label: `All ${addonOrModLabel}s (Full Backup)` },
    ...allAvailableGroups.map((g) => ({
      value: g,
      label: `${addonOrModLabel} Folder: "${g}"`,
    })),
  ];

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
            <HardDriveIcon size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Import & Export Data</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-accent text-muted-foreground hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Transfer your custom items (with images/textures), folders, tags, and recipes to another
          device or create a backup.
        </p>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Select {addonOrModLabel} to Export:
            <Select
              options={groupOptions}
              value={selectedExportGroup}
              onChange={(e) => setSelectedExportGroup(e.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={handleExport}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <DownloadIcon size={16} />
            Export Selected {addonOrModLabel} (.json)
          </button>

          <div className="relative my-1 flex items-center justify-center border-t">
            <span className="bg-background text-muted-foreground absolute px-2 text-[11px] font-medium uppercase">
              Or Restore
            </span>
          </div>

          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className="border-input bg-background hover:bg-accent text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <UploadIcon size={16} />
            {isImporting ? "Importing..." : "Import Backup (.json)"}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="text-muted-foreground border-t pt-3 text-center text-xs">
          Importing merges items and folders into your workspace without deleting existing ones.
        </div>
      </div>
    </div>
  );
};
