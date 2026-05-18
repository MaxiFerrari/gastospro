/** @type {typeof BarcodeDetector | null} */
let cachedCtor = null;

/**
 * BarcodeDetector nativo (Chrome/Android) o ponyfill ZXing (Edge, Firefox, Safari).
 * @returns {Promise<typeof BarcodeDetector>}
 */
export async function getBarcodeDetector() {
  if (cachedCtor) return cachedCtor;
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    cachedCtor = window.BarcodeDetector;
    return cachedCtor;
  }
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  cachedCtor = BarcodeDetector;
  return cachedCtor;
}

/** @returns {boolean} */
export function hasNativeBarcodeDetector() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}
