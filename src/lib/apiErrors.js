/** @typedef {'dolar' | 'weather' | 'openFoodFacts'} ApiSource */

const LABELS = {
  dolar: "cotizaciones del dólar (DolarApi)",
  weather: "el clima (Open-Meteo)",
  openFoodFacts: "el producto (Open Food Facts)",
};

/**
 * @param {number} [ms]
 */
export function fetchAbortSignal(ms = 15000) {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * @param {ApiSource} source
 * @param {unknown} err
 * @param {string} [fallback]
 */
export function formatApiError(source, err, fallback) {
  const label = LABELS[source] ?? "el servicio";
  const base = fallback ?? `No se pudo cargar ${label}.`;

  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return `Tiempo de espera agotado al consultar ${label}. Probá de nuevo.`;
    }
    if (
      err.message === "Failed to fetch" ||
      err.message.includes("NetworkError") ||
      err.message.includes("network")
    ) {
      return `Sin conexión para ${label}. Revisá tu internet e intentá otra vez.`;
    }
    if (err.message && !err.message.startsWith("No se pudo")) {
      return err.message;
    }
  }

  return base;
}

/**
 * @param {ApiSource} source
 * @param {Response} res
 */
export function httpStatusMessage(source, res) {
  const label = LABELS[source] ?? "el servicio";
  if (res.status === 404) {
    return source === "openFoodFacts"
      ? "Producto no encontrado en Open Food Facts"
      : `No encontrado (${label}).`;
  }
  if (res.status >= 500) {
    return `${label} no responde (${res.status}). Probá más tarde.`;
  }
  if (res.status === 429) {
    return `Demasiadas consultas a ${label}. Esperá un momento.`;
  }
  return `Error al consultar ${label} (${res.status}).`;
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
export async function fetchApi(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    signal: init.signal ?? fetchAbortSignal(),
  });
  return res;
}
