import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const replacements = [
  // Global hooks (stay in src/hooks)
  [/from ["']\.\.\/hooks\/useAuth["']/g, 'from "@hooks/useAuth"'],
  [/from ["']\.\.\/\.\.\/hooks\/useAuth["']/g, 'from "@hooks/useAuth"'],
  [/from ["']\.\.\/\.\.\/\.\.\/hooks\/useAuth["']/g, 'from "@hooks/useAuth"'],
  [/from ["']\.\/hooks\/useAuth["']/g, 'from "@hooks/useAuth"'],

  [/from ["']\.\.\/hooks\/useAppRoute["']/g, 'from "@hooks/useAppRoute"'],
  [/from ["']\.\.\/\.\.\/hooks\/useAppRoute["']/g, 'from "@hooks/useAppRoute"'],
  [/from ["']\.\.\/\.\.\/\.\.\/hooks\/useAppRoute["']/g, 'from "@hooks/useAppRoute"'],

  [/from ["']\.\.\/hooks\/useUserPreferences["']/g, 'from "@hooks/useUserPreferences"'],
  [/from ["']\.\.\/\.\.\/hooks\/useUserPreferences["']/g, 'from "@hooks/useUserPreferences"'],

  [/from ["']\.\.\/hooks\/useAppKeyboardShortcuts["']/g, 'from "@hooks/useAppKeyboardShortcuts"'],
  [/from ["']\.\.\/\.\.\/hooks\/useAppKeyboardShortcuts["']/g, 'from "@hooks/useAppKeyboardShortcuts"'],

  [/from ["']\.\.\/hooks\/useBackdropDismiss["']/g, 'from "@hooks/useBackdropDismiss"'],
  [/from ["']\.\.\/\.\.\/hooks\/useBackdropDismiss["']/g, 'from "@hooks/useBackdropDismiss"'],
  [/from ["']\.\.\/\.\.\/\.\.\/hooks\/useBackdropDismiss["']/g, 'from "@hooks/useBackdropDismiss"'],

  [/from ["']\.\.\/hooks\/useOutsideClick["']/g, 'from "@hooks/useOutsideClick"'],
  [/from ["']\.\.\/\.\.\/\.\.\/hooks\/useOutsideClick["']/g, 'from "@hooks/useOutsideClick"'],

  // Finance hooks
  [/from ["'][./]+hooks\/useTransactions["']/g, 'from "@views/finance/hooks/useTransactions"'],
  [/from ["'][./]+hooks\/useMonthFilter["']/g, 'from "@views/finance/hooks/useMonthFilter"'],
  [/from ["'][./]+hooks\/useMonthlyFinance["']/g, 'from "@views/finance/hooks/useMonthlyFinance"'],
  [/from ["'][./]+hooks\/useFixedItems["']/g, 'from "@views/finance/hooks/useFixedItems"'],
  [/from ["'][./]+hooks\/useCategories["']/g, 'from "@views/finance/hooks/useCategories"'],
  [/from ["'][./]+hooks\/useBudgets["']/g, 'from "@views/finance/hooks/useBudgets"'],
  [/from ["'][./]+hooks\/useSubscriptions["']/g, 'from "@views/finance/hooks/useSubscriptions"'],
  [/from ["'][./]+hooks\/useHousekeeper["']/g, 'from "@views/finance/hooks/useHousekeeper"'],

  // Shopping hooks
  [/from ["'][./]+hooks\/useShoppingList["']/g, 'from "@views/shopping/hooks/useShoppingList"'],
  [/from ["'][./]+hooks\/useShoppingItemContexts["']/g, 'from "@views/shopping/hooks/useShoppingItemContexts"'],

  // Events hooks
  [/from ["'][./]+hooks\/useEventGuests["']/g, 'from "@views/events/hooks/useEventGuests"'],
  [/from ["'][./]+hooks\/useEventExpenses["']/g, 'from "@views/events/hooks/useEventExpenses"'],

  // Home hooks
  [/from ["'][./]+hooks\/useHomeData["']/g, 'from "@views/home/hooks/useHomeData"'],
  [/from ["'][./]+hooks\/usePets["']/g, 'from "@views/home/hooks/usePets"'],

  // Me hooks
  [/from ["'][./]+hooks\/useDolarRates["']/g, 'from "@views/me/hooks/useDolarRates"'],
  [/from ["'][./]+hooks\/useWeather["']/g, 'from "@views/me/hooks/useWeather"'],

  // Shared hooks
  [/from ["'][./]+hooks\/useEvents["']/g, 'from "@views/shared/hooks/useEvents"'],
  [/from ["'][./]+hooks\/useGoogleCalendar["']/g, 'from "@views/shared/hooks/useGoogleCalendar"'],
  [/from ["'][./]+hooks\/useInventory["']/g, 'from "@views/shared/hooks/useInventory"'],

  // App components
  [/from ["'][./]+components\/AppHeader["']/g, 'from "@components/app/AppHeader"'],
  [/from ["'][./]+components\/HubNav["']/g, 'from "@components/app/HubNav"'],
  [/from ["'][./]+components\/PageSkeleton["']/g, 'from "@components/app/PageSkeleton"'],
  [/from ["'][./]+components\/TransactionDrawer["']/g, 'from "@components/app/TransactionDrawer"'],
  [/from ["'][./]+components\/InstallPrompt["']/g, 'from "@components/app/InstallPrompt"'],
  [/from ["'][./]+components\/Toaster["']/g, 'from "@components/app/Toaster"'],
  [/from ["'][./]+components\/LoginScreen["']/g, 'from "@components/app/LoginScreen"'],
  [/from ["'][./]+components\/TransactionForm["']/g, 'from "@components/app/TransactionForm"'],

  // UI components
  [/from ["'][./]+components\/ui\//g, 'from "@components/ui/'],

  // Shared view components
  [/from ["'][./]+shared\/HubSubpageHeader["']/g, 'from "@views/shared/HubSubpageHeader"'],
  [/from ["'][./]+shared\/GoogleCalendarPanel["']/g, 'from "@views/shared/GoogleCalendarPanel"'],
  [/from ["'][./]+shared\/InventoryPanel["']/g, 'from "@views/shared/InventoryPanel"'],
  [/from ["'][./]+components\/CategoryIconBadge["']/g, 'from "@views/shared/CategoryIconBadge"'],
  [/from ["'][./]+components\/BarcodeAddPanel["']/g, 'from "@views/shopping/components/BarcodeAddPanel"'],

  // Chrome context
  [/from ["']\.\/financeChromeContext["']/g, 'from "@views/shared/appChromeContext"'],
  [/from ["']@views\/finance\/financeChromeContext["']/g, 'from "@views/shared/appChromeContext"'],
  [/useFinanceChromeSetter/g, "useAppChromeSetter"],
  [/FinanceChromeContext/g, "AppChromeContext"],
  [/financeChrome/g, "appChrome"],

  // Views renamed Page -> View
  [/ShoppingHubPage/g, "ShoppingHubView"],
  [/from ["']\.\/HomePage["']/g, 'from "./HomeView"'],
  [/from ["']\.\/PetsPage["']/g, 'from "./PetsView"'],
  [/from ["']\.\/MePage["']/g, 'from "./MeView"'],
  [/from ["']\.\/MePrivacidadPage["']/g, 'from "./MePrivacidadView"'],
  [/from ["']\.\/MeCuentaPage["']/g, 'from "./MeCuentaView"'],
  [/HousekeeperPage/g, "HousekeeperView"],
  [/SubscriptionsPage/g, "SubscriptionsView"],

  // Lib
  [/from ["']\.\.\/lib\//g, 'from "@lib/'],
  [/from ["']\.\.\/\.\.\/lib\//g, 'from "@lib/'],
  [/from ["']\.\.\/\.\.\/\.\.\/lib\//g, 'from "@lib/'],
  [/from ["']\.\/lib\//g, 'from "@lib/'],

  // Layouts / routing
  [/from ["']\.\.\/layouts\//g, 'from "@layouts/'],
  [/from ["']\.\.\/views\//g, 'from "@views/'],
  [/from ["']\.\.\/routing\//g, 'from "@routing/'],
];

function walk(dir, fn) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, fn);
    else if (/\.(jsx?)$/.test(ent.name)) fn(p);
  }
}

walk(src, (file) => {
  let text = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [re, rep] of replacements) {
    const next = text.replace(re, rep);
    if (next !== text) {
      text = next;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, text);
});

// Fix hook files: any remaining ../lib
walk(path.join(src, "views"), (file) => {
  if (!file.includes(`${path.sep}hooks${path.sep}`)) return;
  let text = fs.readFileSync(file, "utf8");
  const next = text.replace(/from ["']\.\.\/\.\.\/lib\//g, 'from "@lib/');
  if (next !== text) fs.writeFileSync(file, next);
});

console.log("Import fixes applied.");
