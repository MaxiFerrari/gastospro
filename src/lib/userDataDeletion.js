import { supabase } from "./supabaseClient";

/** Tablas con columna user_id (orden: hijos de events/pets primero en funciones dedicadas). */
export const USER_DATA_TABLES = [
  "pet_care",
  "pets",
  "transactions",
  "fixed_items",
  "budgets",
  "subscriptions",
  "custom_categories",
  "shopping_items",
  "shopping_products",
  "events",
  "home_tasks",
  "home_members",
  "habits",
  "me_check_ins",
  "inventory_items",
  "housekeeper_entries",
  "housekeeper_settings",
  "user_preferences",
];

const LOCAL_PREFIXES = ["gastospro:"];

/**
 * @param {string} userId
 */
export async function deleteUserReceipts(userId) {
  if (!userId) return;
  try {
    const { data: files, error } = await supabase.storage
      .from("receipts")
      .list(userId, { limit: 500 });
    if (error || !files?.length) return;
    const paths = files.map((f) => `${userId}/${f.name}`);
    if (paths.length) {
      await supabase.storage.from("receipts").remove(paths);
    }
  } catch {
    /* bucket may not exist */
  }
}

/**
 * @param {string} userId
 */
export async function deleteAllUserData(userId) {
  if (!userId) throw new Error("Usuario no válido");

  const { data: evs, error: evErr } = await supabase
    .from("events")
    .select("id")
    .eq("user_id", userId);
  if (evErr) throw new Error(evErr.message);

  const eventIds = (evs ?? []).map((e) => e.id);
  if (eventIds.length) {
    const { error: gErr } = await supabase
      .from("event_guests")
      .delete()
      .in("event_id", eventIds);
    if (gErr) throw new Error(gErr.message);
    const { error: xErr } = await supabase
      .from("event_expenses")
      .delete()
      .in("event_id", eventIds);
    if (xErr) throw new Error(xErr.message);
  }

  await deleteUserReceipts(userId);

  for (const table of USER_DATA_TABLES) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      if (error.code === "42P01") continue;
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

/**
 * @param {string} [userId]
 */
export function clearLocalUserData(userId) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || !LOCAL_PREFIXES.some((p) => k.startsWith(p))) continue;
      if (!userId) {
        localStorage.removeItem(k);
      } else if (k.includes(userId)) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Elimina cuenta (datos + auth). Requiere RPC `delete_my_account` en Supabase.
 * @param {string} userId
 */
export async function deleteAccount(userId) {
  if (!userId) throw new Error("Usuario no válido");

  await deleteAllUserData(userId);
  clearLocalUserData();

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (
      error.message?.includes("Could not find the function") ||
      error.code === "42883"
    ) {
      throw new Error(
        "Falta la función delete_my_account en Supabase. Ejecutá supabase/migrations/006_privacy_and_pets.sql en el SQL Editor y volvé a intentar.",
      );
    }
    throw new Error(error.message);
  }
}
