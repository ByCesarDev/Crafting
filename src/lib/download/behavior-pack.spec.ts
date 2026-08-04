import { beforeEach, describe, expect, it, vi } from "vitest";

import { MinecraftVersion, RecipeType } from "@/data/types";
import { useAlertStore } from "@/stores/alert";
import { createEmptySlotContext } from "@/stores/recipe/slot-value";
import { recipeStateDefaults } from "@/stores/recipe/types";
import { makeRecipe } from "@/test/recipe-fixtures";

import type { GeneratedRecipe } from "@/recipes/generate/types";

const { createBehaviorPackBlob, downloadBlob, generate } = vi.hoisted(() => ({
  createBehaviorPackBlob: vi.fn<typeof import("@/data/behavior-pack").createBehaviorPackBlob>(),
  downloadBlob: vi.fn<typeof import("@/data/datapack").downloadBlob>(),
  generate: vi.fn<typeof import("@/recipes/generate").generate>(),
}));

vi.mock("@/data/behavior-pack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/data/behavior-pack")>();
  return {
    ...actual,
    createBehaviorPackBlob,
  };
});

vi.mock("@/data/datapack", () => ({
  downloadBlob,
}));

vi.mock("@/recipes/generate", () => ({
  generate,
}));

import { downloadBehaviorPack } from "./behavior-pack";

let recipeId = 0;

const generatedRecipe = {
  type: "minecraft:crafting_shapeless",
  ingredients: [],
  result: {},
} satisfies GeneratedRecipe;

const createItem = (raw: string, version = MinecraftVersion.Bedrock) => ({
  type: "default_item" as const,
  id: {
    raw,
    id: raw.split(":").at(-1) ?? raw,
    namespace: raw.includes(":") ? raw.split(":")[0] : "minecraft",
  },
  displayName: raw.split(":").at(-1) ?? raw,
  texture: "",
  _version: version,
});

const createCraftingRecipe = (
  slots: Record<string, ReturnType<typeof createItem>>,
  overrides: Parameters<typeof makeRecipe>[0] = {},
) =>
  makeRecipe({
    id: overrides.id ?? `recipe-${(recipeId += 1)}`,
    recipeType: RecipeType.Crafting,
    slots,
    crafting: { ...recipeStateDefaults.crafting, shapeless: true },
    ...overrides,
  });

describe("downloadBehaviorPack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAlertStore.getState(), "showAlert").mockResolvedValue(true);
  });

  it("blocks behavior pack download when any recipe is incomplete", async () => {
    const recipe = createCraftingRecipe({
      "crafting.1": createItem("minecraft:stone"),
    });
    const slotContext = createEmptySlotContext(MinecraftVersion.Bedrock);

    const result = await downloadBehaviorPack({
      recipes: [recipe],
      version: MinecraftVersion.Bedrock,
      context: { bedrockNamespace: "crafting" },
      slotContext,
    });

    expect(result).toEqual({ status: "blocked" });
    expect(useAlertStore.getState().showAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Please finish all recipes before downloading the behavior pack:\n\n- Crafting Recipe: Add a result item",
      }),
    );
    expect(generate).not.toHaveBeenCalled();
    expect(createBehaviorPackBlob).not.toHaveBeenCalled();
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it("downloads the behavior pack when all recipes are valid", async () => {
    const blob = new Blob(["zip"]);
    const recipe = createCraftingRecipe({
      "crafting.1": createItem("minecraft:stone"),
      "crafting.result": createItem("minecraft:stone_button"),
    });
    const slotContext = createEmptySlotContext(MinecraftVersion.Bedrock);

    generate.mockReturnValue(generatedRecipe);
    createBehaviorPackBlob.mockReturnValue(blob);

    const result = await downloadBehaviorPack({
      recipes: [recipe],
      version: MinecraftVersion.Bedrock,
      context: { bedrockNamespace: "crafting" },
      slotContext,
    });

    expect(result).toEqual({ status: "success" });
    expect(generate).toHaveBeenCalledWith({
      state: recipe,
      version: MinecraftVersion.Bedrock,
      slotContext,
      options: {
        bedrockIdentifier: "crafting:stone_button",
      },
    });
    expect(createBehaviorPackBlob).toHaveBeenCalledWith([
      {
        identifier: "crafting:stone_button",
        json: generatedRecipe,
      },
    ]);
    expect(downloadBlob).toHaveBeenCalledWith(blob, "behavior_pack.mcpack");
  });

  it("surfaces recipe generation errors during behavior pack generation", async () => {
    const recipe = createCraftingRecipe({
      "crafting.1": createItem("minecraft:stone"),
      "crafting.result": createItem("minecraft:stone_button"),
    });
    const slotContext = createEmptySlotContext(MinecraftVersion.Bedrock);

    generate.mockImplementation(() => {
      throw new Error("Boom");
    });

    const result = await downloadBehaviorPack({
      recipes: [recipe],
      version: MinecraftVersion.Bedrock,
      context: { bedrockNamespace: "crafting" },
      slotContext,
    });

    expect(result).toEqual({ status: "error" });
    expect(useAlertStore.getState().showAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to generate all recipes for the behavior pack:\n\n- stone_button: Boom",
      }),
    );
    expect(createBehaviorPackBlob).not.toHaveBeenCalled();
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it("surfaces zip creation failures", async () => {
    const recipe = createCraftingRecipe({
      "crafting.1": createItem("minecraft:stone"),
      "crafting.result": createItem("minecraft:stone_button"),
    });
    const slotContext = createEmptySlotContext(MinecraftVersion.Bedrock);

    generate.mockReturnValue(generatedRecipe);
    createBehaviorPackBlob.mockImplementation(() => {
      throw new Error("Zip failed");
    });

    const result = await downloadBehaviorPack({
      recipes: [recipe],
      version: MinecraftVersion.Bedrock,
      context: { bedrockNamespace: "crafting" },
      slotContext,
    });

    expect(result).toEqual({ status: "error" });
    expect(useAlertStore.getState().showAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to generate the behavior pack:\n\nZip failed",
      }),
    );
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
