import { fetchApi, formatApiError, httpStatusMessage } from "./apiErrors";

const WMO = {
  rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  storm: [95, 96, 99],
  snow: [71, 73, 75, 77, 85, 86],
  fog: [45, 48],
  clear: [0, 1],
  cloudy: [2, 3],
};

/**
 * @param {number} code WMO weather code
 */
export function classifyWeather(code) {
  if (WMO.storm.includes(code)) return "storm";
  if (WMO.rain.includes(code)) return "rain";
  if (WMO.snow.includes(code)) return "snow";
  if (WMO.fog.includes(code)) return "fog";
  if (WMO.clear.includes(code)) return "clear";
  return "cloudy";
}

/**
 * @param {string} kind
 * @param {number} tempC
 */
export function weatherSuggestion(kind, tempC) {
  switch (kind) {
    case "rain":
    case "storm":
      return {
        emoji: "🌧️",
        line: "Lluvia — ideal para tareas de adentro",
        hint: "Revisá las pendientes del hogar o planificá la próxima fiesta.",
      };
    case "snow":
      return {
        emoji: "❄️",
        line: "Frío — quedate en casa",
        hint: "Buen momento para ordenar inventario o cerrar gastos del mes.",
      };
    case "clear":
      if (tempC >= 28) {
        return {
          emoji: "☀️",
          line: "Mucho calor — compras temprano",
          hint: "Aprovechá para tachar la lista del súper antes del mediodía.",
        };
      }
      return {
        emoji: "☀️",
        line: "Día despejado — salidas y mandados",
        hint: "Podés combinar compras con tareas afuera de casa.",
      };
    case "fog":
      return {
        emoji: "🌫️",
        line: "Neblina — mandados con calma",
        hint: "Ideal para repasar la lista de compras sin apuro.",
      };
    default:
      return {
        emoji: "⛅",
        line: "Día nublado — ritmo tranqui",
        hint: "Un buen día para tareas del hogar o anotar gastos.",
      };
  }
}

/**
 * @param {number} lat
 * @param {number} lon
 */
/** @param {string} kind */
export function weatherEmoji(kind) {
  const emojis = {
    rain: "🌧️",
    storm: "⛈️",
    snow: "❄️",
    fog: "🌫️",
    clear: "☀️",
    cloudy: "⛅",
  };
  return emojis[kind] ?? "🌤️";
}

/**
 * @param {number} lat
 * @param {number} lon
 */
export async function fetchWeatherBundle(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "8");
  url.searchParams.set("timezone", "auto");

  let res;
  try {
    res = await fetchApi(url.toString());
  } catch (err) {
    throw new Error(
      formatApiError("weather", err, "No se pudo obtener el pronóstico del clima."),
    );
  }
  if (!res.ok) throw new Error(httpStatusMessage("weather", res));
  const data = await res.json();
  const cur = data.current;
  if (!cur) throw new Error("Open-Meteo no devolvió datos de clima para tu zona.");

  const kind = classifyWeather(cur.weather_code);
  const tempC = Math.round(cur.temperature_2m);
  const suggestion = weatherSuggestion(kind, tempC);

  const daily = data.daily;
  /** @type {Array<{ date: string; label: string; emoji: string; max: number; min: number; kind: string }>} */
  const forecast = [];
  if (daily?.time) {
    for (let i = 1; i < Math.min(8, daily.time.length); i++) {
      const code = daily.weather_code[i];
      const k = classifyWeather(code);
      const d = new Date(`${daily.time[i]}T12:00:00`);
      forecast.push({
        date: daily.time[i],
        label: d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }),
        emoji: weatherEmoji(k),
        max: Math.round(daily.temperature_2m_max[i]),
        min: Math.round(daily.temperature_2m_min[i]),
        kind: k,
      });
    }
  }

  return {
    tempC,
    kind,
    code: cur.weather_code,
    ...suggestion,
    forecast,
  };
}

/** @deprecated use fetchWeatherBundle */
export async function fetchCurrentWeather(lat, lon) {
  const bundle = await fetchWeatherBundle(lat, lon);
  const { forecast: _f, ...current } = bundle;
  return current;
}
