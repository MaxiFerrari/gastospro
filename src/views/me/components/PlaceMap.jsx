import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { setupLeafletIcons } from "@lib/leafletSetup";

const DEFAULT_CENTER = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 5;

/**
 * @typedef {import("../hooks/useSavedPlaces").SavedPlace} SavedPlace
 */

/**
 * @param {{ places: SavedPlace[]; disabled?: boolean }} props
 */
function FitBounds({ places, disabled = false }) {
  const map = useMap();

  useEffect(() => {
    if (disabled || places.length === 0) return;
    const bounds = L.latLngBounds(
      places.map((p) => [p.latitude, p.longitude]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [places, map, disabled]);

  return null;
}

/**
 * @param {{ point?: { latitude: number; longitude: number } | null; zoom?: number }} props
 */
function FlyToPoint({ point, zoom = 17 }) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;
    map.flyTo([point.latitude, point.longitude], zoom, { duration: 0.6 });
  }, [point, zoom, map]);

  return null;
}

/**
 * @param {{ active: boolean; onPick: (lat: number, lon: number) => void }} props
 */
function MapPickHandler({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * @param {{
 *   places: SavedPlace[];
 *   selectedId?: string | null;
 *   picking?: boolean;
 *   draftMarker?: { latitude: number; longitude: number } | null;
 *   onSelectPlace?: (place: SavedPlace) => void;
 *   onPickLocation?: (lat: number, lon: number) => void;
 * }} props
 */
export default function PlaceMap({
  places,
  selectedId = null,
  picking = false,
  draftMarker = null,
  onSelectPlace,
  onPickLocation,
}) {
  useEffect(() => {
    setupLeafletIcons();
  }, []);

  const center =
    draftMarker != null
      ? [draftMarker.latitude, draftMarker.longitude]
      : places.length === 1
        ? [places[0].latitude, places[0].longitude]
        : DEFAULT_CENTER;

  const zoom =
    draftMarker != null || places.length === 1 ? 14 : DEFAULT_ZOOM;

  return (
    <div
      className={`relative h-[52dvh] min-h-[240px] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600 ${
        picking ? "cursor-crosshair ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-900" : ""
      }`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.length > 0 && (
          <FitBounds places={places} disabled={draftMarker != null} />
        )}
        {draftMarker && <FlyToPoint point={draftMarker} zoom={17} />}
        {onPickLocation && (
          <MapPickHandler active={picking} onPick={onPickLocation} />
        )}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            eventHandlers={{
              click: () => onSelectPlace?.(place),
            }}
            opacity={selectedId && selectedId !== place.id ? 0.65 : 1}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-slate-800">{place.name}</p>
                {place.address && (
                  <p className="mt-1 text-xs text-slate-500">{place.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {draftMarker && (
          <Marker position={[draftMarker.latitude, draftMarker.longitude]} />
        )}
      </MapContainer>
      {picking && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-3">
          <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow">
            Tocá el mapa para marcar el lugar
          </span>
        </div>
      )}
    </div>
  );
}
