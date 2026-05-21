import { useCallback, useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Loader2,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import HubSubpageHeader from "@views/shared/HubSubpageHeader";
import { ME_HUB_PATH } from "@lib/routes";
import { getAccuratePosition } from "@lib/geolocation";
import { reverseGeocode, searchPlaces } from "@lib/nominatimGeocode";
import { toast } from "@lib/toast";
import { useSavedPlaces } from "./hooks/useSavedPlaces";
import PlaceMap from "./components/PlaceMap";
import PlaceList from "./components/PlaceList";
import PlaceFormDrawer from "./components/PlaceFormDrawer";

/**
 * @typedef {import("./hooks/useSavedPlaces").SavedPlace} SavedPlace
 * @typedef {import("./hooks/useSavedPlaces").PlaceInput} PlaceInput
 */

/**
 * @param {{ userId: string | null }} props
 */
export default function MapView({ userId }) {
  const {
    places,
    loading,
    addPlace,
    updatePlace,
    deletePlace,
  } = useSavedPlaces(userId);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(
    /** @type {import("@lib/nominatimGeocode").GeocodeResult[]} */ ([]),
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(
    /** @type {SavedPlace | null} */ (null),
  );
  const [draft, setDraft] = useState(
    /** @type {Partial<PlaceInput> | null} */ (null),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftMarker, setDraftMarker] = useState(
    /** @type {{ latitude: number; longitude: number } | null} */ (null),
  );
  const searchTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const openNewDraft = useCallback((input) => {
    setSelectedPlace(null);
    setDraft(input);
    setDraftMarker(
      input.latitude != null && input.longitude != null
        ? { latitude: input.latitude, longitude: input.longitude }
        : null,
    );
    setDrawerOpen(true);
    setPicking(false);
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(q);
        setSearchResults(results);
      } catch (e) {
        toast(e.message ?? "Error al buscar", "error");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  function handleSelectSearchResult(result) {
    setSearchQuery("");
    setSearchResults([]);
    openNewDraft({
      name: result.name,
      address: result.address ?? "",
      latitude: result.latitude,
      longitude: result.longitude,
    });
  }

  async function handleUseMyLocation() {
    if (locating) return;
    setLocating(true);
    setDraftMarker(null);
    try {
      const { latitude, longitude, accuracy } = await getAccuratePosition();
      setDraftMarker({ latitude, longitude });
      if (accuracy > 80) {
        toast(
          `Ubicación aproximada (±${Math.round(accuracy)} m). Podés ajustarla en el mapa.`,
          "warning",
        );
      }
      try {
        const geo = await reverseGeocode(latitude, longitude);
        openNewDraft({
          name: geo?.name ?? "Mi ubicación",
          address: geo?.address ?? "",
          latitude,
          longitude,
        });
      } catch {
        openNewDraft({
          name: "Mi ubicación",
          latitude,
          longitude,
        });
      }
    } catch (e) {
      toast(e.message ?? "No se pudo obtener tu ubicación", "error");
    } finally {
      setLocating(false);
    }
  }

  async function handlePickLocation(lat, lon) {
    setPicking(false);
    setDraftMarker({ latitude: lat, longitude: lon });
    try {
      const geo = await reverseGeocode(lat, lon);
      openNewDraft({
        name: geo?.name ?? "Lugar marcado",
        address: geo?.address ?? "",
        latitude: lat,
        longitude: lon,
      });
    } catch {
      openNewDraft({
        name: "Lugar marcado",
        latitude: lat,
        longitude: lon,
      });
    }
  }

  function handleSelectPlace(place) {
    setSelectedPlace(place);
    setDraft(null);
    setDraftMarker(null);
    setDrawerOpen(true);
  }

  async function handleSave(input, id) {
    setSaving(true);
    try {
      if (id) {
        const updated = await updatePlace(id, input);
        if (!updated) return false;
        setSelectedPlace(updated);
        toast("Lugar actualizado");
        return true;
      }
      const created = await addPlace(input);
      if (!created) return false;
      toast("Lugar guardado");
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    try {
      const ok = await deletePlace(id);
      if (ok) toast("Lugar eliminado");
      return ok;
    } finally {
      setSaving(false);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedPlace(null);
    setDraft(null);
    setDraftMarker(null);
    setPicking(false);
  }

  return (
    <div className="mx-auto w-full space-y-4 pb-4 sm:space-y-6 lg:max-w-none">
      <HubSubpageHeader
        title="Mapa"
        subtitle="Lugares visitados y notas"
        backTo={ME_HUB_PATH}
        backLabel="Inicio"
      />

      <section className="app-hub-inset space-y-3 bg-white p-4 shadow-sm dark:bg-slate-800 sm:rounded-2xl sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dirección o lugar…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-700"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
            {searchResults.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {searchResults.map((result) => (
                  <li key={`${result.latitude}-${result.longitude}-${result.name}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                      <span>
                        <span className="block font-medium text-slate-800 dark:text-slate-100">
                          {result.name}
                        </span>
                        {result.address && (
                          <span className="block text-xs text-slate-400 line-clamp-2">
                            {result.address}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/60 sm:flex-none"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              {locating ? "Buscando GPS…" : "Mi ubicación"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPicking((v) => !v);
                setSearchResults([]);
              }}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium sm:flex-none ${
                picking
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/60"
              }`}
            >
              <MapPin className="h-4 w-4" />
              Marcar aquí
            </button>
          </div>
        </div>

        <PlaceMap
          places={places}
          selectedId={selectedPlace?.id ?? null}
          picking={picking}
          draftMarker={draftMarker}
          onSelectPlace={handleSelectPlace}
          onPickLocation={handlePickLocation}
        />
      </section>

      <section className="app-hub-inset bg-white p-4 shadow-sm dark:bg-slate-800 sm:rounded-2xl sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Lugares guardados
            </h2>
            <p className="text-xs text-slate-400">
              {loading ? "Cargando…" : `${places.length} lugar${places.length === 1 ? "" : "es"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPicking(true);
              toast("Tocá el mapa para elegir la ubicación");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
        <PlaceList
          places={places}
          selectedId={selectedPlace?.id ?? null}
          onSelect={handleSelectPlace}
        />
      </section>

      <PlaceFormDrawer
        open={drawerOpen}
        place={selectedPlace}
        initial={draft}
        saving={saving}
        onClose={closeDrawer}
        onSave={handleSave}
        onDelete={selectedPlace ? handleDelete : undefined}
      />
    </div>
  );
}
