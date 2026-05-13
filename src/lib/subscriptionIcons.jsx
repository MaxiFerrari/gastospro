import {
  CreditCard,
  Play,
  Music2,
  Monitor,
  Gamepad2,
  BookOpen,
  Heart,
  Cloud,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tv2,
  Newspaper,
  Car,
  Dumbbell,
  Utensils,
  Plane,
  Wifi,
  Palette,
  MoreHorizontal,
} from "lucide-react";

export const ICON_OPTIONS = [
  {
    key: "card",
    Icon: CreditCard,
    label: "Finanzas",
    color:
      "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
  },
  {
    key: "play",
    Icon: Play,
    label: "Streaming",
    color: "bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400",
  },
  {
    key: "music",
    Icon: Music2,
    label: "Música",
    color: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400",
  },
  {
    key: "monitor",
    Icon: Monitor,
    label: "Software",
    color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  },
  {
    key: "gamepad",
    Icon: Gamepad2,
    label: "Gaming",
    color:
      "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
  },
  {
    key: "book",
    Icon: BookOpen,
    label: "Lectura",
    color:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
  },
  {
    key: "heart",
    Icon: Heart,
    label: "Salud",
    color: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
  },
  {
    key: "cloud",
    Icon: Cloud,
    label: "Cloud",
    color: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",
  },
  {
    key: "shield",
    Icon: ShieldCheck,
    label: "Seguridad",
    color:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "shopping",
    Icon: ShoppingBag,
    label: "Compras",
    color:
      "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
  },
  {
    key: "phone",
    Icon: Smartphone,
    label: "Celular",
    color: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
  },
  {
    key: "tv",
    Icon: Tv2,
    label: "TV",
    color:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
  },
  {
    key: "news",
    Icon: Newspaper,
    label: "Noticias",
    color:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",
  },
  {
    key: "car",
    Icon: Car,
    label: "Auto",
    color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
  {
    key: "dumbbell",
    Icon: Dumbbell,
    label: "Fitness",
    color:
      "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
  },
  {
    key: "utensils",
    Icon: Utensils,
    label: "Comida",
    color: "bg-lime-100 dark:bg-lime-900/40 text-lime-600 dark:text-lime-400",
  },
  {
    key: "plane",
    Icon: Plane,
    label: "Viajes",
    color: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "wifi",
    Icon: Wifi,
    label: "Internet",
    color: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
  },
  {
    key: "palette",
    Icon: Palette,
    label: "Arte",
    color:
      "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    key: "more",
    Icon: MoreHorizontal,
    label: "Otro",
    color: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  },
];

export function getIconOption(key) {
  return ICON_OPTIONS.find((o) => o.key === key) ?? ICON_OPTIONS[0];
}

export function SubIcon({ iconKey, size = "md" }) {
  const { Icon, color } = getIconOption(iconKey);
  const containerCls =
    size === "sm" ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl";
  const iconCls = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div
      className={`${containerCls} flex items-center justify-center shrink-0 ${color}`}
    >
      <Icon className={iconCls} strokeWidth={2} />
    </div>
  );
}
