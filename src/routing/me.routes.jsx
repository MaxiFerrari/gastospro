import MeLayout from "@views/me/MeLayout";
import RouteOutlet from "@routing/routeOutlet";

/** @type {import('react-router-dom').RouteObject} */
export const meRoutes = {
  path: "yo",
  element: <MeLayout />,
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
};
