import { memo } from "react";
import { Image, ImageSourcePropType, StyleSheet } from "react-native";

function CanvasBackground({ source }: { source: ImageSourcePropType }) {
  return (
    <Image
      source={source}
      style={StyleSheet.absoluteFill}
      resizeMode="cover" // fills the screen, keeps aspect ratio, never stretches
      fadeDuration={0}
    />
  );
}

export default memo(CanvasBackground);