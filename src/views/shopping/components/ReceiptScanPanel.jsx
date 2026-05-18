import { useState } from "react";
import { ScanLine, ClipboardPaste, Plus } from "lucide-react";
import { parseReceiptText, scanReceiptImage } from "@lib/receiptOcr";
import { toast } from "@lib/toast";

/**
 * @param {{ onAddItems: (items: { name: string; quantity?: number }[]) => void | Promise<void> }} props
 */
export default function ReceiptScanPanel({ onAddItems }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [open, setOpen] = useState(false);

  function handleParse() {
    const { items } = parseReceiptText(text);
    setPreview(items);
    if (!items.length) toast("No se detectaron ítems. Probá pegar más líneas del ticket.", "warning");
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { items } = await scanReceiptImage(file);
      setPreview(items);
    } catch (err) {
      toast(err.message ?? "OCR no disponible", "warning");
    }
    e.target.value = "";
  }

  async function handleAddAll() {
    if (!preview.length) return;
    await onAddItems(preview.map((i) => ({ name: i.name, quantity: i.quantity ?? 1 })));
    toast(`✓ ${preview.length} ítem${preview.length > 1 ? "s" : ""} agregados`);
    setPreview([]);
    setText("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/50 bg-violet-50 py-3 text-sm font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
      >
        <ScanLine className="h-4 w-4" />
        Escanear / importar ticket
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-900 dark:bg-violet-950/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
          Ticket → lista de compras
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-violet-600 dark:text-violet-400"
        >
          Cerrar
        </button>
      </div>
      <p className="mb-3 text-xs text-violet-800/80 dark:text-violet-300/80">
        En iPhone: seleccioná el texto del ticket con Live Text y pegalo abajo.
        OCR desde foto llegará en una próxima versión.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Ej:\nLECHE 1L    2.450\nPAN LACTAL   3.100\nQUESO 200G   4.800"}
        rows={5}
        className="mb-2 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-base text-slate-800 placeholder:text-slate-400 dark:border-violet-800 dark:bg-slate-900 dark:text-slate-100"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleParse}
          className="btn-icon flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Analizar texto
        </button>
        <label className="btn-icon flex cursor-pointer items-center gap-1 rounded-lg border border-violet-300 px-3 py-2 text-xs font-medium text-violet-700 dark:text-violet-300">
          <ScanLine className="h-3.5 w-3.5" />
          Foto (próximamente)
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
        </label>
      </div>
      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-violet-900 dark:text-violet-200">
            {preview.length} ítems detectados
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
            {preview.map((item, i) => (
              <li key={i} className="flex justify-between gap-2 rounded-lg bg-white/60 px-2 py-1 dark:bg-slate-900/60">
                <span>{item.name}</span>
                {item.price != null && (
                  <span className="tabular-nums text-slate-500">
                    ${item.price.toLocaleString("es-AR")}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleAddAll}
            className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Agregar a la lista
          </button>
        </div>
      )}
    </div>
  );
}
