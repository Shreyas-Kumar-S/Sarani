import React, { ReactNode } from 'react';
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useAppConfig } from '@/hooks/AppConfigStore';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/constants/appConfig';
import { strings } from '@/constants/strings';

export function UpdateGate({ children }: { children: ReactNode }) {
  const { updateState, config } = useAppConfig();

  const openStore = () =>
    Linking.openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL);

  return (
    <>
      {children}
      <Modal visible={updateState === 'blocked'} animationType="fade" transparent>
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-[28px] bg-surface-page dark:bg-surface-dark-page p-7">
            <Text className="font-serif text-2xl text-ink-primary dark:text-ink-dark-primary">
              {strings.update.blockedTitle}
            </Text>
            <Text className="mt-3 text-base leading-7 text-ink-secondary dark:text-ink-dark-secondary">
              {config.updateMessage || strings.update.blockedBody}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={openStore}
              className="mt-6 items-center justify-center rounded-full bg-primary py-4"
            >
              <Text className="text-[18px] text-ink-dark-primary">{strings.update.button}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
