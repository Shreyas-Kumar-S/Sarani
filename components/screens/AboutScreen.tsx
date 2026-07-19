import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SectionCarousel, { CarouselItem } from '@/components/ui/SectionCarousel';
import { strings } from '@/constants/strings';
import { useAppConfig } from '@/hooks/AppConfigStore';

type SectionKey = keyof typeof strings.about.sections;

const SECTION_ORDER: SectionKey[] = ['today', 'upcoming', 'someday', 'history', 'about'];

const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    key: 'today',
    label: strings.about.sections.today.label,
    image: require('../../assets/images/today.png'),
  },
  {
    key: 'upcoming',
    label: strings.about.sections.upcoming.label,
    image: require('../../assets/images/comingup.png'),
  },
  {
    key: 'someday',
    label: strings.about.sections.someday.label,
    image: require('../../assets/images/someday.png'),
  },
  {
    key: 'history',
    label: strings.about.sections.history.label,
    image: require('../../assets/images/history.png'),
  },
  {
    key: 'about',
    label: strings.about.sections.about.label,
    image: require('../../assets/images/about.png'),
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accentColor = isDark ? '#9DB89A' : '#7A9B76';

  // Sourced from Sanity (falls back to the shipped defaults offline) so devs
  // can add/reorder/retire upcoming features without an app release.

  const { config } = useAppConfig();
  const [activeSection, setActiveSection] = useState<SectionKey>('today');
  const active = strings.about.sections[activeSection];
  const activeIndex = SECTION_ORDER.indexOf(activeSection);

  return (

    <View
      style={{ backgroundColor: isDark ? '#000000' : '#FBFAF8' }}
      className="flex-1"
    >
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="flex-row items-center justify-between px-6 pb-2"
      >
        <Text className="font-serif text-[28px] text-ink-primary dark:text-ink-dark-primary">
          {strings.about.title}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={strings.a11y.closeAbout}
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
          className="h-8 w-8 items-center justify-center"
        >
          <Feather
            name="x"
            size={20}
            color={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: insets.bottom + 48,
          paddingHorizontal: 24,
        }}
      >
        <Text className="my-6 text-balance text-[17px] leading-6 text-ink-secondary dark:text-ink-dark-secondary">
          {strings.about.coreIdea}
        </Text>

        <Text className="mb-3 text-center text-[13px] font-bold tracking-wide text-primary">
          {strings.about.exploreSectionsLabel}
        </Text>
        <SectionCarousel
          items={CAROUSEL_ITEMS}
          activeIndex={activeIndex}
          onChange={(index) => setActiveSection(SECTION_ORDER[index])}
          accentColor={accentColor}
        />

        <View className="mb-8 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-4">
          <Text className="mb-1 text-[15px] font-semibold text-ink-primary dark:text-ink-dark-primary">
            {active.label}
          </Text>
          <Text className="text-[13.5px] leading-5 text-ink-secondary dark:text-ink-dark-secondary">
            {active.description}
          </Text>
        </View>

        <Text className="mb-3 text-[13px] font-bold tracking-wide text-primary">
          {strings.about.featuresComingLabel}
        </Text>
        {(config.upcomingFeatures ?? []).map((feature) => (
          <View
            key={feature.title}
            className="mb-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-4"
          >
            <Text className="mb-1 text-[15px] font-semibold text-ink-primary dark:text-ink-dark-primary">
              {feature.title}
            </Text>
            <Text className="text-[13.5px] leading-5 text-ink-secondary dark:text-ink-dark-secondary">
              {feature.description}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
