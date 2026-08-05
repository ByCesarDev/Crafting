import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { NoTextureTexture } from "@/data/constants";
import { identifierUniqueKey } from "@/data/models/identifier/utilities";
import { CustomItem } from "@/data/models/types";
import { MinecraftVersion } from "@/data/types";
import { parseMinecraftIdentifierInput } from "@/lib/minecraft-identifier";
import { generateUid } from "@/lib/utils";

export interface CustomItemState {
  customItems: CustomItem[];
  groups: string[];
}

type CustomItemUpdates = Partial<Pick<CustomItem, "displayName" | "texture" | "group">> & {
  rawId?: string;
};

type CustomItemActions = {
  addCustomItem: (params: {
    name: string;
    rawId: string;
    texture: string;
    version: MinecraftVersion;
    group?: string;
  }) => boolean;
  updateCustomItem: (uid: string, updates: CustomItemUpdates) => boolean;
  deleteCustomItem: (uid: string) => void;
  addGroup: (groupName: string) => void;
  renameCustomItemGroup: (oldGroupName: string, newGroupName: string) => boolean;
  deleteCustomItemGroup: (groupName: string, deleteItems?: boolean) => void;
  importCustomItemsAndGroups: (
    items?: CustomItem[],
    groups?: string[],
  ) => { importedItems: number; importedGroups: number };
};

export const useCustomItemStore = create<CustomItemState & CustomItemActions>()(
  persist(
    immer((set, get) => ({
      customItems: [],
      groups: [],

      importCustomItemsAndGroups: (newItems, newGroups) => {
        let importedItems = 0;
        let importedGroups = 0;

        set((state) => {
          if (!state.groups) state.groups = [];

          if (Array.isArray(newGroups)) {
            for (const group of newGroups) {
              const trimmed = group.trim();
              if (
                trimmed &&
                trimmed.toLowerCase() !== "general" &&
                !state.groups.includes(trimmed)
              ) {
                state.groups.push(trimmed);
                importedGroups++;
              }
            }
          }

          if (Array.isArray(newItems)) {
            for (const item of newItems) {
              if (!item || !item.id) continue;
              const itemKey = identifierUniqueKey(item.id);
              const exists = state.customItems.some(
                (existing) => identifierUniqueKey(existing.id) === itemKey,
              );

              if (!exists) {
                state.customItems.push(item);
                importedItems++;

                if (
                  item.group &&
                  item.group.toLowerCase() !== "general" &&
                  !state.groups.includes(item.group)
                ) {
                  state.groups.push(item.group);
                }
              }
            }
          }
        });

        return { importedItems, importedGroups };
      },

      addGroup: (groupName) => {
        const trimmed = groupName.trim();
        if (!trimmed || trimmed.toLowerCase() === "general") return;
        set((state) => {
          if (!state.groups) state.groups = [];
          if (!state.groups.includes(trimmed)) {
            state.groups.push(trimmed);
          }
        });
      },

      addCustomItem: ({ name, rawId, texture, version, group }) => {
        const id = parseMinecraftIdentifierInput(rawId, version);

        if (
          get().customItems.some((item) => identifierUniqueKey(item.id) === identifierUniqueKey(id))
        ) {
          return false;
        }

        const trimmedGroup = group?.trim() || undefined;

        const item: CustomItem = {
          type: "custom_item",
          uid: generateUid("custom-item"),
          id,
          displayName: name,
          texture: texture || NoTextureTexture,
          _version: version,
          group: trimmedGroup,
        };

        set((state) => {
          state.customItems.push(item);
          if (!state.groups) state.groups = [];
          if (
            trimmedGroup &&
            trimmedGroup.toLowerCase() !== "general" &&
            !state.groups.includes(trimmedGroup)
          ) {
            state.groups.push(trimmedGroup);
          }
        });

        return true;
      },

      updateCustomItem: (uid, updates) => {
        let didUpdate = false;

        set((state) => {
          if (!state.groups) state.groups = [];
          const item = state.customItems.find((i) => i.uid === uid);
          if (!item) return;

          if (updates.displayName !== undefined && updates.displayName !== item.displayName) {
            item.displayName = updates.displayName;
            didUpdate = true;
          }

          if (updates.group !== undefined) {
            const nextGroup = updates.group.trim() || undefined;
            if (nextGroup !== item.group) {
              item.group = nextGroup;
              didUpdate = true;
              if (
                nextGroup &&
                nextGroup.toLowerCase() !== "general" &&
                !state.groups.includes(nextGroup)
              ) {
                state.groups.push(nextGroup);
              }
            }
          }

          if (updates.texture !== undefined) {
            const nextTexture = updates.texture || NoTextureTexture;
            if (nextTexture !== item.texture) {
              item.texture = nextTexture;
              didUpdate = true;
            }
          }

          if (updates.rawId !== undefined) {
            const newId = parseMinecraftIdentifierInput(updates.rawId, item._version);
            const currentKey = identifierUniqueKey(item.id);
            const newKey = identifierUniqueKey(newId);
            const duplicate = state.customItems.some(
              (i) => i.uid !== uid && identifierUniqueKey(i.id) === newKey,
            );

            if (!duplicate && currentKey !== newKey) {
              item.id = newId;
              didUpdate = true;
            }
          }
        });

        return didUpdate;
      },

      deleteCustomItem: (uid) => {
        set((state) => {
          state.customItems = state.customItems.filter((item) => item.uid !== uid);
        });
      },

      renameCustomItemGroup: (oldGroupName, newGroupName) => {
        const trimmedOld = oldGroupName.trim();
        const trimmedNew = newGroupName.trim();
        if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return false;

        let didRename = false;
        set((state) => {
          if (!state.groups) state.groups = [];
          const index = state.groups.indexOf(trimmedOld);
          if (index !== -1) {
            state.groups[index] = trimmedNew;
            didRename = true;
          } else if (!state.groups.includes(trimmedNew)) {
            state.groups.push(trimmedNew);
            didRename = true;
          }

          for (const item of state.customItems) {
            const currentGroup = item.group?.trim() || "General";
            if (currentGroup.toLowerCase() === trimmedOld.toLowerCase()) {
              item.group = trimmedNew;
              didRename = true;
            }
          }
        });
        return didRename;
      },

      deleteCustomItemGroup: (groupName, deleteItems = false) => {
        const trimmed = groupName.trim();
        set((state) => {
          if (!state.groups) state.groups = [];
          state.groups = state.groups.filter((g) => g.toLowerCase() !== trimmed.toLowerCase());
          if (deleteItems) {
            state.customItems = state.customItems.filter(
              (item) => (item.group?.trim() || "General").toLowerCase() !== trimmed.toLowerCase(),
            );
          } else {
            for (const item of state.customItems) {
              const currentGroup = item.group?.trim() || "General";
              if (currentGroup.toLowerCase() === trimmed.toLowerCase()) {
                item.group = undefined;
              }
            }
          }
        });
      },
    })),
    {
      name: "crafting-custom-items",
      version: 0,
      partialize: (state) => ({
        customItems: state.customItems,
        groups: state.groups,
      }),
    },
  ),
);
