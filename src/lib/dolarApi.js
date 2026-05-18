import { fetchApi, formatApiError, httpStatusMessage } from "./apiErrors";

const API_URL = "https://dolarapi.com/v1/dolares";
const CACHE_KEY = "gastospro:dolarRates";
const CACHE_MS = 10 * 60 * 1000;

/** @typedef {{ compra: number; venta: number; nombre: string; updatedAt?: string }} DolarQuote */

/**
 * @param {Array<{ casa: string; nombre: string; compra: number; venta: number; fechaActualizacion?: string }>} rows
 */
export function parseDolarRates(rows) {
  /** @type {Record<string, DolarQuote>} */
  const byCasa = {};
  for (const r of rows ?? []) {
    byCasa[r.casa] = {
      compra: r.compra,
      venta: r.venta,
      nombre: r.nombre,
      updatedAt: r.fechaActualizacion,
    };
  }
  return {
    oficial: byCasa.oficial ?? null,
    blue: byCasa.blue ?? null,
    mep: byCasa.bolsa ?? null,
    ccl: byCasa.contadoconliqui ?? null,
  };
}

export async function fetchDolarRates() {
  try {
    const res = await fetchApi(API_URL);
    if (!res.ok) throw new Error(httpStatusMessage("dolar", res));
    const data = await res.json();
    return parseDolarRates(data);
  } catch (err) {
    throw new Error(
      formatApiError("dolar", err, "No se pudieron obtener las cotizaciones del dólar."),
    );
  }
}

export function readDolarCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeDolarCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

/**
 * @param {'oficial'|'blue'|'mep'} key
 * @param {ReturnType<typeof parseDolarRates>} rates
 */
export function getVentaRate(rates, key = "blue") {
  const q = rates?.[key];
  return q?.venta ?? null;
}
