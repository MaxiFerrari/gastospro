import PrivacyPanel from "./components/PrivacyPanel";
import HubSubpageHeader from "@views/shared/HubSubpageHeader";
import { ME_HUB_PATH } from "@lib/routes";

/**
 * @param {{ userId: string; userEmail?: string | null; onSignOut?: () => void }} props
 */
export default function MePrivacidadView({ userId, userEmail, onSignOut }) {
  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-3xl lg:mx-auto">
      <HubSubpageHeader
        title="Privacidad"
        subtitle="Datos, respaldo y baja de cuenta"
        backTo={ME_HUB_PATH}
        backLabel="Inicio"
      />
      <PrivacyPanel
        userId={userId}
        userEmail={userEmail}
        onAccountDeleted={onSignOut}
      />
    </div>
  );
}
