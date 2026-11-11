import { memo } from "react";
import { Image, ImageSourcePropType, StyleSheet } from "react-native";
import type { BackgroundId } from "../types/canvas";

interface CanvasBackgroundProps {
  source: ImageSourcePropType;
  backgroundId: BackgroundId;
}

function CanvasBackground({ source, backgroundId }: CanvasBackgroundProps) {
  return (
    <Image
      source={source}
      style={StyleSheet.absoluteFill}
      resizeMode={backgroundId === "white" ? "cover" : "repeat"}
      fadeDuration={0}
    />
  );
}

export default memo(CanvasBackground);
