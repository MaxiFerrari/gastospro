import EventsLayout from "@views/events/EventsLayout";
import RouteOutlet from "@routing/routeOutlet";

/** @type {import('react-router-dom').RouteObject} */
export const eventsRoutes = {
  path: "eventos",
  element: <EventsLayout />,
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
};
