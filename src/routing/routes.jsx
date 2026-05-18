import { Navigate } from "react-router-dom";
import {
  buildPath,
  currentMonthPath,
  defaultPath,
  NEW_TRANSACTION_PATH,
} from "../lib/routes";
import { DEFAULT_SHOPPING_CONTEXT } from "../lib/shoppingContexts";
import AppShell from "../layouts/AppShell";

/** Matched leaf routes — layout content is rendered by AppShell from route handle. */
function RouteOutlet() {
  return null;
}

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
      {
        path: "mensual/:year/:month",
        element: <RouteOutlet />,
        handle: { mode: "finance", page: "monthly" },
      },
      {
        path: "empleada/:year/:month",
        element: <RouteOutlet />,
        handle: { mode: "finance", page: "housekeeper" },
      },
      {
        path: "anual",
        element: <RouteOutlet />,
        handle: { mode: "finance", page: "annual" },
      },
      {
        path: "suscripciones",
        element: <RouteOutlet />,
        handle: { mode: "finance", page: "subs" },
      },
      {
        path: "compras",
        children: [
          {
            path: ":context/modo",
            element: <RouteOutlet />,
            handle: { mode: "shopping", supermarketMode: true },
          },
          {
            path: "modo",
            element: <RouteOutlet />,
            handle: { mode: "shopping", supermarketMode: true },
          },
          {
            path: ":context",
            element: <RouteOutlet />,
            handle: { mode: "shopping" },
          },
          {
            index: true,
            element: <RouteOutlet />,
            handle: { mode: "shopping" },
          },
        ],
      },
      {
        path: "eventos",
        children: [
          {
            index: true,
            element: <RouteOutlet />,
            handle: { mode: "events", eventsSubPage: "hub" },
          },
          {
            path: "calendario",
            element: <RouteOutlet />,
            handle: { mode: "events", eventsSubPage: "calendario" },
          },
        ],
      },
      {
        path: "hogar",
        children: [
          {
            index: true,
            element: <RouteOutlet />,
            handle: { mode: "home", homeSubPage: "hub" },
          },
          {
            path: "mascotas",
            element: <RouteOutlet />,
            handle: { mode: "home", homeSubPage: "mascotas" },
          },
        ],
      },
      {
        path: "yo",
        children: [
          {
            index: true,
            element: <RouteOutlet />,
            handle: { mode: "me", meSubPage: "hub" },
          },
          {
            path: "privacidad",
            element: <RouteOutlet />,
            handle: { mode: "me", meSubPage: "privacidad" },
          },
          {
            path: "cuenta",
            element: <RouteOutlet />,
            handle: { mode: "me", meSubPage: "cuenta" },
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to={defaultPath()} replace /> },
];
