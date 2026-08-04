import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowLeftIcon, FolderIcon, FolderPlusIcon, PencilIcon, PlusIcon } from "lucide-react";

import { getRawId, identifierUniqueKey } from "@/data/models/identifier/utilities";
import { CustomItem, Item as ItemType } from "@/data/models/types";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import { useCustomItemStore } from "@/stores/custom-item";
import { useSettingsStore } from "@/stores/settings";
import { selectMinecraftVersion } from "@/stores/settings/selectors";

import { Item } from "../../item/item";
import { Slot } from "../../slot/slot";
import { InventoryGridContainer } from "../inventory-grid-container";
import { AddAddonForm } from "./add-addon-form";
import { AddItemForm } from "./add-item-form";
import { CustomItemEditor } from "./custom-item-editor";
import { EditAddonForm } from "./edit-addon-form";

const SLOT_SIZE = 36;
const itemGridOverscanRows = (isTouchDevice: boolean) => (isTouchDevice ? 2 : 3);

const getGridContentWidth = (element: HTMLDivElement) => {
  const styles = getComputedStyle(element);
  const horizontalPadding =
    (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0);

  return element.clientWidth - horizontalPadding;
};

interface ItemsSectionProps {
  items: ItemType[];
  search: string;
  showAddItemForm: boolean;
  showAddAddonForm?: boolean;
  onCloseAddItemForm: () => void;
  onCloseAddAddonForm?: () => void;
  onOpenAddItemForm?: () => void;
  onOpenAddAddonForm?: () => void;
}

const VirtualizedItemGrid = ({ items }: { items: ItemType[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isTouchDevice = useIsTouchDevice();

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    setContainerWidth(getGridContentWidth(el));

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasMeasuredWidth = containerWidth > 0;
  const itemsPerRow = hasMeasuredWidth ? Math.max(1, Math.floor(containerWidth / SLOT_SIZE)) : 1;
  const rowCount = hasMeasuredWidth ? Math.ceil(items.length / itemsPerRow) : 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => SLOT_SIZE,
    overscan: itemGridOverscanRows(isTouchDevice),
  });

  return (
    <InventoryGridContainer ref={scrollRef}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * itemsPerRow;
          const rowItems = items.slice(startIndex, startIndex + itemsPerRow);

          return (
            <div
              key={virtualRow.index}
              className="absolute left-0 flex w-full"
              style={{ top: virtualRow.start, height: virtualRow.size }}
            >
              {rowItems.map((item) => (
                <Slot key={identifierUniqueKey(item.id)}>
                  <Item item={item} />
                </Slot>
              ))}
            </div>
          );
        })}
      </div>
    </InventoryGridContainer>
  );
};

const EMPTY_GROUPS: string[] = [];

export const ItemsSection = ({
  items,
  search,
  showAddItemForm,
  showAddAddonForm,
  onCloseAddItemForm,
  onCloseAddAddonForm,
  onOpenAddItemForm,
  onOpenAddAddonForm,
}: ItemsSectionProps) => {
  const customItems = useCustomItemStore((state) => state.customItems);
  const groups = useCustomItemStore((state) => state.groups) ?? EMPTY_GROUPS;
  const addGroup = useCustomItemStore((state) => state.addGroup);
  const minecraftVersion = useSettingsStore(selectMinecraftVersion);

  const [expandedItemUid, setExpandedItemUid] = useState<string | null>(null);
  const [activeAddonGroup, setActiveAddonGroup] = useState<string | null>(null);
  const [editingAddonGroup, setEditingAddonGroup] = useState<string | null>(null);
  const [targetAddGroup, setTargetAddGroup] = useState<string | undefined>(undefined);

  const termSingular = minecraftVersion === "bedrock" ? "Addon" : "Mod";
  const termPlural = minecraftVersion === "bedrock" ? "Addons" : "Mods";

  const filteredCustomItems = useFuzzySearch(customItems, search, (item) => [
    item.displayName,
    getRawId(item.id),
    item.group ?? "",
  ]);

  const allAddonGroups = useMemo(() => {
    const set = new Set<string>(groups);
    for (const item of customItems) {
      const g = item.group?.trim();
      if (g && g.toLowerCase() !== "general") {
        set.add(g);
      }
    }
    return ["General", ...Array.from(set)];
  }, [customItems, groups]);

  const customItemsByGroup = useMemo(() => {
    const map = new Map<string, CustomItem[]>();
    for (const g of allAddonGroups) {
      map.set(g, []);
    }
    for (const item of filteredCustomItems) {
      const g = item.group?.trim() || "General";
      const list = map.get(g) ?? [];
      list.push(item);
      map.set(g, list);
    }
    return map;
  }, [allAddonGroups, filteredCustomItems]);

  if (editingAddonGroup) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <EditAddonForm
          groupName={editingAddonGroup}
          onClose={() => setEditingAddonGroup(null)}
          onRenamed={(newName) => {
            if (activeAddonGroup === editingAddonGroup) {
              setActiveAddonGroup(newName);
            }
          }}
          onDeleted={() => {
            if (activeAddonGroup === editingAddonGroup) {
              setActiveAddonGroup(null);
            }
          }}
        />
      </div>
    );
  }

  if (showAddAddonForm && onCloseAddAddonForm) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <AddAddonForm
          onClose={onCloseAddAddonForm}
          onAddonCreated={(newAddon) => {
            addGroup(newAddon);
            setActiveAddonGroup(newAddon);
          }}
        />
      </div>
    );
  }

  if (showAddItemForm) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <AddItemForm
          onClose={() => {
            setTargetAddGroup(undefined);
            onCloseAddItemForm();
          }}
          initialGroup={targetAddGroup ?? activeAddonGroup ?? undefined}
          availableGroups={allAddonGroups}
        />
      </div>
    );
  }

  if (expandedItemUid) {
    const expandedItem = customItems.find((item) => item.uid === expandedItemUid);
    if (expandedItem) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <CustomItemEditor
            key={expandedItem.uid}
            item={expandedItem}
            isExpanded
            onToggle={() => setExpandedItemUid(null)}
          />
        </div>
      );
    }
  }

  const activeAddonItems = activeAddonGroup ? (customItemsByGroup.get(activeAddonGroup) ?? []) : [];

  const renderCustomItemsContent = () => {
    if (activeAddonGroup === null) {
      return (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground hidden text-xs font-medium lg:block">
            Custom {termPlural}
          </span>

          <div className="scrollbar-app max-h-44 shrink-0 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allAddonGroups.map((groupName) => {
                const count = customItemsByGroup.get(groupName)?.length ?? 0;
                return (
                  <div key={groupName} className="group relative flex items-center">
                    <button
                      type="button"
                      className="border-border bg-muted/30 hover:bg-accent hover:border-primary/50 flex w-full cursor-pointer items-center gap-2.5 rounded-md border p-2 text-left transition-all"
                      onClick={() => setActiveAddonGroup(groupName)}
                    >
                      <FolderIcon size={18} className="text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{groupName}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {count} {count === 1 ? "item" : "items"}
                        </div>
                      </div>
                    </button>

                    {groupName !== "General" && (
                      <button
                        type="button"
                        title={`Edit ${termSingular} folder`}
                        className="bg-background/90 hover:bg-background text-foreground border-border absolute top-1.5 right-1.5 z-10 hidden h-5 w-5 cursor-pointer items-center justify-center rounded border shadow-xs group-hover:flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAddonGroup(groupName);
                        }}
                      >
                        <PencilIcon size={10} />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed p-2 text-xs font-medium transition-colors"
                onClick={() => onOpenAddAddonForm?.()}
              >
                <FolderPlusIcon size={15} />
                Add {termSingular}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors"
            onClick={() => setActiveAddonGroup(null)}
          >
            <ArrowLeftIcon size={14} />
            <span>Back</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium">
            <FolderIcon size={14} className="text-primary shrink-0" />
            <span className="truncate">{activeAddonGroup}</span>
            <span className="text-muted-foreground text-[10px]">({activeAddonItems.length})</span>

            {activeAddonGroup !== "General" && (
              <button
                type="button"
                title={`Edit ${termSingular} folder`}
                className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded p-0.5 transition-colors"
                onClick={() => setEditingAddonGroup(activeAddonGroup)}
              >
                <PencilIcon size={11} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="border-border text-foreground hover:bg-accent flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors"
            onClick={() => {
              setTargetAddGroup(activeAddonGroup);
              onOpenAddItemForm?.();
            }}
          >
            <PlusIcon size={12} />
            Add Item
          </button>
        </div>

        <InventoryGridContainer className="max-h-36 flex-none shrink-0">
          {activeAddonItems.length === 0 ? (
            <div className="text-muted-foreground flex h-16 items-center justify-center text-xs">
              No items in this {termSingular} folder yet.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,36px)] content-start">
              {activeAddonItems.map((item) => (
                <div
                  key={item.uid}
                  className="group relative"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setExpandedItemUid(item.uid);
                  }}
                >
                  <Slot>
                    <Item item={item} />
                  </Slot>
                  <button
                    type="button"
                    title="Edit custom item"
                    className="bg-background/90 hover:bg-background text-foreground border-border absolute -top-1 -right-1 z-20 hidden h-4 w-4 cursor-pointer items-center justify-center rounded-full border shadow-xs group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedItemUid(item.uid);
                    }}
                  >
                    <PencilIcon size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </InventoryGridContainer>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {(filteredCustomItems.length > 0 || allAddonGroups.length > 0) && renderCustomItemsContent()}

      <span className="text-muted-foreground hidden text-xs font-medium lg:block">
        Vanilla Items
      </span>

      <VirtualizedItemGrid items={items} />
    </div>
  );
};
