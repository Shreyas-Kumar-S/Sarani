import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import TaskRow from '../TaskRow';

describe('TaskRow split-tap', () => {
  it('tapping the checkbox toggles without entering edit', () => {
    const onToggle = jest.fn();
    const onLabelPress = jest.fn();
    const api = render(
      <TaskRow label="water the plants" onToggle={onToggle} onLabelPress={onLabelPress} />
    );

    fireEvent.press(api.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onLabelPress).not.toHaveBeenCalled();
  });

  it('tapping the text enters edit without toggling', () => {
    const onToggle = jest.fn();
    const onLabelPress = jest.fn();
    const api = render(
      <TaskRow label="water the plants" onToggle={onToggle} onLabelPress={onLabelPress} />
    );

    fireEvent.press(api.getByText('water the plants'));

    expect(onLabelPress).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('reflects the checked state on the checkbox for accessibility', () => {
    const api = render(<TaskRow label="done thing" checked onToggle={jest.fn()} />);

    expect(api.getByRole('checkbox')).toBeChecked();
  });
});
