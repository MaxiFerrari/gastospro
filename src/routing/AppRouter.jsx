import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { appRoutes } from "./routes.jsx";

const router = createBrowserRouter(appRoutes);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
