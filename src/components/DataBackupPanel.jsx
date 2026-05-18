import { useState, useRef } from "react";
import { Cloud, Download, Upload, Loader2 } from "lucide-react";
import {
  fetchAllUserData,
  downloadBackupJson,
  parseBackupFile,
  importAllUserData,
} from "../lib/dataExportImport";
import { toast, toastConfirm } from "../lib/toast";
import { unlockBackupMedal } from "../lib/medals";

/**
 * @param {{ userId: string }} props
 */
export default function DataBackupPanel({ userId }) {
  const fileRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState("merge");

  async function handleExport() {
    if (!userId) return;
    setExporting(true);
    try {
      const bundle = await fetchAllUserData(userId);
      downloadBackupJson(bundle);
      const n = Object.values(bundle.data).reduce(
        (acc, v) => acc + (Array.isArray(v) ? v.length : v ? 1 : 0),
        0,
      );
      toast(`Respaldo descargado (${n} registros)`);
      const medal = unlockBackupMedal(userId);
      if (medal) toast(`Medalla: ${medal.emoji} ${medal.title}`);
    } catch (err) {
      toast(err.message ?? "Error al exportar", "error");
    } finally {
      setExporting(false);
    }
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFile(file) {
    if (!file || !userId) return;
    let bundle;
    try {
      bundle = await parseBackupFile(file);
    } catch (err) {
      toast(err.message ?? "Archivo inválido", "error");
      return;
    }

    const label =
      importMode === "replace"
        ? "reemplazar todos tus datos en la nube"
        : "fusionar con tus datos actuales";

    toastConfirm(`¿Confirmás importar y ${label}?`, async () => {
      setImporting(true);
      try {
        await importAllUserData(userId, bundle, importMode);
        toast("Datos importados. Recargá la app si algo no se ve actualizado.");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        toast(err.message ?? "Error al importar", "error");
      } finally {
        setImporting(false);
      }
    });
  }

  return (
    <section className="app-mobile-bleed bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:mx-0 sm:w-full sm:rounded-2xl sm:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950">
          <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Datos en la nube
          </h2>
          <p className="text-xs text-slate-400">
            Finanzas, hogar, hábitos, compras e inventario sincronizados con tu cuenta
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Exportá un archivo JSON con todo tu historial o importalo en otro dispositivo.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="radio"
            name="importMode"
            checked={importMode === "merge"}
            onChange={() => setImportMode("merge")}
            className="accent-sky-600"
          />
          Fusionar
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="radio"
            name="importMode"
            checked={importMode === "replace"}
            onChange={() => setImportMode("replace")}
            className="accent-sky-600"
          />
          Reemplazar todo
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !userId}
          className="touch-target inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar JSON
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          disabled={importing || !userId}
          className="touch-target inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50"
        >
          {importing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Importar JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
