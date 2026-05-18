/**
 * Modales a pantalla completa en móvil; tarjeta centrada desde `sm`.
 * @param {string} [z] Tailwind z-index class
 */
export function modalOverlay(z = "z-50") {
  return [
    `fixed inset-0 ${z}`,
    "flex h-[100dvh] w-screen max-w-[100vw] flex-col overflow-hidden",
    "sm:h-auto sm:w-auto sm:max-h-none sm:max-w-none sm:overflow-visible",
    "sm:items-center sm:justify-center sm:p-3",
  ].join(" ");
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
    "relative z-10 flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain",
    "bg-white dark:bg-slate-800 rounded-none shadow-none",
    "px-4 pt-[max(0.75rem,env(safe-area-inset-top))]",
    "pb-[max(1rem,env(safe-area-inset-bottom))]",
    "sm:h-auto sm:flex-none sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl sm:shadow-2xl",
    "sm:p-5 sm:pt-5",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Drawer / sheet de movimientos: full viewport en móvil. */
export function drawerPanel(extra = "") {
  return [
    "relative z-10 flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-y-auto overscroll-contain",
    "bg-white dark:bg-slate-800 rounded-none shadow-none",
    "pt-[max(0.75rem,env(safe-area-inset-top))]",
    "pb-[max(1rem,env(safe-area-inset-bottom))]",
    "sm:h-auto sm:flex-none sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl sm:shadow-2xl sm:p-5 sm:pt-5",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
