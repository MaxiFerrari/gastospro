import { Navigate } from "react-router-dom";
import {
  buildPath,
  currentMonthPath,
  defaultPath,
  NEW_TRANSACTION_PATH,
} from "@lib/routes";
import { DEFAULT_SHOPPING_CONTEXT } from "@lib/shoppingContexts";
import AppShell from "@layouts/AppShell";
import { financeRoutes } from "@routing/finance.routes";
import { shoppingRoutes } from "@routing/shopping.routes";
import { eventsRoutes } from "@routing/events.routes";
import { homeRoutes } from "@routing/home.routes";
import { meRoutes } from "@routing/me.routes";

function NewTransactionRedirect() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("gastospro:openNewTx", "1");
  }
  return (
    <Navigate
      to={currentMonthPath()}
      replace
      state={{ openNewTransaction: true }}
    />
  );
}

/** @type {import('react-router-dom').RouteObject[]} */
export const appRoutes = [
  { index: true, element: <Navigate to={defaultPath()} replace /> },
  {
    path: NEW_TRANSACTION_PATH.slice(1),
    element: <NewTransactionRedirect />,
  },
  {
    path: "lista-super",
    element: (
      <Navigate
        to={buildPath({
          mode: "shopping",
          shoppingContext: DEFAULT_SHOPPING_CONTEXT,
          supermarketMode: true,
        })}
        replace
      />
    ),
  },
  {
    element: <AppShell />,
    children: [
      financeRoutes,
      shoppingRoutes,
      eventsRoutes,
      homeRoutes,
      meRoutes,
    ],
  },
  { path: "*", element: <Navigate to={defaultPath()} replace /> },
];
