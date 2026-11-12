import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Feather } from "@expo/vector-icons";

import type { ItemLayout } from "../types/canvas";

interface CanvasItemProps {
  id: string;
  title: string;
  imageUri: string;

  x: number;
  y: number;

  width: number;
  height: number;

  isSelected: boolean;
  isConnecting: boolean;
  isConnectSource: boolean;

  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onConnectStart: (id: string) => void;
  onConnectTarget: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;

  registerLayout: (id: string, layout: ItemLayout) => void;
  unregisterLayout: (id: string) => void;
}

export default function CanvasItem({
  id,
  title,
  imageUri,
  x,
  y,
  width,
  height,
  isSelected,
  isConnecting,
  isConnectSource,
  onSelect,
  onDelete,
  onEdit,
  onConnectStart,
  onConnectTarget,
  onPositionChange,
  onSizeChange,
  registerLayout,
  unregisterLayout,
}: CanvasItemProps) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);

  const startX = useSharedValue(x);
  const startY = useSharedValue(y);

  const itemWidth = useSharedValue(width);
  const itemHeight = useSharedValue(height);

  const startWidth = useSharedValue(width);
  const startHeight = useSharedValue(height);

  // Expose the live shared values so connection lines follow this card on the UI thread.
  useEffect(() => {
    registerLayout(id, {
      x: translateX,
      y: translateY,
      width: itemWidth,
      height: itemHeight,
    });
    return () => unregisterLayout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;

      // Dragging must not pick a connection target; only a tap does.
      if (!isConnecting) {
        scheduleOnRN(onSelect, id);
      }
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      scheduleOnRN(onPositionChange, id, translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isConnecting) {
      scheduleOnRN(onConnectTarget, id);
    } else {
      scheduleOnRN(onSelect, id);
    }
  });

  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      startWidth.value = itemWidth.value;
      startHeight.value = itemHeight.value;
    })
    .onUpdate((event) => {
      const newWidth = startWidth.value + event.translationX;
      const newHeight = startHeight.value + event.translationY;

      itemWidth.value = Math.max(120, newWidth);
      itemHeight.value = Math.max(120, newHeight);
    })
    .onEnd(() => {
      scheduleOnRN(onSizeChange, id, itemWidth.value, itemHeight.value);
    });

  const editGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onEdit, id);
  });

  const connectGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onConnectStart, id);
  });

  const deleteGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onDelete, id);
  });

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
      {
        translateY: translateY.value,
      },
    ],
  }));

  const sizeAnimatedStyle = useAnimatedStyle(() => ({
    width: itemWidth.value,
    height: itemHeight.value,
  }));

  const cardGesture = Gesture.Exclusive(panGesture, tapGesture);

  const showControls = isSelected && !isConnecting;

  const borderClass = isConnectSource
    ? "border-2 border-red-500 bg-white"
    : isSelected
      ? "border-2 border-blue-500 bg-white"
      : "border border-gray-200 bg-white";

  return (
    <GestureDetector gesture={cardGesture}>
      <Animated.View
        style={itemAnimatedStyle}
        className={`absolute overflow-visible ${borderClass}`}
      >
        {showControls && (
          <View className="absolute -top-12 right-0 z-50 flex-row items-center gap-2">

            <GestureDetector gesture={editGesture}>
              <View className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
                <Feather name="edit-2" size={16} color="#374151" />
              </View>
            </GestureDetector>

            <GestureDetector gesture={deleteGesture}>
              <View className="h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white shadow-sm">
                <Feather name="trash-2" size={16} color="#EF4444" />
              </View>
            </GestureDetector>

            <GestureDetector gesture={connectGesture}>
              {/* <View className="h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white shadow-sm">
                <Feather name="link-2" size={16} color="#D64545" />
              </View> */}
              <View className="px-2 py-0.5 items-center justify-center rounded-full border border-red-600 bg-red-400 shadow-sm">
                <Text className="font-light text-white text-center">connect</Text>
              </View>
            </GestureDetector>
          </View>
        )}

        <Animated.View
          style={sizeAnimatedStyle}
          className="overflow-hidden bg-gray-100"
        >
          <Image
            source={{
              uri: imageUri,
            }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </Animated.View>

        <View className="rounded-b-2xl bg-white px-4 py-3">
          <Text
            numberOfLines={3}
            className="text-[15px] font-medium leading-5 text-gray-900"
          >
            {title || "Untitled"}
          </Text>
        </View>

        {showControls && (
          <GestureDetector gesture={resizeGesture}>
            <Animated.View className="absolute -bottom-2 -right-2 z-20 h-8 w-8 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
              <Feather name="maximize-2" size={15} color="#2563EB" />
            </Animated.View>
          </GestureDetector>
        )}
      </Animated.View>
    </GestureDetector>
  );
}