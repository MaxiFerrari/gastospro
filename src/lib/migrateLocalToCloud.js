import { supabase } from "./supabaseClient";
import { DEFAULT_SHOPPING_CONTEXT } from "./shoppingContexts";

const MIGRATED_KEY = "gastospro:cloudMigrated";

function migratedKey(userId) {
  return `${MIGRATED_KEY}:${userId}`;
}

export function hasMigratedToCloud(userId) {
  if (!userId) return true;
  try {
    return localStorage.getItem(migratedKey(userId)) === "1";
  } catch {
    return true;
  }
}

function markMigrated(userId) {
  try {
    localStorage.setItem(migratedKey(userId), "1");
  } catch {
    /* quota */
  }
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * One-time import from localStorage → Supabase (idempotent per device).
 * @param {string} userId
 */
export async function migrateLocalDataToCloud(userId) {
  if (!userId || hasMigratedToCloud(userId)) return { ok: true, skipped: true };

  const errors = [];

  const homeBase = `gastospro:home:${userId}`;
  const tasks = readJson(`${homeBase}:tasks`, []);
  const members = readJson(`${homeBase}:members`, ["Yo", "Pareja"]);

  if (tasks.length) {
    const { error } = await supabase.from("home_tasks").insert(
      tasks.map((t) => ({
        user_id: userId,
        title: t.title,
        assignee: t.assignee ?? "Yo",
        done: Boolean(t.done),
        created_at: t.createdAt ?? new Date().toISOString(),
      })),
    );
    if (error) errors.push(`home_tasks: ${error.message}`);
  }

  if (members.length) {
    const { error } = await supabase.from("home_members").insert(
      members.map((name, i) => ({
        user_id: userId,
        name,
        sort_order: i,
      })),
    );
    if (error && !error.message.includes("duplicate")) {
      errors.push(`home_members: ${error.message}`);
    }
  }

  const meBase = `gastospro:me:${userId}`;
  const habits = readJson(`${meBase}:habits`, []);
  const checkIns = readJson(`${meBase}:checkins`, {});
  const focusMinutes = readJson(`${meBase}:focus`, 0);

  if (habits.length) {
    const { error } = await supabase.from("habits").insert(
      habits.map((h) => ({
        user_id: userId,
        name: h.name,
        streak: h.streak ?? 0,
        last_done: h.lastDone || null,
      })),
    );
    if (error) errors.push(`habits: ${error.message}`);
  }

  const checkInRows = Object.entries(checkIns).map(([date, row]) => ({
    user_id: userId,
    check_date: date,
    energy: row.energy ?? null,
    mood: row.mood ?? null,
    sleep: row.sleep ?? null,
    focus_minutes: 0,
  }));
  if (checkInRows.length) {
    const { error } = await supabase.from("me_check_ins").upsert(checkInRows);
    if (error) errors.push(`me_check_ins: ${error.message}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (focusMinutes > 0) {
    await supabase.from("me_check_ins").upsert({
      user_id: userId,
      check_date: today,
      focus_minutes: focusMinutes,
    });
  }

  const invKey = `gastospro:inventory:${userId}`;
  const inventory = readJson(invKey, []);
  if (inventory.length) {
    const { error } = await supabase.from("inventory_items").insert(
      inventory.map((x) => ({
        user_id: userId,
        name: x.name,
        min_quantity: x.minQuantity ?? 1,
        current_quantity: x.currentQuantity ?? 0,
        unit: x.unit ?? "u",
        context_id: x.context ?? DEFAULT_SHOPPING_CONTEXT,
      })),
    );
    if (error) errors.push(`inventory_items: ${error.message}`);
  }

  const ctxMap = readJson(`gastospro:shoppingContexts:${userId}`, {});
  const ctxIds = Object.keys(ctxMap);
  if (ctxIds.length) {
    await Promise.all(
      ctxIds.map((itemId) =>
        supabase
          .from("shopping_items")
          .update({ context_id: ctxMap[itemId] })
          .eq("id", itemId)
          .eq("user_id", userId),
      ),
    );
  }

  const favorites = readJson("shopping_list_favorites", []);
  const catalog = readJson("shopping_list_catalog", []);
  const productRows = [
    ...favorites.map((p) => ({
      user_id: userId,
      kind: "favorite",
      name: p.name,
      brand: p.brand ?? null,
      category: p.category ?? "Otro",
      default_quantity: p.quantity ?? 1,
      size: p.size ?? null,
      unit: p.unit ?? "u",
    })),
    ...catalog.map((p) => ({
      user_id: userId,
      kind: "catalog",
      name: p.name,
      brand: p.brand ?? null,
      category: p.category ?? "Otro",
      default_quantity: p.quantity ?? 1,
      size: p.size ?? null,
      unit: p.unit ?? "u",
    })),
  ];
  if (productRows.length) {
    const { error } = await supabase.from("shopping_products").insert(productRows);
    if (error) errors.push(`shopping_products: ${error.message}`);
  }

  markMigrated(userId);
  return { ok: errors.length === 0, errors, skipped: false };
}
