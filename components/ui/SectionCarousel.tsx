import React, { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image, ImageSourcePropType, Pressable, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type CarouselItem = {
  key: string;
  label: string;
  image: ImageSourcePropType;
};

type SectionCarouselProps = {
  items: CarouselItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  accentColor: string;
};

const CARD_WIDTH = 135;
const CARD_HEIGHT = 205;
const CONTAINER_HEIGHT = 280;
const SPREAD_RADIUS = 160;
const SPREAD_DROOP = 88;
const SWIPE_THRESHOLD = 40;

type CarouselCardProps = {
  item: CarouselItem;
  index: number;
  total: number;
  progress: SharedValue<number>;
  active: boolean;
  accentColor: string;
  onPress: () => void;
};

// A single card's position/rotation/scale/opacity are all continuous
// functions of its signed distance from the (animating) center — the fan
// shape and the "sliding into place" motion come from the same formula,
// evaluated at whatever fractional value `progress` currently is mid-transition.
function CarouselCard({
  item,
  index,
  total,
  progress,
  active,
  accentColor,
  onPress,
}: CarouselCardProps) {
  const cardStyle = useAnimatedStyle(() => {
    let offset = index - progress.value;
    if (offset > total / 2) {
      offset -= total;
    }
    if (offset < -total / 2) {
      offset += total;
    }

    const angleDeg = offset * 26;
    const rad = (angleDeg * Math.PI) / 180;
    const x = Math.sin(rad) * SPREAD_RADIUS;
    const y = (1 - Math.cos(rad)) * SPREAD_DROOP;
    const scale = interpolate(Math.abs(offset), [0, 1], [1, 0.78], Extrapolation.CLAMP);
    const opacity = interpolate(Math.abs(offset), [0, 2, 3], [1, 1, 0], Extrapolation.CLAMP);

    return {
      zIndex: Math.round(10 - Math.abs(offset)),
      opacity,
      transform: [
        { translateX: x - CARD_WIDTH / 2 },
        { translateY: y },
        { rotate: `${angleDeg * 0.4}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: '50%', top: 0 }, cardStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        className="items-center gap-2"
      >
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Image
            source={item.image}
            resizeMode="cover"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#fff',
            }}
          />
        </View>
        <Text
          style={{ color: active ? accentColor : '#9a9994' }}
          className="text-[12.5px] font-semibold"
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// A coverflow-style fan of cards: tap any card, or swipe left/right, to bring
// it to the center. `activeIndex` is fully controlled by the parent — this
// component only owns the animated transition toward whatever index it's
// given, so tapping and swiping both flow through the same onChange callback.
export default function SectionCarousel({
  items,
  activeIndex,
  onChange,
  accentColor,
}: SectionCarouselProps) {
  const progress = useSharedValue(activeIndex);

  useEffect(() => {
    // Animate via the shortest circular path rather than straight to the raw
    // index — otherwise wrapping from the last card back to the first (or vice
    // versa) tweens `progress` through every card in between, which reads as
    // snapping backward instead of continuing the same rotation forward.
    const total = items.length;
    const current = ((progress.value % total) + total) % total;
    let delta = activeIndex - current;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;

    progress.value = withTiming(progress.value + delta, { duration: 350 }, (finished) => {
      // Once settled, re-anchor to the plain canonical index (same rendered
      // position, since the per-card offset math wraps by `total` either way)
      // so `progress.value` doesn't drift further from [0, total) with every
      // rotation over a long session.
      if (finished) {
        progress.value = activeIndex;
      }
    });
  }, [activeIndex, progress, items.length]);

  const commitIndex = (nextIndex: number) => {
    const wrapped = ((nextIndex % items.length) + items.length) % items.length;
    onChange(wrapped);
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        commitIndex(activeIndex + (event.translationX < 0 ? 1 : -1));
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ height: CONTAINER_HEIGHT, alignItems: 'center' }}>
        {items.map((item, index) => (
          <CarouselCard
            key={item.key}
            item={item}
            index={index}
            total={items.length}
            progress={progress}
            active={index === activeIndex}
            accentColor={accentColor}
            onPress={() => commitIndex(index)}
          />
        ))}
      </View>
    </GestureDetector>
  );
}
