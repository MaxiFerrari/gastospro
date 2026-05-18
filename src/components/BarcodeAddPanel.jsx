import { useState, useRef, useEffect } from "react";
import { Barcode, Camera, Loader2, X } from "lucide-react";
import { lookupBarcode } from "../lib/openFoodFacts";
import { toast } from "../lib/toast";

/**
 * @param {{ onAdd: (product: object) => Promise<void>; onClose: () => void }} props
 */
export default function BarcodeAddPanel({ onAdd, onClose }) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => {
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleLookup(code) {
    const c = code.replace(/\D/g, "");
    if (c.length < 8) {
      toast("Código inválido", "warning");
      return;
    }
    setLoading(true);
    try {
      const product = await lookupBarcode(c);
      await onAdd(product);
      toast(`"${product.name}" agregado`);
      onClose();
    } catch (e) {
      toast(e.message ?? "No encontrado", "error");
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    if (!("BarcodeDetector" in window)) {
      toast("Tu navegador no soporta escaneo con cámara. Ingresá el código manualmente.", "warning");
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
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a"] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopCamera();
            await handleLookup(codes[0].rawValue);
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

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Escanear producto
          </h3>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {scanning ? (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] mb-3">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/90">
              Apuntá al código de barras
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl bg-blue-600 text-white font-semibold"
          >
            <Camera className="h-5 w-5" />
            Abrir cámara
          </button>
        )}

        {scanning && (
          <button
            type="button"
            onClick={stopCamera}
            className="w-full py-2 mb-3 text-sm text-slate-500"
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
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Datos por Open Food Facts
        </p>
      </div>
    </div>
  );
}
