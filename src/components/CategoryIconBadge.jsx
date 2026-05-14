import { HelpCircle } from "lucide-react";
import { CATEGORY_ICONS } from "../lib/categoryIcons";

const SIZES = {
  sm: { wrap: "p-1.5", icon: "w-3.5 h-3.5" },
  md: { wrap: "p-2", icon: "w-4 h-4" },
  lg: { wrap: "p-3", icon: "w-6 h-6" },
};

export default function CategoryIconBadge({ category, isIncome, size = "md" }) {
  const Icon = CATEGORY_ICONS[category] ?? HelpCircle;
  const { wrap, icon } = SIZES[size] ?? SIZES.md;
  return (
    <div
      className={`flex-shrink-0 rounded-xl ${wrap} ${
        isIncome
          ? "bg-emerald-50 dark:bg-emerald-950"
          : "bg-red-50 dark:bg-red-950"
      }`}
    >
      <Icon
        className={`${icon} ${isIncome ? "text-emerald-500" : "text-red-400"}`}
        strokeWidth={2}
      />
    </div>
  );
}
