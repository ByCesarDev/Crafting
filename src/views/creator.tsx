import { useState } from "react";

import { RecipeTypeSelector } from "@/components/fields/recipe-type-selector";
import { Footer } from "@/components/footer";
import { ItemsList } from "@/components/items-list/items-list";
import { AppShell } from "@/components/layout/app-shell";
import { HeaderNavLink } from "@/components/layout/header";
import { RecipeOptions } from "@/components/options/recipe-options";
import { ItemOutput } from "@/components/output/item-output";
import { Preview } from "@/components/preview/preview";
import { MobileRecipeSwitcher } from "@/components/recipes/sidebar/mobile-recipe-switcher";
import { RecipeSidebar } from "@/components/recipes/sidebar/recipe-sidebar";
import { type SheetSnapState, useBottomSheetDrag } from "@/hooks/use-bottom-sheet-drag";
import { useDndMonitor } from "@/hooks/use-dnd-monitor";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";

import styles from "./creator.module.css";

const navLink = (
  <HeaderNavLink
    to="/recipes/{-$version}"
    params={{ version: undefined }}
    search={{ q: "", recipeType: "all" }}
  >
    Recipes List
  </HeaderNavLink>
);

export function CreatorView() {
  useDndMonitor();
  const isMobileRecipeSidebarOpen = useUIStore((state) => state.isMobileRecipeSidebarOpen);
  const isRecipeSidebarExpanded = useUIStore((state) => state.isRecipeSidebarExpanded);
  const setMobileRecipeSidebarOpen = useUIStore((state) => state.setMobileRecipeSidebarOpen);
  const [snapState, setSnapState] = useState<SheetSnapState>("expanded");

  const { dragOffsetY, isDragging, dragProps } = useBottomSheetDrag({
    snapState,
    onSnapChange: (nextState) => {
      if (nextState === "collapsed") {
        useUIStore.getState().clearInteractionState();
      }
      setSnapState(nextState);
    },
  });

  return (
    <AppShell
      title="Crafting Generator"
      navLink={navLink}
      className={styles.shell}
      footer={<Footer />}
    >
      <div
        className={cn(
          styles.frame,
          isRecipeSidebarExpanded ? styles.desktopExpanded : styles.desktopCollapsed,
        )}
      >
        <div className={styles.recipeColumn}>
          <RecipeSidebar collapsed={!isRecipeSidebarExpanded} />
        </div>

        <div className={styles.contentColumn}>
          <div className={styles.contentBody}>
            <main className={styles.mainContent}>
              <div className="flex flex-col gap-2 lg:h-full lg:min-h-0 lg:gap-4">
                <MobileRecipeSwitcher />

                <div className="bg-card rounded-lg border p-4">
                  <div className="flex flex-col items-center gap-2">
                    <RecipeTypeSelector />
                    <Preview />
                  </div>
                </div>

                <div className="bg-card rounded-lg border">
                  <RecipeOptions />
                </div>

                <div className="lg:flex lg:min-h-0 lg:flex-col">
                  <ItemOutput />
                </div>
              </div>
            </main>
          </div>
        </div>

        <div
          className={cn(
            styles.itemsColumn,
            snapState === "expanded" && styles.itemsColumnExpanded,
            snapState === "full" && styles.itemsColumnFull,
            isDragging && "!transition-none",
          )}
          style={
            {
              "--drag-y": `${dragOffsetY}px`,
            } as React.CSSProperties
          }
        >
          <div
            className={styles.trayToggle}
            aria-expanded={snapState !== "collapsed"}
            {...dragProps}
          >
            <div className="bg-muted-foreground/30 hover:bg-muted-foreground/50 my-0.5 h-1.5 w-12 rounded-full transition-colors" />
            <div className="flex items-center justify-center text-xs font-semibold">
              <span>Items & Tags</span>
            </div>
          </div>

          <div className={cn(styles.itemsBody, "flex")}>
            <ItemsList />
          </div>
        </div>
      </div>

      {isMobileRecipeSidebarOpen ? (
        <div className={styles.sheetOverlay}>
          <button
            type="button"
            aria-label="Close recipe sidebar"
            className={styles.sheetBackdrop}
            onClick={() => setMobileRecipeSidebarOpen(false)}
          />

          <div className={styles.sheet}>
            <div className={styles.sheetBody}>
              <RecipeSidebar mobile />
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
