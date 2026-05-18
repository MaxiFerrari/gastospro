import { useState } from "react";
import { ArrowLeft, Check, Barcode, Pencil } from "lucide-react";
import { getShoppingContext } from "@lib/shoppingContexts";
import BarcodeAddPanel from "@views/shopping/components/BarcodeAddPanel";
import { parseAmount, formatCurrency } from "@lib/amount";
import {
  getUnitPriceDisplay,
  formatLineTotal,
} from "@lib/productUnits";
import { toast } from "@lib/toast";

export default function SupermarketMode({
  contextId,
  items,
  onToggle,
  onExit,
  onAddFromBarcode,
  onUpdatePrice,
  getCatalogProduct,
}) {
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [priceEditId, setPriceEditId] = useState(null);
  const [priceEditValue, setPriceEditValue] = useState("");
  const ctx = getShoppingContext(contextId);
  const pending = items.filter((i) => !i.completed);

  async function savePrice(item) {
    const parsed = parseAmount(priceEditValue);
    if (parsed == null) {
      toast("Precio inválido", "error");
      return;
    }
    const result = await onUpdatePrice?.(item.id, parsed, item);
    if (!result?.error) {
      setPriceEditId(null);
      setPriceEditValue("");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 pb-[env(safe-area-inset-bottom)] dark:bg-slate-900">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Salir del modo supermercado"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Modo supermercado
          </p>
          <h2 className="truncate text-lg font-bold text-slate-800 dark:text-slate-100">
            {ctx.emoji} {ctx.label}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onAddFromBarcode && (
            <button
              type="button"
              onClick={() => setBarcodeOpen(true)}
              className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              aria-label="Escanear código de barras"
            >
              <Barcode className="h-5 w-5" />
            </button>
          )}
          <span className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {pending.length}
          </span>
        </div>
      </header>

      {barcodeOpen && onAddFromBarcode && (
        <BarcodeAddPanel
          title="Escanear y agregar"
          getCatalogProduct={getCatalogProduct}
          onConfirm={onAddFromBarcode}
          onClose={() => setBarcodeOpen(false)}
        />
      )}

      <ul className="flex-1 space-y-2 overflow-y-auto px-3 py-3 pb-24">
        {pending.length === 0 ? (
          <li className="py-16 text-center text-sm text-slate-400">
            ¡Lista completa para este contexto!
          </li>
        ) : (
          pending.map((item) => {
            const unitPrice = getUnitPriceDisplay(item);
            const lineTotal = formatLineTotal(item);
            const editing = priceEditId === item.id;

            return (
              <li
                key={item.id}
                className="flex items-stretch gap-2 rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <button
                  type="button"
                  onClick={() => onToggle(item.id, item.completed)}
                  className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left active:bg-emerald-50 dark:active:bg-emerald-950/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-500">
                    <Check
                      className="h-5 w-5 text-transparent"
                      strokeWidth={3}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-400">
                      {item.quantity > 1 ? `×${item.quantity} ` : ""}
                      {item.brand || ""}
                      {item.size && item.unit !== "u"
                        ? ` · ${item.size} ${item.unit}`
                        : ""}
                    </span>
                    {unitPrice && !editing && (
                      <span className="mt-1 block text-sm font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {unitPrice.line}
                        {lineTotal && Number(item.quantity) > 1 && (
                          <span className="ml-2 text-slate-400 font-normal">
                            · {lineTotal} total
                          </span>
                        )}
                      </span>
                    )}
                    {!unitPrice && !editing && (
                      <span className="mt-1 block text-xs text-slate-400">
                        Sin precio
                      </span>
                    )}
                  </span>
                </button>

                <div className="flex shrink-0 flex-col justify-center border-l border-slate-100 pr-2 dark:border-slate-700">
                  {editing ? (
                    <div className="flex flex-col gap-1 py-2 pl-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoFocus
                        value={priceEditValue}
                        onChange={(e) => setPriceEditValue(e.target.value)}
                        placeholder="Precio"
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            savePrice(item);
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => savePrice(item)}
                          className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPriceEditId(null);
                            setPriceEditValue("");
                          }}
                          className="rounded-md px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPriceEditId(item.id);
                        setPriceEditValue(
                          item.price != null ? String(item.price) : "",
                        );
                      }}
                      className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-3 text-emerald-700 hover:bg-slate-50 dark:text-emerald-400 dark:hover:bg-slate-700/50"
                      aria-label="Editar precio"
                    >
                      {unitPrice ? (
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(
                            parseAmount(String(item.price)) ?? 0,
                            0,
                          )}
                        </span>
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                      <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                        {unitPrice?.basisLabel ?? "precio"}
                      </span>
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
