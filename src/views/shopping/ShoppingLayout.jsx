import { Suspense, lazy } from "react";
import { useAuth } from "@hooks/useAuth";
import PageSkeleton from "@components/app/PageSkeleton";

const ShoppingHubView = lazy(() => import("./ShoppingHubView"));

export default function ShoppingLayout() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  return (
    <Suspense fallback={<PageSkeleton label="Compras" />}>
      <ShoppingHubView userId={userId} />
    </Suspense>
  );
}
