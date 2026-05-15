import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const FAVORITES_KEY = "shopping_list_favorites";
const CATALOG_KEY = "shopping_list_catalog";

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

  useEffect(() => {
    fetchItems();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        setFavorites([]);
      }
    }
    // Load catalog from localStorage
    const savedCatalog = localStorage.getItem(CATALOG_KEY);
    if (savedCatalog) {
      try {
        setCatalogProducts(JSON.parse(savedCatalog));
      } catch {
        setCatalogProducts([]);
      }
    }
  }, [fetchItems]);

  const addItem = useCallback(
    async (payload) => {
      if (!userId) return;
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticItem = {
        id: optimisticId,
        user_id: userId,
        created_at: new Date().toISOString(),
        completed: false,
        price: null,
        category: "Otro",
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
            size: payload.size || null,
            unit: payload.unit || "u",
            category: payload.category || "Otro",
            price: payload.price || null,
            notes: payload.notes || null,
            completed: false,
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
        await fetchItems(); // Reload on error
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
        await fetchItems(); // Reload on error
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
        await fetchItems(); // Reload on error
        return { error: updateError.message };
      }
    },
    [fetchItems],
  );

  const addFavorite = useCallback((product) => {
    setFavorites((prev) => {
      const updated = [...prev];
      const exists = updated.find((p) => p.name === product.name);
      if (!exists) {
        updated.push(product);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((productName) => {
    setFavorites((prev) => {
      const updated = prev.filter((p) => p.name !== productName);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (productName) => favorites.some((p) => p.name === productName),
    [favorites],
  );

  const addProductToCatalog = useCallback((product) => {
    setCatalogProducts((prev) => {
      const exists = prev.find((p) => p.name === product.name);
      if (!exists) {
        const updated = [...prev, product];
        localStorage.setItem(CATALOG_KEY, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  const removeProductFromCatalog = useCallback((productName) => {
    setCatalogProducts((prev) => {
      const updated = prev.filter((p) => p.name !== productName);
      localStorage.setItem(CATALOG_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateProductInCatalog = useCallback((oldName, updatedProduct) => {
    setCatalogProducts((prev) => {
      const updated = prev.map((p) =>
        p.name === oldName ? updatedProduct : p,
      );
      localStorage.setItem(CATALOG_KEY, JSON.stringify(updated));
      return updated;
    });
    // Update in favorites too if it was there
    setFavorites((prev) => {
      const inFav = prev.some((p) => p.name === oldName);
      if (!inFav) return prev;
      const updated = prev.map((p) =>
        p.name === oldName ? updatedProduct : p,
      );
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

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
    removeProductFromCatalog,
    updateProductInCatalog,
  };
}
