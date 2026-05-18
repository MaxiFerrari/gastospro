import { createContext, useContext } from "react";

/** @typedef {import('@lib/routes').FinancePageId} FinancePageId */

/**
 * Hub layouts register header chrome (loading, primary action, overlays).
 * @typedef {object} AppChromeState
 * @property {boolean} [loading]
 * @property {FinancePageId} [page]
 * @property {boolean} [formOpen]
 * @property {() => void} [openForm]
 * @property {() => void} [closeForm]
 * @property {boolean} [monthNavEnabled]
 * @property {() => void} [goToPrev]
 * @property {() => void} [goToNext]
 */

export const AppChromeContext = createContext(
  /** @type {((state: AppChromeState | null) => void) | null} */ (null),
);

export function useAppChromeSetter() {
  return useContext(AppChromeContext);
}
