import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");

const hookMoves = {
  "hooks/useTransactions.js": "views/finance/hooks/useTransactions.js",
  "hooks/useMonthFilter.js": "views/finance/hooks/useMonthFilter.js",
  "hooks/useMonthlyFinance.js": "views/finance/hooks/useMonthlyFinance.js",
  "hooks/useFixedItems.js": "views/finance/hooks/useFixedItems.js",
  "hooks/useCategories.js": "views/finance/hooks/useCategories.js",
  "hooks/useBudgets.js": "views/finance/hooks/useBudgets.js",
  "hooks/useSubscriptions.js": "views/finance/hooks/useSubscriptions.js",
  "hooks/useHousekeeper.js": "views/finance/hooks/useHousekeeper.js",
  "hooks/useShoppingList.js": "views/shopping/hooks/useShoppingList.js",
  "hooks/useShoppingItemContexts.js": "views/shopping/hooks/useShoppingItemContexts.js",
  "hooks/useEvents.js": "views/shared/hooks/useEvents.js",
  "hooks/useEventGuests.js": "views/events/hooks/useEventGuests.js",
  "hooks/useEventExpenses.js": "views/events/hooks/useEventExpenses.js",
  "hooks/useHomeData.js": "views/home/hooks/useHomeData.js",
  "hooks/usePets.js": "views/home/hooks/usePets.js",
  "hooks/useDolarRates.js": "views/me/hooks/useDolarRates.js",
  "hooks/useWeather.js": "views/me/hooks/useWeather.js",
  "hooks/useGoogleCalendar.js": "views/shared/hooks/useGoogleCalendar.js",
  "hooks/useInventory.js": "views/shared/hooks/useInventory.js",
};

const appComponents = [
  "AppHeader.jsx",
  "HubNav.jsx",
  "PageSkeleton.jsx",
  "TransactionDrawer.jsx",
  "InstallPrompt.jsx",
  "Toaster.jsx",
  "LoginScreen.jsx",
  "TransactionForm.jsx",
];

const duplicateComponents = [
  "EventsHub.jsx",
  "ShoppingHubPage.jsx",
  "ShoppingContextBar.jsx",
  "GoogleCalendarPanel.jsx",
  "AppFunSettings.jsx",
  "WeatherCard.jsx",
  "MedalsPanel.jsx",
  "SupermarketMode.jsx",
  "TransactionList.jsx",
  "PrivacyPanel.jsx",
  "PlanningCalendarCard.jsx",
  "ExpenseChart.jsx",
  "HousekeeperPage.jsx",
  "HomePage.jsx",
  "WhatToDoNowCard.jsx",
  "AnnualView.jsx",
  "PetsPanel.jsx",
  "BudgetPanel.jsx",
  "DataBackupPanel.jsx",
  "FixedItemsPanel.jsx",
  "MePage.jsx",
  "MonthComparisonPanel.jsx",
  "MonthPicker.jsx",
  "ShoppingListPage.jsx",
  "DolarRatesCard.jsx",
  "ChartSkeleton.jsx",
  "SummaryPanel.jsx",
  "KeyboardHints.jsx",
  "InventoryPanel.jsx",
  "ReceiptScanPanel.jsx",
  "FinanceShell.jsx",
  "SubscriptionsPage.jsx",
  "HomeCommandCenter.jsx",
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function moveFile(from, to) {
  const absFrom = path.join(src, from);
  const absTo = path.join(src, to);
  if (!fs.existsSync(absFrom)) return;
  ensureDir(path.dirname(absTo));
  if (fs.existsSync(absTo)) fs.unlinkSync(absTo);
  fs.renameSync(absFrom, absTo);
}

// Move hooks
for (const [from, to] of Object.entries(hookMoves)) {
  moveFile(from, to);
}

// Move app shell components
ensureDir(path.join(src, "components/app"));
for (const file of appComponents) {
  moveFile(`components/${file}`, `components/app/${file}`);
}

// CategoryIconBadge -> shared
moveFile("components/CategoryIconBadge.jsx", "views/shared/CategoryIconBadge.jsx");

// BarcodeAddPanel -> shopping (if still in components)
moveFile("components/BarcodeAddPanel.jsx", "views/shopping/components/BarcodeAddPanel.jsx");

// Delete duplicate hub files from components/
for (const file of duplicateComponents) {
  const p = path.join(src, "components", file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// Rename *Page -> *View in views
const renames = [
  ["views/finance/components/HousekeeperPage.jsx", "views/finance/components/HousekeeperView.jsx"],
  ["views/finance/components/SubscriptionsPage.jsx", "views/finance/components/SubscriptionsView.jsx"],
  ["views/shopping/ShoppingHubPage.jsx", "views/shopping/ShoppingHubView.jsx"],
  ["views/home/HomePage.jsx", "views/home/HomeView.jsx"],
  ["views/home/PetsPage.jsx", "views/home/PetsView.jsx"],
  ["views/me/MePage.jsx", "views/me/MeView.jsx"],
  ["views/me/MePrivacidadPage.jsx", "views/me/MePrivacidadView.jsx"],
  ["views/me/MeCuentaPage.jsx", "views/me/MeCuentaView.jsx"],
];
for (const [from, to] of renames) {
  moveFile(from, to);
}

console.log("File moves complete.");
