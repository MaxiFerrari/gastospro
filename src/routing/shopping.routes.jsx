import ShoppingLayout from "@views/shopping/ShoppingLayout";
import RouteOutlet from "@routing/routeOutlet";

/** @type {import('react-router-dom').RouteObject} */
export const shoppingRoutes = {
  path: "compras",
  element: <ShoppingLayout />,
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
};
