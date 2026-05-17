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
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-amber-500" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Medallas
        </h2>
        <span className="text-xs text-slate-400 ml-auto">
          {unlocked.length}/{MEDAL_DEFINITIONS.length}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MEDAL_DEFINITIONS.map((m) => {
          const on = unlockedSet.has(m.id);
          return (
            <div
              key={m.id}
              className={`rounded-xl p-3 border text-center transition-colors ${
                on
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50"
                  : "bg-slate-50 border-slate-100 opacity-60 grayscale dark:bg-slate-700/40 dark:border-slate-600"
              }`}
              title={m.desc}
            >
              <span className="text-2xl block mb-1">{m.emoji}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block leading-tight">
                {m.title}
              </span>
              {!on && (
                <span className="text-[10px] text-slate-400 mt-1 block line-clamp-2">
                  {m.desc}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
