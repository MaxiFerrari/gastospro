import { useState } from "react";
import { Shield, Trash2, UserX, Loader2, Download } from "lucide-react";
import {
  deleteAllUserData,
  deleteAccount,
  clearLocalUserData,
} from "../lib/userDataDeletion";
import { fetchAllUserData, downloadBackupJson } from "../lib/dataExportImport";
import { toast, toastConfirm } from "../lib/toast";

/**
 * @param {{ userId: string; userEmail?: string | null; onAccountDeleted?: () => void }} props
 */
export default function PrivacyPanel({ userId, userEmail, onAccountDeleted }) {
  const [busy, setBusy] = useState(/** @type {'data' | 'account' | 'export' | null} */ (null));
  const [confirmAccount, setConfirmAccount] = useState("");
  const [showAccountConfirm, setShowAccountConfirm] = useState(false);

  async function handleExportFirst() {
    if (!userId) return;
    setBusy("export");
    try {
      const bundle = await fetchAllUserData(userId);
      downloadBackupJson(bundle);
      toast("Respaldo descargado. Guardalo antes de borrar datos.");
    } catch (err) {
      toast(err.message ?? "Error al exportar", "error");
    } finally {
      setBusy(null);
    }
  }

  function handleDeleteData() {
    toastConfirm(
      "¿Borrar todos tus datos en la nube? Tu cuenta de Google seguirá activa pero vacía. Esta acción no se puede deshacer.",
      async () => {
        setBusy("data");
        try {
          await deleteAllUserData(userId);
          clearLocalUserData(userId);
          toast("Datos borrados. Recargando…");
          setTimeout(() => window.location.reload(), 800);
        } catch (err) {
          toast(err.message ?? "No se pudieron borrar los datos", "error");
        } finally {
          setBusy(null);
        }
      },
    );
  }

  function handleDeleteAccount() {
    if (confirmAccount.trim().toUpperCase() !== "ELIMINAR") {
      toast("Escribí ELIMINAR para confirmar", "error");
      return;
    }
    toastConfirm(
      `¿Eliminar la cuenta${userEmail ? ` ${userEmail}` : ""} y todos los datos? No se puede deshacer.`,
      async () => {
        setBusy("account");
        try {
          await deleteAccount(userId);
          clearLocalUserData();
          toast("Cuenta eliminada");
          onAccountDeleted?.();
        } catch (err) {
          toast(err.message ?? "No se pudo eliminar la cuenta", "error");
        } finally {
          setBusy(null);
          setShowAccountConfirm(false);
          setConfirmAccount("");
        }
      },
    );
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:p-5 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950">
          <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Privacidad y cuenta
          </h2>
          <p className="text-xs text-slate-400">
            Exportar, borrar datos o eliminar cuenta
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
        Tus datos viven en Supabase (finanzas, hogar, eventos). Si conectaste Google
        Calendar, el permiso es solo lectura y podés revocarlo desde tu cuenta de Google.
      </p>

      <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4 list-disc pl-4">
        <li>Exportá un respaldo antes de borrar nada.</li>
        <li>Borrar datos mantiene el login; eliminar cuenta borra todo y la sesión.</li>
      </ul>

      <PrivacyActions
        busy={busy}
        showAccountConfirm={showAccountConfirm}
        setShowAccountConfirm={setShowAccountConfirm}
        confirmAccount={confirmAccount}
        setConfirmAccount={setConfirmAccount}
        onExport={handleExportFirst}
        onDeleteData={handleDeleteData}
        onDeleteAccount={handleDeleteAccount}
      />
    </section>
  );
}

/**
 * @param {{
 *   busy: 'data' | 'account' | 'export' | null;
 *   showAccountConfirm: boolean;
 *   setShowAccountConfirm: (v: boolean) => void;
 *   confirmAccount: string;
 *   setConfirmAccount: (v: string) => void;
 *   onExport: () => void;
 *   onDeleteData: () => void;
 *   onDeleteAccount: () => void;
 * }} props
 */
function PrivacyActions({
  busy,
  showAccountConfirm,
  setShowAccountConfirm,
  confirmAccount,
  setConfirmAccount,
  onExport,
  onDeleteData,
  onDeleteAccount,
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onExport}
        disabled={!!busy}
        className="touch-target w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50"
      >
        {busy === "export" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Descargar respaldo antes de borrar
      </button>

      <button
        type="button"
        onClick={onDeleteData}
        disabled={!!busy}
        className="touch-target w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 disabled:opacity-50"
      >
        {busy === "data" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Borrar todos mis datos en la nube
      </button>

      {!showAccountConfirm ? (
        <button
          type="button"
          onClick={() => setShowAccountConfirm(true)}
          disabled={!!busy}
          className="touch-target w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 disabled:opacity-50"
        >
          <UserX className="h-4 w-4" />
          Eliminar mi cuenta
        </button>
      ) : (
        <AccountConfirmForm
          confirmAccount={confirmAccount}
          setConfirmAccount={setConfirmAccount}
          busy={busy}
          onCancel={() => {
            setShowAccountConfirm(false);
            setConfirmAccount("");
          }}
          onDeleteAccount={onDeleteAccount}
        />
      )}
    </div>
  );
}

/**
 * @param {{
 *   confirmAccount: string;
 *   setConfirmAccount: (v: string) => void;
 *   busy: 'data' | 'account' | 'export' | null;
 *   onCancel: () => void;
 *   onDeleteAccount: () => void;
 * }} props
 */
function AccountConfirmForm({
  confirmAccount,
  setConfirmAccount,
  busy,
  onCancel,
  onDeleteAccount,
}) {
  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 p-3 space-y-2">
      <p className="text-xs text-rose-800 dark:text-rose-200">
        Escribí <strong>ELIMINAR</strong> para confirmar la baja de la cuenta.
      </p>
      <input
        type="text"
        value={confirmAccount}
        onChange={(e) => setConfirmAccount(e.target.value)}
        placeholder="ELIMINAR"
        className="w-full px-3 py-2 text-sm rounded-lg border border-rose-200 dark:border-rose-800 dark:bg-slate-900 dark:text-slate-100"
        autoComplete="off"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg py-2 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={busy === "account"}
          className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "account" ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "Eliminar cuenta"
          )}
        </button>
      </div>
    </div>
  );
}
