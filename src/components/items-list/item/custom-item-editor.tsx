import { useRef, useState } from "react";

import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

import { Select } from "@/components/ui/select";
import { NoTextureTexture } from "@/data/constants";
import { getFullId, getRawId } from "@/data/models/identifier/utilities";
import { CustomItem } from "@/data/models/types";
import { trackCustomItem } from "@/lib/analytics";
import { deleteCustomItemAndClearRecipeRefs } from "@/lib/editor-actions";
import {
  bedrockIdentifierHint,
  isValidNamespacedIdentifier,
  javaNamespacedIdentifierHint,
} from "@/lib/minecraft-identifier";
import { cn } from "@/lib/utils";
import { useCustomItemStore } from "@/stores/custom-item";

import { Item } from "../../item/item";
import { ItemPreview } from "../../item/item-preview";
import { Slot } from "../../slot/slot";
import { IngredientCard } from "../ingredient-card";

const getStoredCustomItem = (uid: string) =>
  useCustomItemStore.getState().customItems.find((customItem) => customItem.uid === uid);

export const CustomItemEditor = ({
  item,
  isExpanded,
  onToggle,
  className,
}: {
  item: CustomItem;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}) => {
  const updateCustomItem = useCustomItemStore((state) => state.updateCustomItem);

  const [draftName, setDraftName] = useState(item.displayName);
  const [draftId, setDraftId] = useState(getRawId(item.id));
  const [draftGroup, setDraftGroup] = useState(item.group ?? "");
  const [draftTexture, setDraftTexture] = useState(item.texture);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const showDraftIdError =
    draftId.trim().length === 0 || !isValidNamespacedIdentifier(draftId, item._version);
  const identifierHint =
    item._version === "bedrock"
      ? `Use namespace:name (${bedrockIdentifierHint})`
      : javaNamespacedIdentifierHint;

  const hasChanges =
    draftName.trim() !== item.displayName ||
    draftGroup !== (item.group ?? "") ||
    draftId.trim() !== getRawId(item.id) ||
    draftTexture !== item.texture;

  const canSave = draftName.trim().length > 0 && !showDraftIdError && hasChanges;

  const handleSave = () => {
    if (!canSave) return;
    const updates: Parameters<typeof updateCustomItem>[1] = {};

    if (draftName.trim() !== item.displayName) {
      updates.displayName = draftName.trim();
    }

    if (draftGroup !== (item.group ?? "")) {
      updates.group = draftGroup;
    }

    if (!showDraftIdError && draftId.trim() !== getRawId(item.id)) {
      updates.rawId = draftId.trim();
    }

    if (draftTexture !== item.texture) {
      updates.texture = draftTexture;
    }

    if (Object.keys(updates).length > 0) {
      const didUpdate = updateCustomItem(item.uid, updates);
      const afterItem = getStoredCustomItem(item.uid);

      if (didUpdate && afterItem) {
        trackCustomItem({
          action: "update",
          has_texture: afterItem.texture !== NoTextureTexture,
        });
      }
    }

    onToggle();
  };

  const handleDeleteCustomItem = () => {
    deleteCustomItemAndClearRecipeRefs(item.uid);
    trackCustomItem({
      action: "delete",
      has_texture: item.texture !== NoTextureTexture,
    });
  };

  const handleDeleteExpandedCustomItem = () => {
    handleDeleteCustomItem();
    onToggle();
  };

  const handleEditTextureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setDraftTexture(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isExpanded) {
    const id = getFullId(item.id);
    return (
      <IngredientCard
        label={item.displayName}
        sublabel={id}
        onClick={onToggle}
        className={className}
        actions={
          <button
            type="button"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded p-1 transition-colors"
            onClick={handleDeleteCustomItem}
          >
            <Trash2Icon size={14} />
            <span className="sr-only">Delete item</span>
          </button>
        }
      >
        <Item item={item} />
      </IngredientCard>
    );
  }

  const groupTerm = item._version === "bedrock" ? "Addon" : "Mod";

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded p-1 transition-colors"
          onClick={onToggle}
        >
          <ArrowLeftIcon size={16} />
        </button>

        <Slot className="shrink-0">
          <Item item={{ ...item, displayName: draftName, texture: draftTexture }} />
        </Slot>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{draftName || item.displayName}</div>
          <div className="text-muted-foreground truncate text-xs">
            {draftId ? `${item.id.namespace}:${draftId}` : getFullId(item.id)}
          </div>
        </div>

        <button
          type="button"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded p-1 transition-colors"
          onClick={handleDeleteExpandedCustomItem}
        >
          <Trash2Icon size={14} />
          <span className="sr-only">Delete item</span>
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs sm:col-span-2">
          {groupTerm} / Group
          <Select value={draftGroup} onChange={(event) => setDraftGroup(event.target.value)}>
            <option value="">General / Unassigned</option>
            {Array.from(
              new Set([
                ...(useCustomItemStore.getState().groups ?? []),
                ...useCustomItemStore
                  .getState()
                  .customItems.map((i) => i.group)
                  .filter((g): g is string => typeof g === "string"),
              ]),
            )
              .filter(
                (g) =>
                  typeof g === "string" &&
                  g.trim().length > 0 &&
                  g.trim().toLowerCase() !== "general",
              )
              .map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
          </Select>
        </label>
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Display Name
          <input
            value={draftName}
            className="border-input bg-background text-foreground focus:ring-ring rounded-md border px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-inset"
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Id
          <input
            value={draftId}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={showDraftIdError}
            className={cn(
              "border-input bg-background text-foreground focus:ring-ring rounded-md border px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-inset",
              showDraftIdError && "border-destructive focus:ring-destructive",
            )}
            onChange={(event) => setDraftId(event.target.value)}
          />
          {showDraftIdError && (
            <span className="text-destructive text-[10px]">{identifierHint}</span>
          )}
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-foreground text-xs font-medium">Texture</span>
        <div className="flex items-center gap-2">
          <label className="border-border text-muted-foreground hover:bg-accent flex-1 cursor-pointer rounded-md border border-dashed px-3 py-2 text-center text-xs transition-colors">
            {draftTexture !== NoTextureTexture ? "Change texture" : "Select texture (.png)"}
            <input
              ref={editFileInputRef}
              type="file"
              accept=".png"
              className="hidden"
              onChange={handleEditTextureChange}
            />
          </label>

          <Slot width={32} height={32}>
            <ItemPreview alt="Preview" texture={draftTexture} />
          </Slot>
        </div>
      </div>

      <button
        type="button"
        disabled={!canSave}
        onClick={handleSave}
        className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary cursor-pointer rounded-md border px-3 py-2 text-xs font-medium shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save Changes
      </button>

      <p className="text-foreground/70 text-xs leading-relaxed">
        Custom items are placeholders used in generated recipes and tags. They are not added to
        Minecraft.
      </p>
    </div>
  );
};
