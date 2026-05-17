import { useState } from "react";
import { AlertTriangle, Check, Home, Plus, RotateCcw, Trash2, Users, X } from "lucide-react";
import { toast, toastConfirm } from "../lib/toast";
import { useHomeData } from "../hooks/useHomeData";
import { useInventory } from "../hooks/useInventory";

export default function HomePage({ userId }) {
  const {
    pendingTasks,
    doneTasks,
    members,
    addTask,
    toggleTask,
    deleteTask,
    addMember,
    removeMember,
  } = useHomeData(userId);
  const { lowStock } = useInventory(userId);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("Yo");
  const [newMember, setNewMember] = useState("");

  function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title, assignee);
    setTitle("");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Inventario bajo
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {lowStock.map((x) => x.name).join(", ")} — revisá en Compras
            </p>
          </div>
        </div>
      )}

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950">
            <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Tareas del hogar
            </h2>
            <p className="text-xs text-slate-400">
              {pendingTasks.length} pendiente
              {pendingTasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nueva tarea…"
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            Agregar
          </button>
        </form>

        <ul className="space-y-2">
          {pendingTasks.length === 0 ? (
            <li className="text-sm text-slate-400 py-4 text-center">
              No hay tareas pendientes
            </li>
          ) : (
            pendingTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/60"
              >
                <button
                  type="button"
                  onClick={() => toggleTask(t.id)}
                  className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-500 flex items-center justify-center shrink-0 hover:border-emerald-500"
                  aria-label="Completar"
                >
                  <Check className="w-3.5 h-3.5 text-transparent" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {t.title}
                  </p>
                  <p className="text-xs text-slate-400">{t.assignee}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))
          )}
        </ul>

        {doneTasks.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-slate-400 cursor-pointer">
              Completadas ({doneTasks.length})
            </summary>
            <ul className="mt-2 space-y-2">
              {doneTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(t.id)}
                    className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 hover:bg-emerald-600"
                    aria-label="Marcar como pendiente"
                    title="Marcar como pendiente"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-through">
                      {t.title}
                    </p>
                    <p className="text-xs text-slate-400">{t.assignee}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTask(t.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Pendiente
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Quién hace qué
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {members.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {m}
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    toastConfirm(`¿Eliminar a "${m}" del hogar?`, async () => {
                      const ok = await removeMember(m);
                      if (ok) {
                        if (assignee === m) {
                          setAssignee(members.find((x) => x !== m) ?? "Yo");
                        }
                        toast(`"${m}" eliminado`);
                      } else {
                        toast("No se pudo eliminar", "error");
                      }
                    });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-red-500"
                  aria-label={`Eliminar ${m}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addMember(newMember);
            setNewMember("");
          }}
        >
          <input
            type="text"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="Agregar persona…"
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            aria-label="Agregar"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </section>
    </div>
  );
}
