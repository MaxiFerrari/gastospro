const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "GastosPro/1.0 (personal life admin app)";

/**
 * @typedef {object} GeocodeResult
 * @property {string} name
 * @property {string} [address]
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @param {unknown} row
 * @returns {GeocodeResult | null}
 */
export function parseNominatimResult(row) {
  if (!row || typeof row !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (row);
  const lat = Number.parseFloat(String(r.lat));
  const lon = Number.parseFloat(String(r.lon));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const display =
    typeof r.display_name === "string" ? r.display_name.trim() : "";
  const name =
    typeof r.name === "string" && r.name.trim()
      ? r.name.trim()
      : display.split(",")[0]?.trim() || "Lugar";

  return {
    name,
    address: display || undefined,
    latitude: lat,
    longitude: lon,
  };
}

/**
 * @param {unknown[]} rows
 * @param {number} [limit]
 * @returns {GeocodeResult[]}
 */
export function parseNominatimResults(rows, limit = 5) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(parseNominatimResult)
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * @param {string} query
 * @param {number} [limit]
 * @returns {Promise<GeocodeResult[]>}
 */
export async function searchPlaces(query, limit = 5) {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "0",
    limit: String(limit),
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error("No se pudo buscar la dirección");
  const data = await res.json();
  return parseNominatimResults(data, limit);
}

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<GeocodeResult | null>}
 */
export async function reverseGeocode(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    addressdetails: "0",
    zoom: "18",
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error("No se pudo obtener la dirección");
  const data = await res.json();
  return parseNominatimResult(data);
}
