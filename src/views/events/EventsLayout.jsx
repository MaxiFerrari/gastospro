import { Suspense, lazy } from "react";
import { useAuth } from "@hooks/useAuth";
import { useAppRoute } from "@hooks/useAppRoute";
import PageSkeleton from "@components/app/PageSkeleton";

const EventsHub = lazy(() => import("./EventsHub"));
const EventsBirthdayCalendar = lazy(() => import("./EventsBirthdayCalendar"));

export default function EventsLayout() {
  const { session } = useAuth();
  const { eventsSubPage } = useAppRoute();
  const userId = session?.user?.id ?? null;

  const label =
    eventsSubPage === "calendario" ? "Calendario" : "Celebraciones";

  return (
    <Suspense fallback={<PageSkeleton label={label} />}>
      {eventsSubPage === "calendario" ? (
        <EventsBirthdayCalendar userId={userId} />
      ) : (
        <EventsHub userId={userId} />
      )}
    </Suspense>
  );
}
