import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HUB_MODES,
  HUB_NAV,
  getDefaultHubMode,
  setDefaultHubMode,
} from "@lib/lifeHub";
import {
  buildPath,
  ME_CUENTA_PATH,
  ME_MAPA_PATH,
  ME_PRIVACIDAD_PATH,
} from "@lib/routes";
import { DEFAULT_SHOPPING_CONTEXT } from "@lib/shoppingContexts";
import HomeCommandCenter from "./components/HomeCommandCenter";
import AppFunSettings from "./components/AppFunSettings";
import {
  Wallet,
  ShoppingCart,
  Cake,
  Home,
  ChevronRight,
  Settings2,
  User,
  Shield,
  MapPin,
} from "lucide-react";

const QUICK_LINKS = [
  {
    mode: "finance",
    label: "Finanzas",
    desc: "Gastos, presupuesto y resumen del mes",
    Icon: Wallet,
  },
  {
    mode: "shopping",
    label: "Compras",
    desc: "Listas, inventario y supermercado",
    Icon: ShoppingCart,
  },
  {
    mode: "events",
    label: "Celebraciones",
    desc: "Eventos, invitados y gastos de fiesta",
    Icon: Cake,
  },
  {
    mode: "home",
    label: "Hogar",
    desc: "Tareas pendientes y quién las hace",
    Icon: Home,
  },
];

function navigateToMode(navigate, mode) {
  const n = new Date();
  if (mode === "finance") {
    navigate(
      buildPath({
        mode: "finance",
        page: "monthly",
        year: n.getFullYear(),
        month: n.getMonth(),
      }),
    );
  } else if (mode === "shopping") {
    navigate(
      buildPath({
        mode: "shopping",
        shoppingContext: DEFAULT_SHOPPING_CONTEXT,
      }),
    );
  } else {
    navigate(
      buildPath({
        mode,
        year: n.getFullYear(),
        month: n.getMonth(),
      }),
    );
  }
}

/**
 * @param {{ userId: string; userEmail?: string | null }} props
 */
export default function MeView({ userId, userEmail }) {
  const navigate = useNavigate();
  const [defaultMode, setDefaultModeState] = useState(getDefaultHubMode);

  return (
    <div className="mx-auto w-full space-y-3 pb-4 sm:space-y-6 lg:max-w-none">
      <section className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950">
            <Settings2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Inicio
            </h2>
            {userEmail && (
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
          Tu casa, eventos y ajustes en un solo lugar.
        </p>
      </section>

      <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="lg:col-span-8">
          <HomeCommandCenter userId={userId} />
        </div>

        <aside className="mt-4 space-y-3 app-hub-inset sm:mt-6 sm:space-y-6 lg:col-span-4 lg:mt-0 lg:mx-0">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">
          Ir a…
        </h2>
        <ul className="space-y-2">
          {QUICK_LINKS.map(({ mode, label, desc, Icon }) => (
            <li key={mode}>
              <button
                type="button"
                onClick={() => navigateToMode(navigate, mode)}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                  <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {label}
                  </span>
                  <span className="block text-xs text-slate-400">{desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <AppFunSettings />

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">
          Cuenta
        </h2>
        <ul className="space-y-2">
          <li>
            <button
              type="button"
              onClick={() => navigate(ME_MAPA_PATH)}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Mapa
                </span>
                <span className="block text-xs text-slate-400">
                  Lugares visitados y notas
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => navigate(ME_CUENTA_PATH)}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Mi cuenta
                </span>
                <span className="block text-xs text-slate-400">
                  Perfil, respaldo e importación
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => navigate(ME_PRIVACIDAD_PATH)}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Privacidad
                </span>
                <span className="block text-xs text-slate-400">
                  Borrar datos y eliminar cuenta
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </li>
        </ul>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Modo al abrir la app
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          Atajos PWA y pantalla inicial usan este modo por defecto.
        </p>
        <div className="flex flex-wrap gap-2">
          {HUB_MODES.map((id) => {
            const nav = HUB_NAV.find((n) => n.id === id);
            const active = defaultMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDefaultHubMode(id);
                  setDefaultModeState(id);
                  navigateToMode(navigate, id);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {nav?.shortLabel ?? id}
              </button>
            );
          })}
        </div>
      </section>
        </aside>
      </div>
    </div>
  );
}
