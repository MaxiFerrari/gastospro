import { supabase } from "./supabaseClient";

const MIGRATED_KEY = "gastospro:housekeeperCloud";

function migratedKey(userId) {
  return `${MIGRATED_KEY}:${userId}`;
}

function lsKey(userId, suffix) {
  return `gp_housekeeper_${suffix}_${userId}`;
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
 * Importa tarifas y registros de empleada desde localStorage → Supabase (una vez).
 * @param {string} userId
 */
export async function migrateHousekeeperLocalToCloud(userId) {
  if (!userId) return { ok: true, skipped: true };
  try {
    if (localStorage.getItem(migratedKey(userId)) === "1") {
      return { ok: true, skipped: true };
    }
  } catch {
    return { ok: true, skipped: true };
  }

  const settings = readJson(lsKey(userId, "settings"), null);
  const entries = readJson(lsKey(userId, "entries"), []);
  const errors = [];

  if (
    settings &&
    (Number(settings.hourlyRate) > 0 || Number(settings.mobilityRate) > 0)
  ) {
    const { error } = await supabase.from("housekeeper_settings").upsert(
      {
        user_id: userId,
        hourly_rate: Number(settings.hourlyRate) || 0,
        mobility_rate: Number(settings.mobilityRate) || 0,
      },
      { onConflict: "user_id" },
    );
    if (error) errors.push(`housekeeper_settings: ${error.message}`);
  }

  if (Array.isArray(entries) && entries.length > 0) {
    const rows = entries
      .filter((e) => e?.date)
      .map((e) => ({
        user_id: userId,
        work_date: e.date,
        hours: Number(e.hours) || 0,
        minutes: Number(e.minutes) || 0,
      }));

    if (rows.length) {
      const { error } = await supabase
        .from("housekeeper_entries")
        .upsert(rows, { onConflict: "user_id,work_date" });
      if (error) errors.push(`housekeeper_entries: ${error.message}`);
    }
  }

  try {
    localStorage.setItem(migratedKey(userId), "1");
  } catch {
    /* quota */
  }

  return { ok: errors.length === 0, errors, skipped: false };
}
