import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import {
  MEDAL_DEFINITIONS,
  getUnlockedMedals,
  evaluateMedals,
  getSupermarketCheckCount,
} from "../lib/medals";
import { toast } from "../lib/toast";

/**
 * @param {{
 *   userId: string;
 *   eventCount: number;
 *   nextEventDays: number | null;
 *   doneTaskCount: number;
 *   lowStockCount: number;
 * }} props
 */
export default function MedalsPanel({
  userId,
  eventCount,
  nextEventDays,
  doneTaskCount,
  lowStockCount,
}) {
  const [unlocked, setUnlocked] = useState(() => getUnlockedMedals(userId));

  useEffect(() => {
    const fresh = evaluateMedals(userId, {
      eventCount,
      nextEventDays,
      doneTaskCount,
      lowStockCount,
      supermarketChecks: getSupermarketCheckCount(userId),
    });
    if (fresh.length) {
      setUnlocked(getUnlockedMedals(userId));
      for (const m of fresh) {
        toast(`Medalla desbloqueada: ${m.emoji} ${m.title}`);
      }
    } else {
      setUnlocked(getUnlockedMedals(userId));
    }
  }, [userId, eventCount, nextEventDays, doneTaskCount, lowStockCount]);

  const unlockedSet = new Set(unlocked);

  return (
    <section className="app-hub-inset min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
      <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
        <Award className="h-5 w-5 shrink-0 text-amber-500" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Medallas
        </h2>
        <span className="ml-auto text-xs text-slate-400 tabular-nums">
          {unlocked.length}/{MEDAL_DEFINITIONS.length}
        </span>
      </div>

      <div
        className="grid w-full min-w-0 grid-cols-3 gap-1.5 sm:gap-2 [&>*:last-child:nth-child(3n+1)]:col-start-2"
        role="list"
      >
        {MEDAL_DEFINITIONS.map((m) => {
          const on = unlockedSet.has(m.id);
          return (
            <div
              key={m.id}
              role="listitem"
              className={`min-w-0 rounded-lg border p-2 text-center transition-colors sm:rounded-xl sm:p-3 ${
                on
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/40"
                  : "border-slate-100 bg-slate-50 opacity-70 grayscale dark:border-slate-600 dark:bg-slate-700/40"
              }`}
              title={m.desc}
            >
              <span className="mb-0.5 block text-xl leading-none sm:mb-1 sm:text-2xl">
                {m.emoji}
              </span>
              <span className="block text-[10px] font-semibold leading-tight text-slate-800 line-clamp-2 dark:text-slate-100 sm:text-xs">
                {m.title}
              </span>
              {!on && (
                <span className="mt-1 hidden text-[10px] leading-snug text-slate-400 line-clamp-2 sm:block">
                  {m.desc}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-400 sm:hidden">
        Mantené presionada una medalla para ver cómo desbloquearla.
      </p>
    </section>
  );
}
