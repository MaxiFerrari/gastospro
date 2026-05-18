import { useState } from "react";
import { Dog, Plus, Trash2, Syringe, Stethoscope, Utensils } from "lucide-react";
import { usePets } from "@views/home/hooks/usePets";
import { toast } from "@lib/toast";
import SelectField from "@components/ui/SelectField";
import TextField from "@components/ui/TextField";

const SPECIES = [
  { value: "dog", label: "Perro" },
  { value: "cat", label: "Gato" },
  { value: "other", label: "Otro" },
];

const CARE_TYPES = [
  { value: "vaccine", label: "Vacuna", Icon: Syringe },
  { value: "vet", label: "Veterinario", Icon: Stethoscope },
  { value: "food", label: "Comida", Icon: Utensils },
  { value: "other", label: "Otro", Icon: Dog },
];

/**
 * @param {{ userId: string; embedded?: boolean }} props
 */
export default function PetsPanel({ userId, embedded = false }) {
  const {
    pets,
    upcomingCare,
    loading,
    error,
    addPet,
    deletePet,
    addCare,
    deleteCare,
  } = usePets(userId);

  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [careType, setCareType] = useState("vaccine");
  const [careTitle, setCareTitle] = useState("");
  const [nextDate, setNextDate] = useState("");

  async function handleAddPet(e) {
    e.preventDefault();
    if (!petName.trim()) return;
    const { error: err } = await addPet({ name: petName, species });
    if (err) toast(err, "error");
    else {
      toast("Mascota agregada");
      setPetName("");
    }
  }

  async function handleAddCare(e) {
    e.preventDefault();
    if (!selectedPetId || !careTitle.trim()) return;
    const { error: err } = await addCare({
      pet_id: selectedPetId,
      care_type: careType,
      title: careTitle,
      next_date: nextDate || null,
    });
    if (err) toast(err, "error");
    else {
      toast("Recordatorio guardado");
      setCareTitle("");
      setNextDate("");
    }
  }

  if (loading) {
    return (
      <section className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm sm:mx-0">
        <motionSkeletonBlock />
      </section>
    );
  }

  if (error === "migration") {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Para mascotas ejecutá{" "}
          <code className="text-xs">supabase/migrations/006_privacy_and_pets.sql</code>{" "}
          en el SQL Editor de Supabase.
        </p>
      </section>
    );
  }

  return (
    <section className="app-hub-inset bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm sm:mx-0">
      {!embedded && <PetsPanelHeader />}

      {upcomingCare.length > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-3">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Próximos recordatorios
          </p>
          <ul className="space-y-1.5">
            {upcomingCare.slice(0, 5).map((c) => {
              const pet = pets.find((p) => p.id === c.pet_id);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-sm text-amber-900 dark:text-amber-100"
                >
                  <span className="min-w-0 truncate">
                    {pet?.name}: {c.title}
                    {c.next_date && (
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        {" "}
                        · {c.next_date}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteCare(c.id)}
                    className="p-1 text-amber-600 hover:text-amber-800"
                    aria-label="Quitar recordatorio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pets.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {pets.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-700/60 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {p.name}
                <span className="text-xs text-slate-400 ml-2">
                  {SPECIES.find((s) => s.value === p.species)?.label ?? "Otro"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => deletePet(p.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600"
                aria-label={`Eliminar ${p.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Agregá una mascota para vacunas, comida y gastos del veterinario.
        </p>
      )}

      <form onSubmit={handleAddPet} className="flex flex-col sm:flex-row gap-2 mb-5">
        <TextField
          label="Nueva mascota"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Nombre"
          className="flex-1"
        />
        <SelectField
          label="Especie"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          {SPECIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </SelectField>
        <button
          type="submit"
          className="self-end sm:mb-0 mb-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>

      {pets.length > 0 && (
        <form onSubmit={handleAddCare} className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Recordatorio o cuidado
          </p>
          <SelectField
            label="Mascota"
            value={selectedPetId || pets[0]?.id || ""}
            onChange={(e) => setSelectedPetId(e.target.value)}
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Tipo"
              value={careType}
              onChange={(e) => setCareType(e.target.value)}
            >
              {CARE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Próxima fecha"
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </div>
          <TextField
            label="Descripción"
            value={careTitle}
            onChange={(e) => setCareTitle(e.target.value)}
            placeholder="Ej. Antirrábica, control anual, bolsa de alimento"
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            Guardar recordatorio
          </button>
        </form>
      )}
    </section>
  );
}

function PetsPanelHeader() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950">
        <Dog className="w-5 h-5 text-orange-600 dark:text-orange-400" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mascotas</h2>
        <p className="text-xs text-slate-400">Vacunas, comida y veterinario</p>
      </div>
    </div>
  );
}

function motionSkeletonBlock() {
  return <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />;
}
