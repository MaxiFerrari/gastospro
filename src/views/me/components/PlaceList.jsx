import { Calendar, MapPin, StickyNote } from "lucide-react";

/**
 * @typedef {import("../hooks/useSavedPlaces").SavedPlace} SavedPlace
 */

/**
 * @param {string | null | undefined} iso
 */
function formatVisitedDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * @param {{
 *   places: SavedPlace[];
 *   selectedId?: string | null;
 *   onSelect: (place: SavedPlace) => void;
 * }} props
 */
export default function PlaceList({ places, selectedId = null, onSelect }) {
  if (places.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-600 dark:bg-slate-800/50">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Todavía no guardaste lugares
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Buscá una dirección, usá tu ubicación o marcá un punto en el mapa.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {places.map((place) => {
        const active = selectedId === place.id;
        const visited = formatVisitedDate(place.visited_at);
        return (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => onSelect(place)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/40"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750"
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {place.name}
                </span>
                {place.address && (
                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {place.address}
                  </span>
                )}
                {visited && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3 w-3" />
                    Visitado {visited}
                  </span>
                )}
                {place.notes && (
                  <span className="mt-1 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                    {place.notes}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
