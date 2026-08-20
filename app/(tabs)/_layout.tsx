import { Feather } from '@expo/vector-icons';
// oxlint-disable-next-line react-doctor/rn-no-non-native-navigator
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { strings } from '@/constants/strings';
import { useAppRevealed } from '@/hooks/AppReveal';
import { TabKey, TaskProvider, useTabAllComplete } from '@/hooks/TaskStore';
import { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ColorValue,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SharedValue,
  useAnimatedKeyboard,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const BAR_RISE_DISTANCE = 130;
const BAR_RISE_DELAY_MS = 200;
const BAR_RISE_DURATION_MS = 700;

const TAB_BAR_BOTTOM = 38;
const TAB_BAR_HEIGHT = 72;
const TAB_BAR_RADIUS = 38;

const TAB_BAR_SLOTS = ['today', 'upcoming', 'flame', 'someday', 'history'] as const;

const HOLD_MS = 650;
const RING_REWIND_MS = 200;
const RING_OPACITY_OUT_MS = 220;
const SHEET_CLOSE_MS = 420;
const CAPTURE_GAP = 16;

const RING_CANVAS = 52;
const RING_OFFSET = -5;
const RING_RADIUS = 24.5;
const RING_STROKE_WIDTH = 2.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CaptureState = 'idle' | 'holding' | 'active' | 'closing';

function TaskTabIcon({ tab, color, size }: { tab: TabKey; color: ColorValue; size: number }) {
  const allComplete = useTabAllComplete(tab);
  return <Feather name={allComplete ? 'check-square' : 'square'} size={size} color={color} />;
}

const FLAME_ICON_LIGHT = require('@/assets/images/flame_light.png');
const FLAME_ICON_DARK = require('@/assets/images/flame_black.png');

const GLOW_SIZE = 64;
const ICON_SIZE = 24;
const GLOW_OFFSET = -(GLOW_SIZE - ICON_SIZE) / 2;

function FlameCaptureButton({
  isDark,
  fill,
  fillOpacity,
  glow,
  onPressIn,
  onPressOut,
  onPress,
}: {
  isDark: boolean;
  fill: SharedValue<number>;
  fillOpacity: SharedValue<number>;
  glow: SharedValue<number>;
  onPressIn: () => void;
  onPressOut: () => void;
  onPress: () => void;
}) {
  const glowColor = isDark ? '#9fd7bc' : '#7A9B76';
  const glowPeakOpacity = isDark ? 0.9 : 0.55;

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const ringOpacityStyle = useAnimatedStyle(() => ({ opacity: fillOpacity.value }));
  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - fill.value),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onLongPress={() => {}}
      delayLongPress={HOLD_MS}
      accessibilityRole="button"
      accessibilityLabel={strings.a11y.addTask}
      accessibilityHint={strings.a11y.addTaskHint}
      hitSlop={12}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      className="items-center justify-center"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: GLOW_SIZE,
            height: GLOW_SIZE,
            left: GLOW_OFFSET,
            top: GLOW_OFFSET,
          },
          glowStyle,
        ]}
      >
        <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
          <Defs>
            <RadialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={glowColor} stopOpacity={glowPeakOpacity} />
              <Stop offset="55%" stopColor={glowColor} stopOpacity={glowPeakOpacity * 0.45} />
              <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#flameGlow)" />
        </Svg>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: RING_CANVAS,
            height: RING_CANVAS,
            left: RING_OFFSET,
            top: RING_OFFSET,
          },
          ringOpacityStyle,
        ]}
      >
        <Svg width={RING_CANVAS} height={RING_CANVAS}>
          <AnimatedCircle
            cx={RING_CANVAS / 2}
            cy={RING_CANVAS / 2}
            r={RING_RADIUS}
            stroke={isDark ? '#9fd7bc' : '#7A9B76'}
            strokeWidth={RING_STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            transform={`rotate(-90 ${RING_CANVAS / 2} ${RING_CANVAS / 2})`}
            animatedProps={ringAnimatedProps}
          />
        </Svg>
      </Animated.View>
      <Image
        source={isDark ? FLAME_ICON_DARK : FLAME_ICON_LIGHT}
        resizeMode="contain"
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
      />
    </Pressable>
  );
}

function RisingTabBar({
  state,
  descriptors,
  navigation,
  isDark,
  fill,
  fillOpacity,
  glow,
  onCaptureBegin,
  onCaptureEnd,
  onCapturePress,
}: BottomTabBarProps & {
  isDark: boolean;
  fill: SharedValue<number>;
  fillOpacity: SharedValue<number>;
  glow: SharedValue<number>;
  onCaptureBegin: () => void;
  onCaptureEnd: () => void;
  onCapturePress: () => void;
}) {
  const revealed = useAppRevealed();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const progress = useSharedValue(revealed ? 1 : 0);
  const keyboard = useAnimatedKeyboard();

  useEffect(() => {
    if (revealed) {
      progress.value = withDelay(
        BAR_RISE_DELAY_MS,
        withTiming(1, { duration: BAR_RISE_DURATION_MS, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [revealed, progress]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * BAR_RISE_DISTANCE }],
    bottom: TAB_BAR_BOTTOM + keyboard.height.value,
  }));

  const activeColor = isDark ? '#9DB89A' : '#7A9B76';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: SCREEN_WIDTH * 0.04,
          right: SCREEN_WIDTH * 0.04,
          height: TAB_BAR_HEIGHT,
          borderRadius: TAB_BAR_RADIUS,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)',
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.18 : 0.1,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14,
        },
        riseStyle,
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: TAB_BAR_RADIUS,
          overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.56)',
        }}
      >
        <BlurView
          blurMethod="dimezisBlurView"
          intensity={isDark ? 28 : 42}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, flexDirection: 'row', paddingTop: 8, paddingBottom: 10 }}>
          {TAB_BAR_SLOTS.map((slot) => {
            if (slot === 'flame') {
              return (
                <View
                  key="flame"
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <FlameCaptureButton
                    isDark={isDark}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    glow={glow}
                    onPressIn={onCaptureBegin}
                    onPressOut={onCaptureEnd}
                    onPress={onCapturePress}
                  />
                </View>
              );
            }

            const index = state.routes.findIndex((route) => route.name === slot);
            if (index === -1) {
              return null;
            }
            const route = state.routes[index];
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const color = focused ? activeColor : inactiveColor;
            const label = options.title ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                <Text style={{ color, fontSize: 12 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [captureDraft, setCaptureDraft] = useState('');
  const [screenReaderOn, setScreenReaderOn] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fill = useSharedValue(0);
  const fillOpacity = useSharedValue(0);
  const glow = useSharedValue(0);
  const keyboard = useAnimatedKeyboard();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderOn);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderOn);
    return () => sub.remove();
  }, []);

  const clearHoldTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  useEffect(() => clearHoldTimer, []);

  const onCapture = (_label: string) => {};

  const beginHold = () => {
    if (captureState !== 'idle') {
      return;
    }
    setCaptureState('holding');
    if (!reduceMotion) {
      fillOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
      fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    }
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setCaptureState('active');
      setCaptureDraft('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!reduceMotion) {
        fill.value = 1;
        fillOpacity.value = withDelay(780, withTiming(0, { duration: RING_OPACITY_OUT_MS }));
        glow.value = withSequence(
          withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) })
        );
      }
    }, HOLD_MS);
  };

  const endHold = () => {
    if (captureState !== 'holding') {
      return;
    }
    clearHoldTimer();
    setCaptureState('idle');
    if (!reduceMotion) {
      fill.value = withTiming(0, {
        duration: RING_REWIND_MS,
        easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      });
      fillOpacity.value = withTiming(0, { duration: RING_OPACITY_OUT_MS });
    }
  };

  const submitCapture = () => {
    const label = captureDraft.trim();
    setCaptureState('closing');
    fillOpacity.value = 0;
    fill.value = 0;
    setTimeout(() => {
      setCaptureState('idle');
      if (label) {
        onCapture(label);
      }
    }, SHEET_CLOSE_MS);
  };

  const handleFlamePress = () => {
    if (screenReaderOn && captureState === 'idle') {
      setCaptureState('active');
      setCaptureDraft('');
    }
  };

  const captureCardStyle = useAnimatedStyle(() => ({
    bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + CAPTURE_GAP + keyboard.height.value,
  }));

  const baseTabBarStyle = {
    position: 'absolute' as const,
    marginHorizontal: SCREEN_WIDTH * 0.04,
    bottom: TAB_BAR_BOTTOM,
    backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.56)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)',
    borderRadius: 38,
    height: TAB_BAR_HEIGHT,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.18 : 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  };

  return (
    <TaskProvider>
      <View style={{ flex: 1 }}>
        <View style={StyleSheet.absoluteFill} className="bg-surface-page dark:bg-surface-dark-page">
          <AnimatedBackground />
        </View>
        <Tabs
          tabBar={(props) => (
            <RisingTabBar
              {...props}
              isDark={isDark}
              fill={fill}
              fillOpacity={fillOpacity}
              glow={glow}
              onCaptureBegin={beginHold}
              onCaptureEnd={endHold}
              onCapturePress={handleFlamePress}
            />
          )}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: 'transparent' },
            tabBarActiveTintColor: isDark ? '#9DB89A' : '#7A9B76',
            tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
            tabBarStyle: baseTabBarStyle,
            tabBarBackground: () => (
              <BlurView
                blurMethod="dimezisBlurView"
                intensity={isDark ? 28 : 42}
                tint={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 38, overflow: 'hidden' }]}
              />
            ),
            tabBarLabelStyle: {
              fontSize: 12,
            },
          }}
        >
          <Tabs.Screen
            name="today"
            options={{
              title: strings.tabs.today,
              tabBarIcon: ({ color, size }) => (
                <TaskTabIcon tab="today" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="upcoming"
            options={{
              title: strings.tabs.upcoming,
              tabBarIcon: ({ color, size }) => (
                <TaskTabIcon tab="upcoming" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="someday"
            options={{
              title: strings.tabs.someday,
              tabBarIcon: ({ color, size }) => (
                <TaskTabIcon tab="someday" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: strings.tabs.history,
              tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} />,
            }}
          />
        </Tabs>
        {captureState === 'active' || captureState === 'closing' ? (
          <Animated.View
            style={[
              { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
              captureCardStyle,
            ]}
            entering={reduceMotion ? undefined : FadeIn.duration(340)}
            exiting={reduceMotion ? undefined : FadeOut.duration(380)}
          >
            <View
              className="w-[86%] rounded-2xl bg-white px-[17px] py-[15px] dark:bg-[#1d1d1d]"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.14,
                shadowRadius: 32,
                shadowOffset: { width: 0, height: 12 },
                elevation: 8,
              }}
            >
              <TextInput
                autoFocus
                value={captureDraft}
                onChangeText={setCaptureDraft}
                onSubmitEditing={submitCapture}
                returnKeyType="done"
                placeholder={strings.tasks.newTaskPlaceholder}
                placeholderTextColor="#b6b3ab"
                className="text-[15.5px] leading-5 text-[#2a2a28] dark:text-[#f2f1ee]"
              />
            </View>
          </Animated.View>
        ) : null}
      </View>
    </TaskProvider>
  );
}
