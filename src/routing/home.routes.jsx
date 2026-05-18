import HomeLayout from "@views/home/HomeLayout";
import RouteOutlet from "@routing/routeOutlet";

/** @type {import('react-router-dom').RouteObject} */
export const homeRoutes = {
  path: "hogar",
  element: <HomeLayout />,
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
};
