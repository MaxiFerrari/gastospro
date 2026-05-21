import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import TextField from "@components/ui/TextField";
import TextAreaField from "@components/ui/TextAreaField";
import { modalBackdrop, modalOverlay, drawerPanel } from "@lib/modalClasses";
import { toastConfirm } from "@lib/toast";

/**
 * @typedef {import("../hooks/useSavedPlaces").SavedPlace} SavedPlace
 * @typedef {import("../hooks/useSavedPlaces").PlaceInput} PlaceInput
 */

/**
 * @param {PlaceInput & { id?: string }} draft
 * @returns {PlaceInput}
 */
function normalizeDraft(draft) {
  return {
    name: draft.name?.trim() ?? "",
    latitude: draft.latitude,
    longitude: draft.longitude,
    address: draft.address?.trim() ?? "",
    notes: draft.notes?.trim() ?? "",
    visited_at: draft.visited_at || null,
  };
}

/**
 * @param {{
 *   open: boolean;
 *   place?: SavedPlace | null;
 *   initial?: Partial<PlaceInput> | null;
 *   saving?: boolean;
 *   onClose: () => void;
 *   onSave: (input: PlaceInput, id?: string) => Promise<boolean>;
 *   onDelete?: (id: string) => Promise<boolean>;
 * }} props
 */
export default function PlaceFormDrawer({
  open,
  place = null,
  initial = null,
  saving = false,
  onClose,
  onSave,
  onDelete,
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  useEffect(() => {
    if (!open) return;
    const source = place ?? initial;
    setName(source?.name ?? "");
    setAddress(source?.address ?? "");
    setNotes(source?.notes ?? "");
    setVisitedAt(source?.visited_at ?? "");
    setLatitude(source?.latitude ?? 0);
    setLongitude(source?.longitude ?? 0);
  }, [open, place, initial]);

  if (!open) return null;

  const isEdit = Boolean(place?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    const input = normalizeDraft({
      name,
      address,
      notes,
      visited_at: visitedAt || null,
      latitude,
      longitude,
    });
    if (!input.name) return;
    const ok = await onSave(input, place?.id);
    if (ok) onClose();
  }

  async function handleDelete() {
    if (!place?.id || !onDelete) return;
    toastConfirm("¿Eliminar este lugar?", async () => {
      const deleted = await onDelete(place.id);
      if (deleted) onClose();
    });
  }

  return (
    <div className={modalOverlay()} role="dialog" aria-modal="true">
      <button
        type="button"
        className={modalBackdrop()}
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className={`${drawerPanel()} px-4 sm:px-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? "Editar lugar" : "Nuevo lugar"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Café favorito"
            required
            autoFocus
          />
          <TextField
            label="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Opcional"
          />
          <TextField
            label="Fecha de visita"
            type="date"
            value={visitedAt}
            onChange={(e) => setVisitedAt(e.target.value)}
          />
          <TextAreaField
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Qué hiciste, con quién fuiste, recomendaciones…"
            rows={4}
          />
          <p className="text-xs text-slate-400">
            Coordenadas: {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
