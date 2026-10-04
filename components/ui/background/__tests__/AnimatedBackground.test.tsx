import React from 'react';
import { render } from '@testing-library/react-native';
import AnimatedBackground from '../../AnimatedBackground';
import { Floater } from '../Floater';
import { Bubble } from '../shapes/Bubble';
import { Bulb } from '../shapes/Bulb';

describe('AnimatedBackground', () => {
  it('still shows the same six orbs: two bulb anchors and four clear bubbles', () => {
    const { UNSAFE_getAllByType } = render(<AnimatedBackground />);
    expect(UNSAFE_getAllByType(Bulb)).toHaveLength(2);
    expect(UNSAFE_getAllByType(Bubble)).toHaveLength(4);
  });

  it('keeps the anchors on their loop and lets the clear bubbles wander', () => {
    const { UNSAFE_getAllByType } = render(<AnimatedBackground />);
    const floaters = UNSAFE_getAllByType(Floater).map((f) => ({
      left: f.props.left,
      top: f.props.top,
      size: f.props.size,
      motion: f.props.motion,
    }));
    expect(floaters).toEqual([
      { left: -70, top: 560, size: 300, motion: 'loop' },
      { left: 190, top: 620, size: 260, motion: 'loop' },
      { left: 70, top: 380, size: 190, motion: 'wander' },
      { left: 250, top: 190, size: 120, motion: 'wander' },
      { left: -20, top: 300, size: 140, motion: 'wander' },
      { left: 160, top: 480, size: 95, motion: 'wander' },
    ]);
  });

  it('hands each shape only size, color and opacity', () => {
    const { UNSAFE_getAllByType } = render(<AnimatedBackground />);
    for (const node of [...UNSAFE_getAllByType(Bulb), ...UNSAFE_getAllByType(Bubble)]) {
      expect(Object.keys(node.props).sort()).toEqual(['color', 'opacity', 'size']);
    }
  });
});
