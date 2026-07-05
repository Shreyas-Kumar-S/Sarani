import React, { createContext, ReactNode, use } from 'react';

// True once the startup choreography (splash → welcome curtain) has finished
// and the main app is fully visible. The tab bar waits for this signal before
// rising into place. Defaults to true so screens rendered outside the root
// layout (tests, previews) are never stuck hidden.
const AppRevealContext = createContext(true);

export function AppRevealProvider({
  revealed,
  children,
}: {
  revealed: boolean;
  children: ReactNode;
}) {
  return <AppRevealContext.Provider value={revealed}>{children}</AppRevealContext.Provider>;
}

export function useAppRevealed() {
  return use(AppRevealContext);
}
