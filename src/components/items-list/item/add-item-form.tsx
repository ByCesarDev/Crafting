import { useRef, useState } from "react";

import { ArrowLeftIcon } from "lucide-react";

import { Select } from "@/components/ui/select";
import { trackCustomItem } from "@/lib/analytics";
import {
  bedrockIdentifierHint,
  isValidNamespacedIdentifier,
  javaNamespacedIdentifierHint,
} from "@/lib/minecraft-identifier";
import { cn } from "@/lib/utils";
import { useCustomItemStore } from "@/stores/custom-item";
import { useSettingsStore } from "@/stores/settings";
import { selectMinecraftVersion } from "@/stores/settings/selectors";

import { ItemPreview } from "../../item/item-preview";
import { Slot } from "../../slot/slot";

interface AddItemFormProps {
  onClose: () => void;
  initialGroup?: string;
  availableGroups?: string[];
}

export const AddItemForm = ({ onClose, initialGroup, availableGroups }: AddItemFormProps) => {
  const minecraftVersion = useSettingsStore(selectMinecraftVersion);
  const addCustomItem = useCustomItemStore((state) => state.addCustomItem);
  const customItems = useCustomItemStore((state) => state.customItems);
  const storeGroups = useCustomItemStore((state) => state.groups) ?? [];

  const existingGroups = Array.from(
    new Set([
      ...storeGroups,
      ...(availableGroups ?? []),
      ...customItems.map((item) => item.group).filter((g): g is string => Boolean(g)),
    ]),
  ).filter((g) => g.trim().toLowerCase() !== "general" && g.trim() !== "");

  const [name, setName] = useState("");
  const [itemId, setItemId] = useState("");
  const [group, setGroup] = useState(initialGroup ?? "");
  const [texture, setTexture] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setTexture(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!name.trim() || !isValidNamespacedIdentifier(itemId, minecraftVersion)) return;

    const didCreate = addCustomItem({
      name,
      rawId: itemId,
      texture,
      version: minecraftVersion,
      group: group.trim() || undefined,
    });

    if (didCreate) {
      trackCustomItem({ action: "create", has_texture: texture.length > 0 });
    }

    setName("");
    setItemId("");
    setGroup("");
    setTexture("");
    onClose();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showItemIdError =
    itemId.trim().length > 0 && !isValidNamespacedIdentifier(itemId, minecraftVersion);
  const canAdd = name.trim().length > 0 && isValidNamespacedIdentifier(itemId, minecraftVersion);
  const identifierHint =
    minecraftVersion === "bedrock"
      ? `Use namespace:name (${bedrockIdentifierHint})`
      : javaNamespacedIdentifierHint;

  const groupTerm = minecraftVersion === "bedrock" ? "Addon" : "Mod";

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
        <span className="text-sm font-medium">New Item</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs sm:col-span-2">
          {groupTerm} / Group
          <Select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">General / Unassigned</option>
            {existingGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </label>

        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Name
          <input
            type="text"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-input bg-background text-foreground focus:ring-ring rounded-md border px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-inset"
          />
        </label>
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Id
          <input
            type="text"
            placeholder="namespace:item"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={showItemIdError}
            className={cn(
              "border-input bg-background text-foreground focus:ring-ring rounded-md border px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-inset",
              showItemIdError && "border-destructive focus:ring-destructive",
            )}
          />
          {showItemIdError && (
            <span className="text-destructive text-[10px]">{identifierHint}</span>
          )}
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-foreground text-xs font-medium">Texture</span>
        <div className="flex items-center gap-2">
          <label className="border-border text-muted-foreground hover:bg-accent flex-1 cursor-pointer rounded-md border border-dashed px-3 py-2 text-center text-xs transition-colors">
            {texture ? "Change texture" : "Select texture (.png)"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {texture && (
            <Slot width={32} height={32}>
              <ItemPreview alt="Preview" texture={texture} />
            </Slot>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={!canAdd}
        onClick={handleAdd}
        className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary cursor-pointer rounded-md border px-3 py-2 text-xs font-medium shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create Item
      </button>

      <p className="text-foreground/70 text-xs leading-relaxed">
        Custom items are placeholders used in generated recipes and tags. They are not added to
        Minecraft.
      </p>
    </div>
  );
};
