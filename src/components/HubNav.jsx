import { NavLink, useLocation } from "react-router-dom";
import { isHubTabActive } from "../lib/routes";
import {
  Wallet,
  ShoppingCart,
  Cake,
  Home,
  User,
} from "lucide-react";

/** @typedef {'finance'|'shopping'|'events'|'home'|'me'} HubMode */

const TABS = [
  { id: /** @type {const} */ ("finance"), label: "Finanzas", Icon: Wallet },
  { id: /** @type {const} */ ("shopping"), label: "Compras", Icon: ShoppingCart },
  { id: /** @type {const} */ ("events"), label: "Fiestas", Icon: Cake },
  { id: /** @type {const} */ ("home"), label: "Hogar", Icon: Home },
  { id: /** @type {const} */ ("me"), label: "Yo", Icon: User },
];

/**
 * @param {{ paths: Record<HubMode, string> }} props
 */
export default function HubNav({ paths }) {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[100] border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 pb-[env(safe-area-inset-bottom)]"
      aria-label="Modos de la app"
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map(({ id, label, Icon }) => (
          <NavLink
            key={id}
            to={paths[id]}
            className={() => {
              const active = isHubTabActive(id, location.pathname);
              return `touch-target flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors touch-manipulation ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`;
            }}
            onClick={() => window.scrollTo(0, 0)}
          >
            <Icon className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" strokeWidth={2} />
            <span className="max-w-full truncate leading-tight">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
