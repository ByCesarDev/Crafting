import { beforeEach, describe, expect, it } from "vitest";

import { MinecraftVersion } from "@/data/types";
import { createBackupPayload, parseAndImportBackup } from "@/lib/backup";
import { useCustomItemStore } from "@/stores/custom-item";
import { useRecipeStore } from "@/stores/recipe";
import { useTagStore } from "@/stores/tag";

describe("Backup System", () => {
  beforeEach(() => {
    useCustomItemStore.setState({ customItems: [], groups: [] });
    useTagStore.setState({ tags: [] });
    useRecipeStore.setState({ recipes: [], selectedRecipeId: "" });
  });

  it("creates a backup payload with current store data", () => {
    useCustomItemStore.getState().addCustomItem({
      name: "Test Item",
      rawId: "custom:test_item",
      texture: "texture.png",
      version: MinecraftVersion.Bedrock,
      group: "MyAddon",
    });

    const payload = createBackupPayload();
    expect(payload.version).toBe(1);
    expect(payload.customItems?.length).toBe(1);
    expect(payload.groups).toContain("MyAddon");
  });

  it("filters backup payload when a specific group is specified", () => {
    useCustomItemStore.getState().addCustomItem({
      name: "Enderite Sword",
      rawId: "enderite:sword",
      texture: "sword.png",
      version: MinecraftVersion.Bedrock,
      group: "Enderite Mod",
    });
    useCustomItemStore.getState().addCustomItem({
      name: "Ruby Pickaxe",
      rawId: "ruby:pickaxe",
      texture: "pickaxe.png",
      version: MinecraftVersion.Bedrock,
      group: "Ruby Mod",
    });

    const payload = createBackupPayload("Enderite Mod");
    expect(payload.customItems?.length).toBe(1);
    expect(payload.customItems?.[0].displayName).toBe("Enderite Sword");
    expect(payload.groups).toEqual(["Enderite Mod"]);
  });

  it("imports valid backup data without duplicating items", () => {
    const backupJson = JSON.stringify({
      version: 1,
      customItems: [
        {
          type: "custom_item",
          uid: "custom-item-1",
          id: { namespace: "myaddon", path: "ruby" },
          displayName: "Ruby",
          texture: "ruby.png",
          _version: "bedrock",
          group: "Gems",
        },
      ],
      groups: ["Gems", "Ores"],
    });

    const result = parseAndImportBackup(backupJson);

    expect(result.success).toBe(true);
    expect(result.summary?.items).toBe(1);
    expect(result.summary?.groups).toBe(2);

    const storeState = useCustomItemStore.getState();
    expect(storeState.customItems.length).toBe(1);
    expect(storeState.groups).toContain("Gems");
    expect(storeState.groups).toContain("Ores");

    // Second import with identical items should skip duplicates
    const result2 = parseAndImportBackup(backupJson);
    expect(result2.summary?.items).toBe(0);
    expect(result2.summary?.groups).toBe(0);
  });

  it("returns an error for invalid JSON", () => {
    const result = parseAndImportBackup("invalid-json{");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
