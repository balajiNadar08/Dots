import { ReactNode } from "react";
import { View, Pressable, Text, ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import CanvasBackground from "./CanvasBackground";
import type { BackgroundId } from "../types/canvas";

interface InfiniteCanvasProps {
  children: ReactNode;
  background: ImageSourcePropType;
  backgroundId: BackgroundId;
}

export default function InfiniteCanvas({
  children,
  background,
  backgroundId,
}: InfiniteCanvasProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const scale = useSharedValue(1);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const startScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;

      translateY.value = startY.value + event.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      const newScale = startScale.value * event.scale;

      scale.value = Math.max(0.5, Math.min(newScale, 3));
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
      {
        translateY: translateY.value,
      },
      {
        scale: scale.value,
      },
    ],
  }));

  const zoomIn = () => {
    scale.value = withTiming(Math.min(scale.value + 0.2, 3));
  };

  const zoomOut = () => {
    scale.value = withTiming(Math.max(scale.value - 0.2, 0.5));
  };

  const resetCanvas = () => {
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    scale.value = withTiming(1);
  };

  return (
    <View className="flex-1 overflow-hidden">
      <CanvasBackground source={background} backgroundId={backgroundId} />
      <GestureDetector gesture={gesture}>
        <Animated.View
          className="absolute"
          style={[
            {
              width: 5000,
              height: 5000,

              left: -2200,
              top: -2200,
            },
            animatedStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>

      <View className="absolute bottom-8 left-6 gap-2">
        <Pressable
          onPress={zoomIn}
          className="h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white"
        >
          <Text className="text-2xl text-black">+</Text>
        </Pressable>

        <Pressable
          onPress={zoomOut}
          className="h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white"
        >
          <Text className="text-2xl text-black">−</Text>
        </Pressable>

        <Pressable
          onPress={resetCanvas}
          className="h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white"
        >
          <Text className="text-lg text-black">⌂</Text>
        </Pressable>
      </View>
    </View>
  );
}
