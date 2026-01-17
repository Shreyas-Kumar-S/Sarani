import React from 'react';
import { render } from '@testing-library/react-native';
import SplashScreen from '../SplashScreen';

jest.mock('../SplashLogo', () => ({
  SplashLogoLight: () => null,
  SplashLogoDark: () => null,
}));

describe('SplashScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<SplashScreen onFinish={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });

  it('eventually calls onFinish', () => {
    const onFinish = jest.fn();
    render(<SplashScreen onFinish={onFinish} />);
    expect(onFinish).toHaveBeenCalled();
  });
});
