import FinanceLayout from "@views/finance/FinanceLayout";
import RouteOutlet from "@routing/routeOutlet";

/** @type {import('react-router-dom').RouteObject} */
export const financeRoutes = {
  element: <FinanceLayout />,
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
  ],
};
