import React, { useRef } from 'react';
import { Pressable, Text } from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { RowDeleteAction } from './RowActions';

type NoteRowProps = {
  text: string;
  onPress?: () => void;
  onDelete?: () => void;
};

// Same gesture language as task rows: tap the text to edit, swipe left to
// let go.
export default function NoteRow({ text, onPress, onDelete }: NoteRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);

  const closeThen = (action: () => void) => () => {
    swipeRef.current?.close();
    action();
  };

  const row = (
    <Pressable onPress={onPress} className="py-5">
      <Text className="text-lg leading-7 font-serif text-ink-dark-primary">{text}</Text>
    </Pressable>
  );

  if (!onDelete) {
    return row;
  }

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      renderRightActions={() => <RowDeleteAction onDelete={closeThen(onDelete)} />}
    >
      {row}
    </ReanimatedSwipeable>
  );
}
