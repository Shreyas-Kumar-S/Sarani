import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import BaseScreen from './BaseScreen';
import Header from '../ui/Header';
import SectionTitle from '../ui/SectionTitle';
import TaskRow from '../ui/TaskRow';
import PrimaryButton from '../ui/PrimaryButton';

type TaskItem = {
  label: string;
  time?: string;
  checked?: boolean;
};

type TaskSection = {
  title: string;
  items: TaskItem[];
};

type TaskListScreenProps = {
  greeting: string;
  sectionTitle: string;
  sections: TaskSection[];
  ctaLabel: string;
  footerNote?: string;
};

export default function TaskListScreen({
  greeting,
  sectionTitle,
  sections,
  ctaLabel,
  footerNote,
}: TaskListScreenProps) {
  return (
    <BaseScreen className="pt-2">
      <Header title={greeting} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-surface-primary dark:bg-surface-dark-primary px-5 py-4">
          <SectionTitle title={sectionTitle} />
          <View className="rounded-2xl bg-surface-secondary dark:bg-surface-dark-secondary px-4 py-2">
            {sections.map((section) => (
              <View key={section.title} className="mb-4 last:mb-0">
                <SectionTitle title={section.title} />
                {section.items.map((item, index) => (
                  <View
                    key={`${section.title}-${item.label}-${index}`}
                    className="border-b border-ink-quaternary/20 dark:border-ink-dark-quaternary/20 last:border-b-0"
                  >
                    <TaskRow label={item.label} time={item.time} checked={item.checked} />
                  </View>
                ))}
              </View>
            ))}
            <PrimaryButton label={ctaLabel} />
          </View>
        </View>
        {footerNote ? (
          <View className="mt-6 items-center">
            <View className="h-[3px] w-10 rounded-full bg-primary/30" />
            <Text className="mt-3 text-xs text-ink-quaternary dark:text-ink-dark-quaternary tracking-wide">
              {footerNote}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </BaseScreen>
  );
}
