import { Suspense, lazy } from "react";
import { useAuth } from "@hooks/useAuth";
import { useAppRoute } from "@hooks/useAppRoute";
import PageSkeleton from "@components/app/PageSkeleton";

const MeView = lazy(() => import("./MeView"));
const MePrivacidadView = lazy(() => import("./MePrivacidadView"));
const MeCuentaView = lazy(() => import("./MeCuentaView"));
const MapView = lazy(() => import("./MapView"));

export default function MeLayout() {
  const { session, signOut } = useAuth();
  const { meSubPage } = useAppRoute();
  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email;

  return (
    <Suspense fallback={<PageSkeleton label="Inicio" />}>
      {meSubPage === "privacidad" ? (
        <MePrivacidadView
          userId={userId}
          userEmail={userEmail}
          onSignOut={signOut}
        />
      ) : meSubPage === "cuenta" ? (
        <MeCuentaView userId={userId} userEmail={userEmail} />
      ) : meSubPage === "mapa" ? (
        <MapView userId={userId} />
      ) : (
        <MeView userId={userId} userEmail={userEmail} />
      )}
    </Suspense>
  );
}
