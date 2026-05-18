import { createContext, useContext } from "react";
import { useUserPreferencesState } from "@hooks/useUserPreferences";

const UserPreferencesContext = createContext(null);

export function UserPreferencesProvider({ userId, children }) {
  const value = useUserPreferencesState(userId);
  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider",
    );
  }
  return ctx;
}
