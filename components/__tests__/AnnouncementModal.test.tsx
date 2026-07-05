import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AnnouncementModal } from '../AnnouncementModal';
import * as storeHook from '@/hooks/AppConfigStore';

describe('AnnouncementModal', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows an unseen announcement body', async () => {
    jest.spyOn(storeHook, 'useAppConfig').mockReturnValue({
      updateState: 'none',
      config: {
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        announcement: { id: 'x1', title: 'A small note', body: 'thank you' },
      },
    });
    const api = render(<AnnouncementModal />);
    await waitFor(() => expect(api.getByText('thank you')).toBeTruthy());
  });
});
