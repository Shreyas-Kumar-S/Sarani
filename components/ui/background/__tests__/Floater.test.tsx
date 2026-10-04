import React from 'react';
import { StyleSheet, Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { render } from '@testing-library/react-native';
import { Floater } from '../Floater';

const motion = { driftX: 10, driftY: 12, durationX: 3000, durationY: 3500, delay: 0 };

describe('Floater', () => {
  it('places whatever it is given at the requested spot and size', () => {
    const { toJSON, getByText } = render(
      <Floater left={30} top={40} size={90} {...motion}>
        <Text>payload</Text>
      </Floater>
    );
    expect(getByText('payload')).toBeTruthy();
    const root = toJSON() as unknown as { props: { style: unknown } };
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({
      position: 'absolute',
      left: 30,
      top: 40,
      width: 90,
      height: 90,
    });
  });

  it('never intercepts touches meant for the content above it', () => {
    const { toJSON } = render(
      <Floater left={0} top={0} size={10} {...motion}>
        <Text>x</Text>
      </Floater>
    );
    const root = toJSON() as unknown as { props: { pointerEvents?: string } };
    expect(root.props.pointerEvents).toBe('none');
  });

  it('knows nothing about what it moves', () => {
    // No colour, opacity or variant props exist on the mover: those belong
    // to the shape. This guards the seam the swappable shapes depend on.
    const props = Object.keys(
      (
        <Floater left={0} top={0} size={10} {...motion} motion="wander">
          <Text>x</Text>
        </Floater>
      ).props
    ).sort();
    expect(props).toEqual(
      [
        'children',
        'delay',
        'driftX',
        'driftY',
        'durationX',
        'durationY',
        'left',
        'motion',
        'size',
        'top',
      ].sort()
    );
  });

  it('runs the per-frame wander only when asked to wander', () => {
    const frame = jest.spyOn(Reanimated, 'useFrameCallback');
    render(
      <Floater left={0} top={0} size={10} {...motion} motion="wander">
        <Text>x</Text>
      </Floater>
    );
    expect(frame).toHaveBeenLastCalledWith(expect.any(Function), true);

    render(
      <Floater left={0} top={0} size={10} {...motion}>
        <Text>x</Text>
      </Floater>
    );
    expect(frame).toHaveBeenLastCalledWith(expect.any(Function), false);
    frame.mockRestore();
  });

  it('holds still when the system asks for reduced motion', () => {
    const frame = jest.spyOn(Reanimated, 'useFrameCallback');
    const reduced = jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const timing = jest.spyOn(Reanimated, 'withTiming');
    render(
      <Floater left={0} top={0} size={10} {...motion} motion="wander">
        <Text>x</Text>
      </Floater>
    );
    expect(frame).toHaveBeenLastCalledWith(expect.any(Function), false);
    render(
      <Floater left={0} top={0} size={10} {...motion} motion="loop">
        <Text>x</Text>
      </Floater>
    );
    expect(timing).not.toHaveBeenCalled();
    frame.mockRestore();
    reduced.mockRestore();
    timing.mockRestore();
  });
});
