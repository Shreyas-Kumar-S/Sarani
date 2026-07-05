import React from 'react';
import { render } from '@testing-library/react-native';
import { SplashLogoLight, SplashLogoDark } from '../SplashLogo';

describe('SplashLogo', () => {
  describe('SplashLogoLight', () => {
    it('renders without crashing', () => {
      const { toJSON } = render(<SplashLogoLight />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders with custom dimensions', () => {
      const { toJSON } = render(<SplashLogoLight width={400} height={400} />);
      expect(toJSON()).toBeTruthy();
    });

    it('matches snapshot (light mode)', () => {
      const { toJSON } = render(<SplashLogoLight />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('SplashLogoDark', () => {
    it('renders without crashing', () => {
      const { toJSON } = render(<SplashLogoDark />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders with custom dimensions', () => {
      const { toJSON } = render(<SplashLogoDark width={400} height={400} />);
      expect(toJSON()).toBeTruthy();
    });

    it('matches snapshot (dark mode)', () => {
      const { toJSON } = render(<SplashLogoDark />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('SVG structure & animation properties', () => {
    it('has correct path length (strokeDasharray)', () => {
      const { toJSON } = render(<SplashLogoLight />);
      const tree = JSON.stringify(toJSON());
      expect(tree).toContain('1090');
    });

    it('has rounded background corners (rx)', () => {
      const { toJSON } = render(<SplashLogoLight />);
      const tree = JSON.stringify(toJSON());
      expect(tree).toContain('"rx":"220"');
    });
  });
});
