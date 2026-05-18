import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { buildPath } from "../lib/routes";
import { pickWhatToDoNow } from "../lib/whatToDoNow";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";

/**
 * @param {{
 *   nextEvent: import('../lib/eventCountdown').getNextUpcomingEvent extends (...args: any) => infer R ? R : never;
 *   pendingTasks: Array<{ title: string; assignee?: string }>;
 *   lowStock: Array<{ name: string }>;
 *   pendingShoppingCount: number;
 * }} props
 */
export default function WhatToDoNowCard({
  nextEvent,
  pendingTasks,
  lowStock,
  pendingShoppingCount,
}) {
  const navigate = useNavigate();

  const pick = useMemo(
    () =>
      pickWhatToDoNow({
        nextEvent,
        pendingTasks,
        lowStock,
        pendingShoppingCount,
      }),
    [nextEvent, pendingTasks, lowStock, pendingShoppingCount],
  );

  function go() {
    const n = new Date();
    if (pick.mode === "finance") {
      navigate(
        buildPath({
          mode: "finance",
          page: "monthly",
          year: n.getFullYear(),
          month: n.getMonth(),
        }),
      );
    } else if (pick.mode === "shopping") {
      navigate(
        buildPath({
          mode: "shopping",
          shoppingContext: pick.shoppingContext ?? DEFAULT_SHOPPING_CONTEXT,
          supermarketMode: pick.openSupermarket ?? false,
        }),
      );
    } else if (pick.mode === "events") {
      navigate(
        buildPath({
          mode: "events",
          year: n.getFullYear(),
          month: n.getMonth(),
        }),
      );
    } else {
      navigate(
        buildPath({
          mode: "home",
          year: n.getFullYear(),
          month: n.getMonth(),
        }),
      );
    }
  }

  return (
    <button
      type="button"
      onClick={go}
      className="app-mobile-bleed w-full text-left rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 shadow-md text-white active:scale-[0.99] transition-transform sm:mx-0 sm:w-full sm:rounded-2xl"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
            ¿Qué hago ahora?
          </span>
          <span className="block text-base font-bold leading-snug mt-0.5">
            {pick.title}
          </span>
          <span className="block text-sm text-white/85 mt-1">{pick.subtitle}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-white/70 mt-1" />
      </div>
    </button>
  );
}
