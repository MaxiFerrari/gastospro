import { useMemo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAppRoute } from "@hooks/useAppRoute";
import { Store } from "lucide-react";
import { useShoppingList } from "@views/shopping/hooks/useShoppingList";
import { useShoppingItemContexts } from "@views/shopping/hooks/useShoppingItemContexts";
import { useInventory } from "@views/shared/hooks/useInventory";
import ShoppingListPage from "./components/ShoppingListPage";
import SupermarketMode from "./components/SupermarketMode";
import ShoppingContextBar from "./components/ShoppingContextBar";
import InventoryPanel from "@views/shared/InventoryPanel";
import {
  DEFAULT_SHOPPING_CONTEXT,
  getShoppingContext,
} from "@lib/shoppingContexts";
import { buildPath } from "@lib/routes";
import { toast, toastUndo } from "@lib/toast";
import ReceiptScanPanel from "./components/ReceiptScanPanel";
import { fireSupermarketCheckFeedback } from "@lib/feedback";
import {
  incrementSupermarketCheckCount,
  unlockListClearMedal,
  evaluateMedals,
} from "@lib/medals";

export default function ShoppingHubView({ userId }) {
  const navigate = useNavigate();
  const route = useAppRoute();
  const shoppingContext = route.shoppingContext;
  const supermarketMode = Boolean(route.supermarketMode);
  const pathname = route.pathname;

  const [modoPending, setModoPending] = useState(false);
  useEffect(() => {
    setModoPending(false);
  }, [pathname]);

  const activeContext = shoppingContext ?? "all";
  const contextForNew =
    activeContext === "all" ? DEFAULT_SHOPPING_CONTEXT : activeContext;
  const showSupermarket = supermarketMode || modoPending;

  const goShopping = useCallback(
    (opts = {}) => {
      const path = buildPath({
        mode: "shopping",
        shoppingContext: opts.shoppingContext,
        supermarketMode: opts.supermarketMode,
      });
      navigate(path);
    },
    [navigate],
  );

  const list = useShoppingList(userId);
  const itemContexts = useShoppingItemContexts(userId);
  const inventory = useInventory(userId);

  const pendingCounts = useMemo(
    () => itemContexts.pendingCounts(list.items),
    [list.items, itemContexts],
  );

  const contextItems = useMemo(() => {
    if (activeContext === "all") return list.items;
    return itemContexts.filterByContext(list.items, activeContext);
  }, [list.items, activeContext, itemContexts]);

  const wrappedAddItem = useCallback(
    (payload) => list.addItem(payload, contextForNew),
    [list, contextForNew],
  );

  const handleToggle = useCallback(
    async (id, completed) => {
      const item = list.items.find((x) => x.id === id);
      const result = await list.toggleComplete(id, completed);
      if (!result?.error && item && !completed) {
        const inv = inventory.findByName(item.name);
        if (inv) inventory.adjustQuantity(inv.id, -1);
      }
      return result;
    },
    [list, inventory],
  );

  const handleSupermarketToggle = useCallback(
    async (id, completed) => {
      const item = list.items.find((x) => x.id === id);
      const ctxId =
        activeContext === "all" ? DEFAULT_SHOPPING_CONTEXT : activeContext;
      const modoItems = itemContexts.filterByContext(list.items, ctxId);
      const pendingBefore = modoItems.filter((i) => !i.completed).length;

      const result = await handleToggle(id, completed);

      if (!result?.error && !completed && item) {
        const listJustCompleted = pendingBefore === 1;
        fireSupermarketCheckFeedback({ listJustCompleted });
        const count = incrementSupermarketCheckCount(userId);
        if (listJustCompleted) {
          const medal = unlockListClearMedal(userId);
          if (medal) toast(`Medalla: ${medal.emoji} ${medal.title}`);
        }
        const fresh = evaluateMedals(userId, {
          supermarketChecks: count,
        });
        for (const m of fresh) {
          toast(`Medalla: ${m.emoji} ${m.title}`);
        }

        const itemId = id;
        const itemName = item.name;
        toastUndo(`"${itemName}" tachado`, async () => {
          const undoResult = await list.toggleComplete(itemId, true);
          if (!undoResult?.error) {
            const inv = inventory.findByName(itemName);
            if (inv) inventory.adjustQuantity(inv.id, 1);
          }
        });
      }
      return result;
    },
    [
      activeContext,
      itemContexts,
      list,
      inventory,
      handleToggle,
      userId,
    ],
  );

  const handleAddFromInventory = useCallback(
    async (row) => {
      const result = await wrappedAddItem({
        name: row.name,
        quantity: Math.max(1, row.minQuantity - row.currentQuantity),
        unit: row.unit,
        category: "Otros",
      });
      if (!result?.error && result?.id) {
        itemContexts.assignContext(result.id, row.context);
        toast(`"${row.name}" agregado a la lista`);
      }
    },
    [wrappedAddItem, itemContexts],
  );

  const openSupermarketMode = useCallback(() => {
    const ctx =
      activeContext === "all" ? DEFAULT_SHOPPING_CONTEXT : activeContext;
    setModoPending(true);
    goShopping({ shoppingContext: ctx, supermarketMode: true });
  }, [activeContext, goShopping]);

  const closeSupermarketMode = useCallback(() => {
    setModoPending(false);
    const ctx =
      activeContext === "all" ? DEFAULT_SHOPPING_CONTEXT : activeContext;
    goShopping({
      shoppingContext: activeContext === "all" ? undefined : ctx,
      supermarketMode: false,
    });
  }, [activeContext, goShopping]);

  if (showSupermarket) {
    const ctxId =
      activeContext === "all" ? DEFAULT_SHOPPING_CONTEXT : activeContext;
    const modoItems = itemContexts.filterByContext(list.items, ctxId);
    return createPortal(
      <SupermarketMode
        contextId={ctxId}
        items={modoItems}
        onToggle={handleSupermarketToggle}
        onExit={closeSupermarketMode}
        getCatalogProduct={(code) => list.findCatalogByBarcode(code)}
        onAddFromBarcode={async (product) => {
          await list.upsertProductInCatalog(product);
          const result = await wrappedAddItem({
            name: product.name,
            brand: product.brand,
            quantity: product.quantity ?? 1,
            unit: product.unit ?? "u",
            size: product.size,
            category: product.category ?? "Otros",
            price: product.price ?? null,
            barcode: product.barcode ?? null,
          });
          if (!result?.error) {
            toast(`"${product.name}" agregado`);
          }
        }}
        onUpdatePrice={async (id, price, item) => {
          const result = await list.updateItem(id, { price });
          if (result?.error) return result;
          if (item.barcode) {
            await list.upsertProductInCatalog({
              barcode: item.barcode,
              name: item.name,
              brand: item.brand,
              category: item.category ?? "Otros",
              unit: item.unit ?? "u",
              size: item.size,
              quantity: item.quantity ?? 1,
              price,
            });
          }
          return result;
        }}
      />,
      document.body,
    );
  }

  const ctxLabel =
    activeContext === "all"
      ? "todas las listas"
      : getShoppingContext(activeContext).label;

  return (
    <div className="space-y-4">
      <ShoppingContextBar
        activeContext={activeContext}
        pendingCounts={pendingCounts}
        onSelect={(id) =>
          goShopping({
            shoppingContext: id === "all" ? undefined : id,
            supermarketMode: false,
          })
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openSupermarketMode}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Store className="w-4 h-4" />
          Modo supermercado
        </button>
        <p className="text-xs text-slate-400 self-center">
          Vista simple para tachar en el pasillo · {ctxLabel}
        </p>
      </div>

      <InventoryPanel
        items={inventory.items}
        lowStock={inventory.lowStock}
        onAdd={inventory.addItem}
        onDelete={inventory.deleteItem}
        onAdjust={inventory.adjustQuantity}
        onAddToList={handleAddFromInventory}
      />

      <ReceiptScanPanel
        onAddItems={async (rows) => {
          for (const row of rows) {
            await wrappedAddItem({
              name: row.name,
              quantity: row.quantity ?? 1,
              category: "Otros",
            });
          }
        }}
      />

      <ShoppingListPage
        userId={userId}
        items={contextItems}
        loading={list.loading}
        addItem={wrappedAddItem}
        deleteItem={list.deleteItem}
        toggleComplete={handleToggle}
        updateItem={list.updateItem}
        favorites={list.favorites}
        addFavorite={list.addFavorite}
        removeFavorite={list.removeFavorite}
        isFavorite={list.isFavorite}
        catalogProducts={list.catalogProducts}
        addProductToCatalog={list.addProductToCatalog}
        upsertProductInCatalog={list.upsertProductInCatalog}
        findCatalogByBarcode={list.findCatalogByBarcode}
        removeProductFromCatalog={list.removeProductFromCatalog}
        updateProductInCatalog={list.updateProductInCatalog}
        activeContext={activeContext}
      />
    </div>
  );
}
