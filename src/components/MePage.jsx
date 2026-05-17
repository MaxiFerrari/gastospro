import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HUB_MODES,
  HUB_NAV,
  getDefaultHubMode,
  setDefaultHubMode,
} from "../lib/lifeHub";
import { buildPath } from "../lib/routes";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";
import { useMeData } from "../hooks/useMeData";
import { Sparkles, Target, Trash2 } from "lucide-react";

const SCALE_LABELS = ["Muy bajo", "Bajo", "Normal", "Alto", "Muy alto"];

function ScaleRow({ label, value, onChange }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              value === n
                ? "bg-violet-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            }`}
            title={SCALE_LABELS[n - 1]}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MePage({ userId }) {
  const navigate = useNavigate();
  const {
    habits,
    todayCheckIn,
    focusMinutes,
    setFocusMinutes,
    habitsDoneToday,
    addHabit,
    completeHabitToday,
    deleteHabit,
    saveCheckIn,
  } = useMeData(userId);

  const [habitName, setHabitName] = useState("");
  const [defaultMode, setDefaultModeState] = useState(getDefaultHubMode);

  const energy = todayCheckIn?.energy ?? null;
  const mood = todayCheckIn?.mood ?? null;
  const sleep = todayCheckIn?.sleep ?? null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-4">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Check-in de hoy
            </h2>
            <p className="text-xs text-slate-400">10 segundos, sin montos</p>
          </div>
        </div>
        <div className="space-y-4">
          <ScaleRow
            label="Energía"
            value={energy}
            onChange={(n) => saveCheckIn({ energy: n })}
          />
          <ScaleRow
            label="Ánimo"
            value={mood}
            onChange={(n) => saveCheckIn({ mood: n })}
          />
          <ScaleRow
            label="Descanso"
            value={sleep}
            onChange={(n) => saveCheckIn({ sleep: n })}
          />
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Hábitos
            </h2>
            <p className="text-xs text-slate-400">
              {habitsDoneToday}/{habits.length} hoy
            </p>
          </div>
        </div>
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!habitName.trim()) return;
            addHabit(habitName);
            setHabitName("");
          }}
        >
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Nuevo hábito…"
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium"
          >
            +
          </button>
        </form>
        <ul className="space-y-2">
          {habits.length === 0 ? (
            <li className="text-sm text-slate-400 text-center py-4">
              Agregá un hábito pequeño (ej. estirar, leer 5 min)
            </li>
          ) : (
            habits.map((h) => {
              const doneToday = h.lastDone === new Date().toISOString().slice(0, 10);
              return (
                <li
                  key={h.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/60"
                >
                  <button
                    type="button"
                    onClick={() => completeHabitToday(h.id)}
                    className={`flex-1 text-left text-sm font-medium ${
                      doneToday
                        ? "text-violet-600 dark:text-violet-400 line-through"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {h.name}
                    {h.streak > 0 && (
                      <span className="ml-2 text-xs text-slate-400 font-normal">
                        🔥 {h.streak}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteHabit(h.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Enfoque hoy
          </h2>
        </div>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 tabular-nums mb-2">
          {focusMinutes} min
        </p>
        <div className="flex gap-2">
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFocusMinutes((prev) => prev + m)}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              +{m} min
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
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
                  const n = new Date();
                  if (id === "finance") {
                    navigate(
                      buildPath({
                        mode: "finance",
                        page: "monthly",
                        year: n.getFullYear(),
                        month: n.getMonth(),
                      }),
                    );
                  } else if (id === "shopping") {
                    navigate(
                      buildPath({
                        mode: "shopping",
                        shoppingContext: DEFAULT_SHOPPING_CONTEXT,
                      }),
                    );
                  } else {
                    navigate(
                      buildPath({
                        mode: id,
                        year: n.getFullYear(),
                        month: n.getMonth(),
                      }),
                    );
                  }
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
    </div>
  );
}
