import React, { createContext, ReactNode, RefObject, use } from 'react';
import { View } from 'react-native';

const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

export function BlurTargetProvider({
  target,
  children,
}: {
  target: RefObject<View | null>;
  children: ReactNode;
}) {
  return <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>;
}

export function useBlurTarget() {
  return use(BlurTargetContext) ?? undefined;
}
