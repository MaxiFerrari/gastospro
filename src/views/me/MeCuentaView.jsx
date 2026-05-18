import { useNavigate } from "react-router-dom";
import { User, Shield, ChevronRight } from "lucide-react";
import DataBackupPanel from "./components/DataBackupPanel";
import HubSubpageHeader from "@views/shared/HubSubpageHeader";
import { ME_HUB_PATH, ME_PRIVACIDAD_PATH } from "@lib/routes";

/**
 * @param {{ userId: string; userEmail?: string | null }} props
 */
export default function MeCuentaView({ userId, userEmail }) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-3xl lg:mx-auto space-y-4">
      <HubSubpageHeader
        title="Mi cuenta"
        subtitle="Perfil y datos en la nube"
        backTo={ME_HUB_PATH}
        backLabel="Inicio"
      />

      <section className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:mx-0 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950">
            <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Sesión
            </h2>
            {userEmail ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {userEmail}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sin correo</p>
            )}
          </div>
        </div>
      </section>

      <DataBackupPanel userId={userId} />

      <section className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:mx-0 sm:p-5">
        <button
          type="button"
          onClick={() => navigate(ME_PRIVACIDAD_PATH)}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
            <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
              Privacidad y baja de cuenta
            </span>
            <span className="block text-xs text-slate-400">
              Borrar datos, eliminar cuenta y permisos de Google
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </section>
    </div>
  );
}
