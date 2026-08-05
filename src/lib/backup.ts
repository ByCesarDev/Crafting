import { CustomItem, Tag } from "@/data/models/types";
import { useCustomItemStore } from "@/stores/custom-item";
import { useRecipeStore } from "@/stores/recipe";
import { Recipe } from "@/stores/recipe/types";
import { useTagStore } from "@/stores/tag";

export interface CraftingBackup {
  version: 1;
  timestamp: string;
  customItems?: CustomItem[];
  groups?: string[];
  tags?: Tag[];
  recipes?: Recipe[];
}

export interface ImportSummary {
  items: number;
  groups: number;
  tags: number;
  recipes: number;
}

export function createBackupPayload(targetGroup?: string): CraftingBackup {
  const { customItems, groups } = useCustomItemStore.getState();
  const { tags } = useTagStore.getState();
  const { recipes } = useRecipeStore.getState();

  const isSpecificGroup = Boolean(targetGroup && targetGroup !== "all");

  let exportItems = customItems;
  let exportGroups = groups;

  if (isSpecificGroup && targetGroup) {
    const isGeneral = targetGroup.toLowerCase() === "general";
    exportItems = customItems.filter((item) => {
      const g = item.group?.trim() || "General";
      return isGeneral
        ? g.toLowerCase() === "general"
        : g.toLowerCase() === targetGroup.toLowerCase();
    });
    exportGroups = [targetGroup];
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    customItems: exportItems,
    groups: exportGroups,
    tags,
    recipes,
  };
}

export function downloadBackupFile(targetGroup?: string, backupPayload?: CraftingBackup): void {
  const payload = backupPayload ?? createBackupPayload(targetGroup);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const groupSlug =
    targetGroup && targetGroup !== "all"
      ? targetGroup.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : "all-addons";

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `crafting-${groupSlug}-${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function parseAndImportBackup(jsonContent: string): {
  success: boolean;
  error?: string;
  summary?: ImportSummary;
} {
  try {
    const data = JSON.parse(jsonContent) as Partial<CraftingBackup>;

    if (typeof data !== "object" || data === null) {
      return { success: false, error: "Invalid backup file: Not a valid JSON object." };
    }

    const { importedItems, importedGroups } = useCustomItemStore
      .getState()
      .importCustomItemsAndGroups(data.customItems, data.groups);
    const importedTags = useTagStore.getState().importTags(data.tags);
    const importedRecipes = useRecipeStore.getState().importRecipes(data.recipes);

    return {
      success: true,
      summary: {
        items: importedItems,
        groups: importedGroups,
        tags: importedTags,
        recipes: importedRecipes,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to parse backup file.",
    };
  }
}
