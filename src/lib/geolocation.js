/**
 * @typedef {object} AccuratePosition
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} accuracy Meters
 */

/**
 * Waits for the best GPS fix using watchPosition + high accuracy.
 * Falls back to the most precise reading received before timeout.
 *
 * @param {{ timeout?: number; desiredAccuracy?: number }} [options]
 * @returns {Promise<AccuratePosition>}
 */
export function getAccuratePosition(options = {}) {
  const { timeout = 15000, desiredAccuracy = 40 } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Ubicación no disponible en este dispositivo"));
      return;
    }

    /** @type {GeolocationPosition | null} */
    let best = null;
    /** @type {number | null} */
    let watchId = null;
    let settled = false;

    const finish = (position) => {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (best) {
        finish(best);
        return;
      }
      const code = err?.code;
      if (code === 1) {
        reject(new Error("Activá la ubicación para usar esta función"));
      } else if (code === 3) {
        reject(new Error("Tiempo agotado al buscar tu ubicación"));
      } else {
        reject(new Error("No se pudo obtener tu ubicación"));
      }
    };

    const timer = setTimeout(() => {
      if (best) finish(best);
      else fail({ code: 3 });
    }, timeout);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) {
          best = pos;
        }
        if (pos.coords.accuracy <= desiredAccuracy) {
          finish(pos);
        }
      },
      fail,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout,
      },
    );
  });
}
