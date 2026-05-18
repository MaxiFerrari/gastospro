import { useState, useRef, useEffect } from "react";
import { useBackdropDismiss } from "../hooks/useBackdropDismiss";
import { Barcode, Camera, Loader2, X } from "lucide-react";
import { lookupBarcode } from "../lib/openFoodFacts";
import { parseAmount } from "../lib/amount";
import { toast } from "../lib/toast";
import { fireBarcodeScanFeedback } from "../lib/feedback";

/**
 * @param {{
 *   onConfirm: (product: object) => Promise<void>;
 *   onClose: () => void;
 *   getCatalogProduct?: (barcode: string) => { price?: number } | null;
 *   requirePrice?: boolean;
 *   title?: string;
 * }} props
 */
export default function BarcodeAddPanel({
  onConfirm,
  onClose,
  getCatalogProduct,
  requirePrice = true,
  title = "Escanear producto",
}) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("scan");
  const [draft, setDraft] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => {
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function openConfirm(product, { withSound = true } = {}) {
    if (withSound) fireBarcodeScanFeedback();
    const existing = product.barcode
      ? getCatalogProduct?.(product.barcode)
      : null;
    const prefill =
      existing?.price != null ? String(existing.price) : "";
    setDraft(product);
    setPriceInput(prefill);
    setPhase("confirm");
  }

  async function handleLookup(code, { skipBeep = false } = {}) {
    const c = code.replace(/\D/g, "");
    if (c.length < 8) {
      toast("Código inválido", "warning");
      return;
    }
    setLoading(true);
    try {
      const product = await lookupBarcode(c);
      openConfirm(product, { withSound: !skipBeep });
    } catch (e) {
      toast(e.message ?? "No encontrado", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (!draft) return;
    const price = parseAmount(priceInput);
    if (requirePrice && price == null) {
      toast("Ingresá el precio del envase", "warning");
      return;
    }
    setLoading(true);
    try {
      await onConfirm({
        ...draft,
        price: price ?? null,
      });
      onClose();
    } catch (err) {
      toast(err?.message ?? "Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    if (!("BarcodeDetector" in window)) {
      toast(
        "Tu navegador no soporta escaneo con cámara. Ingresá el código manualmente.",
        "warning",
      );
      return;
    }
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // @ts-expect-error BarcodeDetector is not in all TS libs
      const detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a"],
      });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopCamera();
            fireBarcodeScanFeedback();
            await handleLookup(codes[0].rawValue, { skipBeep: true });
            return;
          }
        } catch {
          /* frame skip */
        }
        loopRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setScanning(false);
      toast("No se pudo acceder a la cámara", "error");
    }
  }

  function stopCamera() {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  const backdropDismiss = useBackdropDismiss(handleClose);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 sm:items-center"
      {...backdropDismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-800"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <Barcode className="h-5 w-5" />
            {phase === "confirm" ? "Precio del producto" : title}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {phase === "confirm" && draft ? (
          <form onSubmit={handleConfirm} className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/60">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {draft.name}
              </p>
              {draft.brand && (
                <p className="text-sm text-slate-500">{draft.brand}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {draft.category}
                {draft.size
                  ? ` · ${draft.size} ${draft.unit !== "u" ? draft.unit : ""}`
                  : ""}
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-400">
                {draft.barcode}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Precio del envase (ARS)
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="Ej: 1.250"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              {parseAmount(priceInput) != null && draft.unit && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Se guarda para calcular precio por{" "}
                  {draft.unit === "L"
                    ? "litro"
                    : draft.unit === "kg"
                      ? "kilo"
                      : "unidad"}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("scan");
                  setDraft(null);
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </form>
        ) : (
          <>
            {scanning ? (
              <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                />
                <p className="absolute inset-x-0 bottom-2 text-center text-xs text-white/90">
                  Apuntá al código de barras
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white"
              >
                <Camera className="h-5 w-5" />
                Abrir cámara
              </button>
            )}

            {scanning && (
              <button
                type="button"
                onClick={stopCamera}
                className="mb-3 w-full py-2 text-sm text-slate-500"
              >
                Detener cámara
              </button>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(manualCode);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                inputMode="numeric"
                placeholder="Código EAN manual"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Buscar"
                )}
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              Datos por Open Food Facts
            </p>
          </>
        )}
      </div>
    </div>
  );
}
