import React from 'react';
import { Feather } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import BaseScreen from './BaseScreen';
import Header from '../ui/Header';
import PrimaryButton from '../ui/PrimaryButton';

export type NoteBlock = {
  title: string;
  body: string;
  meta?: string;
  isLink?: boolean;
};

type NotesScreenProps = {
  title: string;
  blocks: NoteBlock[];
  ctaLabel: string;
};

export default function NotesScreen({ title, blocks, ctaLabel }: NotesScreenProps) {
  return (
    <BaseScreen className="pt-2" variant="notes">
      <Header title={title} centered inverted />
      <ScrollView contentContainerClassName="pt-5" showsVerticalScrollIndicator={false}>
        <View className="rounded-[28px] bg-white/10 dark:bg-white/5 px-7 py-5">
          <View className="flex-row items-center gap-4">
            <Feather name="feather" size={26} color="#DDE4DF" />
            <Text className="flex-1 text-lg leading-7 font-serif text-ink-dark-primary">
              Get thoughts out of your head{'\n'}and breathe a little easier
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-[28px] bg-white/10 dark:bg-white/5 px-6 py-2">
          {blocks.map((block, index) => (
            <View
              key={block.title}
              className={`py-5 ${
                index === blocks.length - 1
                  ? ''
                  : 'border-b border-ink-dark-quaternary/25 dark:border-ink-dark-quaternary/25'
              }`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 font-serif text-[22px] text-ink-dark-primary">
                  {block.title}
                </Text>
                {block.isLink ? (
                  <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.75)" />
                ) : null}
              </View>
              {block.body ? (
                <Text className="mt-5 text-lg leading-7 font-serif text-ink-dark-secondary">
                  {block.body}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <PrimaryButton label={ctaLabel} variant="notes" />
      </ScrollView>
    </BaseScreen>
  );
}
