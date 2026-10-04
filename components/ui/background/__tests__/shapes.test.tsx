import React from 'react';
import { render } from '@testing-library/react-native';
import Svg, { Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Bubble } from '../shapes/Bubble';
import { Bulb } from '../shapes/Bulb';
import { SHAPES, type ShapeKind } from '../shapes';

describe('background shapes', () => {
  it('registers bubble and bulb', () => {
    const kinds = Object.keys(SHAPES).sort() as ShapeKind[];
    expect(kinds).toEqual(['bubble', 'bulb']);
    expect(SHAPES.bubble).toBe(Bubble);
    expect(SHAPES.bulb).toBe(Bulb);
  });

  it('a shape renders from size, color and opacity alone', () => {
    for (const Shape of Object.values(SHAPES)) {
      const { UNSAFE_getAllByType } = render(<Shape size={120} color="#82AC78" opacity={0.6} />);
      expect(UNSAFE_getAllByType(Svg)[0].props).toMatchObject({ width: 120, height: 120 });
      for (const stop of UNSAFE_getAllByType(Stop)) {
        expect(stop.props.stopColor).toBe('#82AC78');
      }
    }
  });

  it('bubble keeps its rim and specular highlight; bulb is a single soft disc', () => {
    const bubble = render(<Bubble size={100} color="#82AC78" opacity={0.6} />);
    const bubbleEllipses = bubble.UNSAFE_getAllByType(Ellipse).map((e) => e.props);
    expect(bubbleEllipses).toHaveLength(2);
    expect(bubbleEllipses[0]).toMatchObject({ stroke: '#82AC78', strokeWidth: 2 });
    expect(bubbleEllipses[1]).toMatchObject({ fill: '#FFFFFF' });

    const bulb = render(<Bulb size={100} color="#82AC78" opacity={0.6} />);
    const bulbEllipses = bulb.UNSAFE_getAllByType(Ellipse).map((e) => e.props);
    expect(bulbEllipses).toHaveLength(1);
    expect(bulbEllipses[0].stroke).toBeUndefined();
  });

  it('two instances of the same shape do not share a gradient id', () => {
    const { UNSAFE_getAllByType } = render(
      <>
        <Bubble size={100} color="#82AC78" opacity={0.6} />
        <Bubble size={100} color="#82AC78" opacity={0.6} />
      </>
    );
    const ids = UNSAFE_getAllByType(RadialGradient).map((g) => g.props.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toEqual(ids[1]);
    const fills = UNSAFE_getAllByType(Ellipse)
      .map((e) => e.props.fill)
      .filter((f: string) => f.startsWith('url('));
    expect(fills).toEqual([`url(#${ids[0]})`, `url(#${ids[1]})`]);
  });
});
