import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RowDeleteAction } from '../RowActions';
import { strings } from '@/constants/strings';

describe('RowDeleteAction', () => {
  it('calls onDelete when "Let it go" is tapped', () => {
    const onDelete = jest.fn();
    const api = render(<RowDeleteAction onDelete={onDelete} />);

    fireEvent.press(api.getByText(strings.actions.letItGo));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
