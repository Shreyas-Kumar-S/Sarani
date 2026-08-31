import React, { createContext, ReactNode, use, useMemo, useState } from 'react';

type CaptureOverlayValue = {
  isCaptureOpen: boolean;
  setCaptureOpen: (open: boolean) => void;
};

// The flame's capture sheet lives inside the tabs navigator, but the theme
// toggle and info button are mounted in the root layout as siblings *after*
// the Stack. Z-order therefore puts them above the sheet's scrim, where they
// stayed lit and tappable while the sheet was open. The scrim can't reach
// them, so the capture state has to: the provider sits in the root layout and
// the tabs layout pushes state up into it.
const CaptureOverlayContext = createContext<CaptureOverlayValue>({
  isCaptureOpen: false,
  setCaptureOpen: () => {},
});

export function CaptureOverlayProvider({ children }: { children: ReactNode }) {
  const [isCaptureOpen, setCaptureOpen] = useState(false);
  const value = useMemo(() => ({ isCaptureOpen, setCaptureOpen }), [isCaptureOpen]);

  return <CaptureOverlayContext.Provider value={value}>{children}</CaptureOverlayContext.Provider>;
}

export function useCaptureOverlay() {
  return use(CaptureOverlayContext);
}
