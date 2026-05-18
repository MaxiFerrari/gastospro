import { Suspense, lazy } from "react";
import { useAuth } from "@hooks/useAuth";
import { useAppRoute } from "@hooks/useAppRoute";
import PageSkeleton from "@components/app/PageSkeleton";

const HomeView = lazy(() => import("./HomeView"));
const PetsView = lazy(() => import("./PetsView"));

export default function HomeLayout() {
  const { session } = useAuth();
  const { homeSubPage } = useAppRoute();
  const userId = session?.user?.id ?? null;

  return (
    <Suspense fallback={<PageSkeleton label="Hogar" />}>
      {homeSubPage === "mascotas" ? (
        <PetsView userId={userId} />
      ) : (
        <HomeView userId={userId} />
      )}
    </Suspense>
  );
}
