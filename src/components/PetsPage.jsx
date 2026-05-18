import PetsPanel from "./PetsPanel";
import HubSubpageHeader from "./HubSubpageHeader";
import { HOME_HUB_PATH } from "../lib/routes";

/**
 * @param {{ userId: string }} props
 */
export default function PetsPage({ userId }) {
  return (
    <div className="mx-auto w-full lg:max-w-none">
      <HubSubpageHeader
        title="Mascotas"
        subtitle="Vacunas, comida y recordatorios del veterinario"
        backTo={HOME_HUB_PATH}
        backLabel="Hogar"
      />
      <PetsPanel userId={userId} embedded />
    </div>
  );
}
