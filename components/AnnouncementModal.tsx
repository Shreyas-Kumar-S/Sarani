import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useAppConfig } from '@/hooks/AppConfigStore';
import { isSeen, markSeen } from '@/hooks/seenAnnouncement';

export function AnnouncementModal() {
  const { config } = useAppConfig();
  const announcement = config.announcement ?? null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (announcement && !(await isSeen(announcement.id))) {
        if (!cancelled) setVisible(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [announcement]);

  const dismiss = () => {
    if (announcement) markSeen(announcement.id);
    setVisible(false);
  };

  if (!announcement) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="w-full rounded-[28px] bg-surface-page dark:bg-surface-dark-page p-7">
          <Text className="font-serif text-2xl text-ink-primary dark:text-ink-dark-primary">
            {announcement.title}
          </Text>
          <Text className="mt-3 text-base leading-7 text-ink-secondary dark:text-ink-dark-secondary">
            {announcement.body}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={dismiss}
            className="mt-6 items-center justify-center rounded-full bg-primary py-4"
          >
            <Text className="text-[18px] text-ink-dark-primary">Okay</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
