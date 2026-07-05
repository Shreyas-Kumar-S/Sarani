import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { AppRevealProvider, useAppRevealed } from '../AppReveal';

describe('AppReveal', () => {
  it('defaults to revealed so isolated screens are never stuck hidden', () => {
    const { result } = renderHook(() => useAppRevealed());

    expect(result.current).toBe(true);
  });

  it('reflects the provider value during startup choreography', () => {
    const { result, rerender } = renderHook(() => useAppRevealed(), {
      wrapper: ({ children, revealed = false }: { children: React.ReactNode; revealed?: boolean }) => (
        <AppRevealProvider revealed={revealed}>{children}</AppRevealProvider>
      ),
    });

    expect(result.current).toBe(false);
  });
});
