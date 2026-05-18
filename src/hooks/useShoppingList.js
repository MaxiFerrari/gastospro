import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { migrateLocalDataToCloud } from "../lib/migrateLocalToCloud";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category ?? "Otro",
    quantity: row.default_quantity ?? 1,
    size: row.size ?? undefined,
    unit: row.unit ?? "u",
    barcode: row.barcode ?? undefined,
    price: row.default_price ?? undefined,
  };
}

function catalogRowFromProduct(userId, product) {
  return {
    user_id: userId,
    kind: "catalog",
    name: product.name,
    brand: product.brand ?? null,
    category: product.category ?? "Otro",
    default_quantity: product.quantity ?? 1,
    size: product.size != null ? String(product.size) : null,
    unit: product.unit ?? "u",
    barcode: product.barcode ?? null,
    default_price: product.price ?? null,
  };
}

export function useShoppingList(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);

  const fetchItems = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    await migrateLocalDataToCloud(userId);

    const { data, error: fetchError } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [userId]);

  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("shopping_products")
      .select("*")
      .eq("user_id", userId);
    const rows = data ?? [];
    setFavorites(rows.filter((r) => r.kind === "favorite").map(mapProduct));
    setCatalogProducts(rows.filter((r) => r.kind === "catalog").map(mapProduct));
  }, [userId]);

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [fetchItems, fetchProducts]);

  const findCatalogByBarcode = useCallback(
    (barcode) => {
      if (!barcode) return null;
      return catalogProducts.find((p) => p.barcode === barcode) ?? null;
    },
    [catalogProducts],
  );

  const addItem = useCallback(
    async (payload, contextId = DEFAULT_SHOPPING_CONTEXT) => {
      if (!userId) return;
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticItem = {
        id: optimisticId,
        user_id: userId,
        created_at: new Date().toISOString(),
        completed: false,
        context_id: contextId,
        ...payload,
      };

      setItems((prev) => [optimisticItem, ...prev]);

      const { data, error: insertError } = await supabase
        .from("shopping_items")
        .insert([
          {
            user_id: userId,
            name: payload.name,
            brand: payload.brand || null,
            quantity: payload.quantity || 1,
            size: payload.size != null ? String(payload.size) : null,
            unit: payload.unit || "u",
            category: payload.category || "Otro",
            price: payload.price ?? null,
            notes: payload.notes || null,
            barcode: payload.barcode ?? null,
            completed: false,
            context_id: contextId,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setItems((prev) => prev.filter((x) => x.id !== optimisticId));
        return { error: insertError.message };
      }

      setItems((prev) => prev.map((x) => (x.id === optimisticId ? data : x)));
      return data;
    },
    [userId],
  );

  const deleteItem = useCallback(
    async (id) => {
      setItems((prev) => prev.filter((x) => x.id !== id));
      const { error: deleteError } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id);

      if (deleteError) {
        await fetchItems();
        return { error: deleteError.message };
      }
    },
    [fetchItems],
  );

  const toggleComplete = useCallback(
    async (id, completed) => {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, completed: !completed } : x)),
      );
      const { error: updateError } = await supabase
        .from("shopping_items")
        .update({ completed: !completed })
        .eq("id", id);

      if (updateError) {
        await fetchItems();
        return { error: updateError.message };
      }
    },
    [fetchItems],
  );

  const updateItem = useCallback(
    async (id, patch) => {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      );
      const { error: updateError } = await supabase
        .from("shopping_items")
        .update(patch)
        .eq("id", id);

      if (updateError) {
        await fetchItems();
        return { error: updateError.message };
      }
    },
    [fetchItems],
  );

  const addFavorite = useCallback(
    async (product) => {
      if (!userId) return;
      const exists = favorites.some((p) => p.name === product.name);
      if (exists) return;
      const { data } = await supabase
        .from("shopping_products")
        .insert([
          {
            user_id: userId,
            kind: "favorite",
            name: product.name,
            brand: product.brand ?? null,
            category: product.category ?? "Otro",
            default_quantity: product.quantity ?? 1,
            size: product.size != null ? String(product.size) : null,
            unit: product.unit ?? "u",
          },
        ])
        .select()
        .single();
      if (data) setFavorites((prev) => [...prev, mapProduct(data)]);
    },
    [userId, favorites],
  );

  const removeFavorite = useCallback(async (productName) => {
    setFavorites((prev) => prev.filter((p) => p.name !== productName));
    if (!userId) return;
    await supabase
      .from("shopping_products")
      .delete()
      .eq("user_id", userId)
      .eq("kind", "favorite")
      .eq("name", productName);
  }, [userId]);

  const isFavorite = useCallback(
    (productName) => favorites.some((p) => p.name === productName),
    [favorites],
  );

  const upsertProductInCatalog = useCallback(
    async (product) => {
      if (!userId) return { error: "Sin usuario" };

      const byBarcode =
        product.barcode &&
        catalogProducts.find((p) => p.barcode === product.barcode);
      const byName = catalogProducts.find((p) => p.name === product.name);
      const existing = byBarcode ?? byName;

      const row = catalogRowFromProduct(userId, product);

      if (existing) {
        setCatalogProducts((prev) =>
          prev.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  ...product,
                  id: existing.id,
                  quantity: product.quantity ?? p.quantity,
                }
              : p,
          ),
        );
        const { data, error: updateError } = await supabase
          .from("shopping_products")
          .update({
            name: row.name,
            brand: row.brand,
            category: row.category,
            default_quantity: row.default_quantity,
            size: row.size,
            unit: row.unit,
            barcode: row.barcode,
            default_price: row.default_price,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (updateError) return { error: updateError.message };
        if (data) {
          setCatalogProducts((prev) =>
            prev.map((p) => (p.id === existing.id ? mapProduct(data) : p)),
          );
        }
        return { updated: true, product: data ? mapProduct(data) : existing };
      }

      const { data, error: insertError } = await supabase
        .from("shopping_products")
        .insert([row])
        .select()
        .single();

      if (insertError) return { error: insertError.message };
      if (data) setCatalogProducts((prev) => [...prev, mapProduct(data)]);
      return { updated: false, product: data ? mapProduct(data) : null };
    },
    [userId, catalogProducts],
  );

  const addProductToCatalog = useCallback(
    async (product) => {
      const result = await upsertProductInCatalog(product);
      if (result?.error) return result;
      if (result?.updated) return;
    },
    [upsertProductInCatalog],
  );

  const removeProductFromCatalog = useCallback(async (productName) => {
    setCatalogProducts((prev) => prev.filter((p) => p.name !== productName));
    if (!userId) return;
    await supabase
      .from("shopping_products")
      .delete()
      .eq("user_id", userId)
      .eq("kind", "catalog")
      .eq("name", productName);
  }, [userId]);

  const updateProductInCatalog = useCallback(
    async (oldName, updatedProduct) => {
      const existing = catalogProducts.find((p) => p.name === oldName);
      setCatalogProducts((prev) =>
        prev.map((p) =>
          p.name === oldName ? { ...updatedProduct, id: p.id } : p,
        ),
      );
      if (!userId) return;
      await supabase
        .from("shopping_products")
        .update({
          name: updatedProduct.name,
          brand: updatedProduct.brand ?? null,
          category: updatedProduct.category ?? "Otro",
          default_quantity: updatedProduct.quantity ?? 1,
          size:
            updatedProduct.size != null ? String(updatedProduct.size) : null,
          unit: updatedProduct.unit ?? "u",
          barcode: updatedProduct.barcode ?? null,
          default_price: updatedProduct.price ?? null,
        })
        .eq("user_id", userId)
        .eq("kind", "catalog")
        .eq("name", oldName);

      const inFav = favorites.some((p) => p.name === oldName);
      if (inFav) {
        setFavorites((prev) =>
          prev.map((p) => (p.name === oldName ? updatedProduct : p)),
        );
        await supabase
          .from("shopping_products")
          .update({
            name: updatedProduct.name,
            brand: updatedProduct.brand ?? null,
          })
          .eq("user_id", userId)
          .eq("kind", "favorite")
          .eq("name", oldName);
      }

      if (existing?.barcode && updatedProduct.price != null) {
        setCatalogProducts((prev) =>
          prev.map((p) =>
            p.id === existing.id
              ? { ...p, price: updatedProduct.price }
              : p,
          ),
        );
      }
    },
    [userId, favorites, catalogProducts],
  );

  return {
    items,
    loading,
    error,
    addItem,
    deleteItem,
    toggleComplete,
    updateItem,
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    catalogProducts,
    addProductToCatalog,
    upsertProductInCatalog,
    findCatalogByBarcode,
    removeProductFromCatalog,
    updateProductInCatalog,
    refetch: fetchItems,
  };
}
