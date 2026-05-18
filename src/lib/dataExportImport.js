import { supabase } from "./supabaseClient";

export const BACKUP_VERSION = 1;

/**
 * @param {string} userId
 */
export async function fetchAllUserData(userId) {
  const [
    transactions,
    fixedItems,
    budgets,
    subscriptions,
    customCategories,
    userPreferences,
    shoppingItems,
    shoppingProducts,
    events,
    eventGuests,
    eventExpenses,
    homeTasks,
    homeMembers,
    habits,
    meCheckIns,
    inventoryItems,
    housekeeperSettings,
    housekeeperEntries,
    pets,
    petCare,
  ] = await Promise.all([
    supabase.from("transactions").select("*").eq("user_id", userId),
    supabase.from("fixed_items").select("*").eq("user_id", userId),
    supabase.from("budgets").select("*").eq("user_id", userId),
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("custom_categories").select("*").eq("user_id", userId),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("shopping_items").select("*").eq("user_id", userId),
    supabase.from("shopping_products").select("*").eq("user_id", userId),
    supabase.from("events").select("*").eq("user_id", userId),
    supabase.from("event_guests").select("*"),
    supabase.from("event_expenses").select("*"),
    supabase.from("home_tasks").select("*").eq("user_id", userId),
    supabase.from("home_members").select("*").eq("user_id", userId),
    supabase.from("habits").select("*").eq("user_id", userId),
    supabase.from("me_check_ins").select("*").eq("user_id", userId),
    supabase.from("inventory_items").select("*").eq("user_id", userId),
    supabase
      .from("housekeeper_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("housekeeper_entries").select("*").eq("user_id", userId),
    supabase.from("pets").select("*").eq("user_id", userId),
    supabase.from("pet_care").select("*").eq("user_id", userId),
  ]);

  const eventIds = (events.data ?? []).map((e) => e.id);
  const guests = (eventGuests.data ?? []).filter((g) => eventIds.includes(g.event_id));
  const expenses = (eventExpenses.data ?? []).filter((e) => eventIds.includes(e.event_id));

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      transactions: transactions.data ?? [],
      fixed_items: fixedItems.data ?? [],
      budgets: budgets.data ?? [],
      subscriptions: subscriptions.data ?? [],
      custom_categories: customCategories.data ?? [],
      user_preferences: userPreferences.data ?? null,
      shopping_items: shoppingItems.data ?? [],
      shopping_products: shoppingProducts.data ?? [],
      events: events.data ?? [],
      event_guests: guests,
      event_expenses: expenses,
      home_tasks: homeTasks.data ?? [],
      home_members: homeMembers.data ?? [],
      habits: habits.data ?? [],
      me_check_ins: meCheckIns.data ?? [],
      inventory_items: inventoryItems.data ?? [],
      housekeeper_settings: housekeeperSettings.data ?? null,
      housekeeper_entries: housekeeperEntries.data ?? [],
      pets: pets.data ?? [],
      pet_care: petCare.data ?? [],
    },
  };
}

/**
 * @param {string} userId
 * @param {ReturnType<typeof fetchAllUserData> extends Promise<infer T> ? T : never} bundle
 * @param {'merge' | 'replace'} mode
 */
export async function importAllUserData(userId, bundle, mode = "merge") {
  if (!bundle?.data) throw new Error("Archivo de respaldo inválido");
  const d = bundle.data;

  if (mode === "replace") {
    const { data: evs } = await supabase.from("events").select("id").eq("user_id", userId);
    const eventIds = (evs ?? []).map((e) => e.id);
    if (eventIds.length) {
      await supabase.from("event_guests").delete().in("event_id", eventIds);
      await supabase.from("event_expenses").delete().in("event_id", eventIds);
    }
    const tables = [
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
      "pet_care",
      "pets",
    ];
    for (const table of tables) {
      await supabase.from(table).delete().eq("user_id", userId);
    }
  }

  const strip = (rows) =>
    (rows ?? []).map((row) => {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
      return { ...rest, user_id: userId };
    });

  const insertBatch = async (table, rows) => {
    if (!rows?.length) return;
    const chunk = 200;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const { error } = await supabase.from(table).insert(slice);
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  };

  await insertBatch("transactions", strip(d.transactions));
  await insertBatch("fixed_items", strip(d.fixed_items));
  await insertBatch("budgets", strip(d.budgets));
  await insertBatch("subscriptions", strip(d.subscriptions));
  await insertBatch("custom_categories", strip(d.custom_categories));
  await insertBatch("shopping_items", strip(d.shopping_items));
  await insertBatch("shopping_products", strip(d.shopping_products));
  await insertBatch("home_tasks", strip(d.home_tasks));
  await insertBatch("home_members", strip(d.home_members));
  await insertBatch("habits", strip(d.habits));
  await insertBatch("inventory_items", strip(d.inventory_items));

  const petIdMap = new Map();
  for (const pet of d.pets ?? []) {
    const { id: oldId, ...rest } = pet;
    const { data: inserted, error } = await supabase
      .from("pets")
      .insert([{ ...rest, user_id: userId }])
      .select("id")
      .single();
    if (error) throw new Error(`pets: ${error.message}`);
    petIdMap.set(oldId, inserted.id);
  }

  const mapPetFk = (rows) =>
    (rows ?? []).map((r) => {
      const { id: _id, ...rest } = r;
      return {
        ...rest,
        pet_id: petIdMap.get(r.pet_id) ?? r.pet_id,
        user_id: userId,
      };
    });

  await insertBatch("pet_care", mapPetFk(d.pet_care));

  if (d.housekeeper_settings) {
    await supabase.from("housekeeper_settings").upsert({
      user_id: userId,
      hourly_rate: d.housekeeper_settings.hourly_rate ?? 0,
      mobility_rate: d.housekeeper_settings.mobility_rate ?? 0,
    });
  }
  await insertBatch("housekeeper_entries", strip(d.housekeeper_entries));

  if (d.me_check_ins?.length) {
    const rows = d.me_check_ins.map((r) => ({
      user_id: userId,
      check_date: r.check_date,
      energy: r.energy,
      mood: r.mood,
      sleep: r.sleep,
      focus_minutes: r.focus_minutes ?? 0,
    }));
    await supabase.from("me_check_ins").upsert(rows);
  }

  if (d.user_preferences) {
    const { id: _id, ...prefs } = d.user_preferences;
    await supabase.from("user_preferences").upsert({
      ...prefs,
      user_id: userId,
      updated_at: new Date().toISOString(),
    });
  }

  const eventIdMap = new Map();
  for (const ev of d.events ?? []) {
    const { id: oldId, ...rest } = ev;
    const { data: inserted, error } = await supabase
      .from("events")
      .insert([{ ...rest, user_id: userId }])
      .select("id")
      .single();
    if (error) throw new Error(`events: ${error.message}`);
    eventIdMap.set(oldId, inserted.id);
  }

  const mapEventFk = (rows) =>
    (rows ?? []).map((r) => {
      const { id: _id, ...rest } = r;
      return {
        ...rest,
        event_id: eventIdMap.get(r.event_id) ?? r.event_id,
      };
    });

  await insertBatch("event_guests", mapEventFk(d.event_guests));
  await insertBatch("event_expenses", mapEventFk(d.event_expenses));

  return { ok: true };
}

export function downloadBackupJson(bundle, filename) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `gastospro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        if (!json.data) reject(new Error("Formato inválido"));
        else resolve(json);
      } catch {
        reject(new Error("JSON inválido"));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsText(file);
  });
}
