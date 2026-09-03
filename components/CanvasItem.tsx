import { Image, Text, View, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Feather } from "@expo/vector-icons";

interface CanvasItemProps {
  id: string;
  title: string;
  imageUri: string;

  x: number;
  y: number;

  width: number;
  height: number;

  isSelected: boolean;

  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
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
  onSelect,
  onDelete,
  onEdit,
  onPositionChange,
  onSizeChange,
}: CanvasItemProps) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);

  const startX = useSharedValue(x);
  const startY = useSharedValue(y);

  const itemWidth = useSharedValue(width);
  const itemHeight = useSharedValue(height);

  const startWidth = useSharedValue(width);
  const startHeight = useSharedValue(height);

  const panGesture = Gesture.Pan()

    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;

      scheduleOnRN(onSelect, id);
    })

    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })

    .onEnd(() => {
      scheduleOnRN(onPositionChange, id, translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onSelect, id);
  });

  const resizeGesture = Gesture.Pan()

    .onStart(() => {
      startWidth.value = itemWidth.value;
      startHeight.value = itemHeight.value;
    })

    .onUpdate((event) => {
      const newWidth = startWidth.value + event.translationX;
      const newHeight = startHeight.value + event.translationY;

      itemWidth.value = Math.max(100, newWidth);
      itemHeight.value = Math.max(100, newHeight);
    })

    .onEnd(() => {
      scheduleOnRN(onSizeChange, id, itemWidth.value, itemHeight.value);
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

  const editGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onEdit, id);
  });

  const deleteGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onDelete, id);
  });

  const cardGesture = Gesture.Exclusive(panGesture, tapGesture);
  return (
    <GestureDetector gesture={cardGesture}>
      <Animated.View className="absolute border border-blue-400 p-4" style={itemAnimatedStyle}>
        {isSelected && (
          <View className="absolute -top-12 right-0 z-10 flex-row gap-2">
            <GestureDetector gesture={editGesture}>
              <View className="h-9 w-9 items-center justify-center rounded-full border border-blue-400 bg-white">
                <Feather name="edit-2" size={17} color="#2563EB" />
              </View>
            </GestureDetector>

            <GestureDetector gesture={deleteGesture}>
              <View className="h-9 w-9 items-center justify-center rounded-full border border-red-400 bg-white">
                <Feather name="trash-2" size={17} color="#EF4444" />
              </View>
            </GestureDetector>
          </View>
        )}

        <Animated.View
          className={`overflow-hidden bg-white ${
            isSelected ? "border-2 border-blue-500" : "border border-blue-300"
          }`}
          style={sizeAnimatedStyle}
        >
          <Image
            source={{
              uri: imageUri,
            }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </Animated.View>

        <Text className="mt-2 max-w-[250px] text-base font-medium text-black">
          {title}
        </Text>

        {isSelected && (
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
