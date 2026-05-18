/**
 * Modales a pantalla completa en móvil; tarjeta centrada desde `sm`.
 * @param {string} [z] Tailwind z-index class
 */
export function modalOverlay(z = "z-50") {
  return `fixed inset-0 ${z} flex flex-col sm:items-center sm:justify-center sm:p-3`;
}

/** Capa oscura solo en desktop (en móvil el panel ocupa toda la pantalla). */
export function modalBackdrop(opacity = "bg-black/50") {
  return `absolute inset-0 hidden sm:block ${opacity} backdrop-blur-sm`;
}

/**
 * @param {string} [extra]
 */
export function modalPanel(extra = "") {
  return [
    "relative z-10 flex min-h-0 flex-1 w-full flex-col overflow-y-auto",
    "bg-white dark:bg-slate-800",
    "px-4 pt-[max(0.75rem,env(safe-area-inset-top))]",
    "pb-[max(1rem,env(safe-area-inset-bottom))]",
    "sm:flex-none sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl sm:shadow-2xl",
    "sm:p-5 sm:pt-5",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Drawer / sheet de movimientos: full viewport en móvil. */
export function drawerPanel(extra = "") {
  return [
    "relative z-10 flex h-[100dvh] max-h-[100dvh] w-full flex-col",
    "bg-white dark:bg-slate-800 rounded-none shadow-none",
    "sm:h-auto sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl sm:shadow-2xl",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
