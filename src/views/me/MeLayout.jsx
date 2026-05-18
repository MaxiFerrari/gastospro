import { Suspense, lazy } from "react";
import { useAuth } from "@hooks/useAuth";
import { useAppRoute } from "@hooks/useAppRoute";
import PageSkeleton from "@components/app/PageSkeleton";

const MeView = lazy(() => import("./MeView"));
const MePrivacidadView = lazy(() => import("./MePrivacidadView"));
const MeCuentaView = lazy(() => import("./MeCuentaView"));

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
      ) : (
        <MeView userId={userId} userEmail={userEmail} />
      )}
    </Suspense>
  );
}
