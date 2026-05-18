import { useState } from "react";
import { Volume2 } from "lucide-react";
import {
  getSupermarketFeedbackEnabled,
  setSupermarketFeedbackEnabled,
} from "../lib/appPreferences";
import { fireSupermarketCheckFeedback } from "../lib/feedback";

export default function AppFunSettings() {
  const [feedbackOn, setFeedbackOn] = useState(getSupermarketFeedbackEnabled);

  function toggle() {
    const next = !feedbackOn;
    setFeedbackOn(next);
    setSupermarketFeedbackEnabled(next);
    if (next) fireSupermarketCheckFeedback();
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="h-5 w-5 text-slate-400" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Experiencia
        </h2>
      </div>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Sonido y vibración en compras
          </span>
          <span className="block text-xs text-slate-400 mt-0.5">
            Beep al escanear y tick al tachar en el súper
          </span>
        </span>
        <input
          type="checkbox"
          checked={feedbackOn}
          onChange={toggle}
          className="h-5 w-5 rounded accent-violet-600 shrink-0"
        />
      </label>
    </section>
  );
}
