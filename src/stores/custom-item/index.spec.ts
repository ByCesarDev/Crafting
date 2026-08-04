import { beforeEach, describe, expect, it } from "vitest";

import { MinecraftVersion, RecipeType } from "@/data/types";
import { SLOTS } from "@/recipes/slots";
import { useRecipeStore } from "@/stores/recipe";

import { useCustomItemStore } from "./index";

describe("custom item store", () => {
  beforeEach(() => {
    useCustomItemStore.setState((state) => ({
      ...state,
      customItems: [],
    }));

    useRecipeStore.setState((state) => ({
      ...state,
      recipes: [
        {
          id: "recipe-1",
          nameMode: "auto",
          name: "",
          recipeType: RecipeType.Crafting,
          group: "",
          category: "",
          showNotification: true,
          smithing: {
            trimPattern: "",
          },
          slots: {},
          crafting: {
            shapeless: false,
            keepWhitespace: false,
            twoByTwo: false,
          },
          cooking: {
            time: 0,
            experience: 0,
          },
          bedrock: {
            identifierMode: "auto",
            identifierName: "",
            priority: 0,
          },
        },
      ],
      selectedRecipeId: "recipe-1",
    }));
  });

  it("does not rewrite recipe slots when a custom item id changes", () => {
    expect(
      useCustomItemStore.getState().addCustomItem({
        name: "Custom Bedrock Item",
        rawId: "mod:custom_item",
        texture: "",
        version: MinecraftVersion.Bedrock,
      }),
    ).toBe(true);

    const customItem = useCustomItemStore.getState().customItems[0]!;

    useRecipeStore.getState().setRecipeSlot(SLOTS.crafting.result, {
      kind: "custom_item",
      uid: customItem.uid,
    });
    expect(
      useCustomItemStore.getState().updateCustomItem(customItem.uid, {
        rawId: "mod:item-name/path",
      }),
    ).toBe(true);

    expect(useCustomItemStore.getState().customItems[0]).toMatchObject({
      id: {
        namespace: "mod",
        id: "itemnamepath",
      },
    });
    expect(useRecipeStore.getState().recipes[0]?.slots[SLOTS.crafting.result]).toMatchObject({
      kind: "custom_item",
      uid: customItem.uid,
    });
  });

  it("returns false when a custom item action does not change state", () => {
    useCustomItemStore.getState().addCustomItem({
      name: "Custom Bedrock Item",
      rawId: "mod:custom_item",
      texture: "",
      version: MinecraftVersion.Bedrock,
    });

    const customItem = useCustomItemStore.getState().customItems[0]!;

    expect(
      useCustomItemStore.getState().addCustomItem({
        name: "Duplicate",
        rawId: "mod:custom_item",
        texture: "",
        version: MinecraftVersion.Bedrock,
      }),
    ).toBe(false);
    expect(useCustomItemStore.getState().updateCustomItem(customItem.uid, {})).toBe(false);
    expect(useCustomItemStore.getState().updateCustomItem("missing", { displayName: "Name" })).toBe(
      false,
    );
  });

  it("supports assigning and updating custom item group / addon folders", () => {
    useCustomItemStore.getState().addCustomItem({
      name: "Enderite Sword",
      rawId: "ed:enderite_sword",
      texture: "",
      version: MinecraftVersion.Bedrock,
      group: "Enderite Mod",
    });

    const item = useCustomItemStore.getState().customItems[0]!;
    expect(item.group).toBe("Enderite Mod");

    useCustomItemStore.getState().updateCustomItem(item.uid, {
      group: "Enderite Weapons",
    });

    expect(useCustomItemStore.getState().customItems[0]?.group).toBe("Enderite Weapons");
  });

  it("renames and deletes custom item groups", () => {
    useCustomItemStore.getState().addCustomItem({
      name: "Enderite Ingot",
      rawId: "ed:enderite_ingot",
      texture: "",
      version: MinecraftVersion.Bedrock,
      group: "Enderite Mod",
    });

    expect(
      useCustomItemStore.getState().renameCustomItemGroup("Enderite Mod", "Enderite Mod Pack"),
    ).toBe(true);
    expect(useCustomItemStore.getState().customItems[0]?.group).toBe("Enderite Mod Pack");

    useCustomItemStore.getState().deleteCustomItemGroup("Enderite Mod Pack");
    expect(useCustomItemStore.getState().customItems[0]?.group).toBe(undefined);
  });
});
