import Svg, { Defs, Pattern, Circle, Rect } from "react-native-svg";

interface DottedBackgroundProps {
  width?: number;
  height?: number;
}

export default function DottedBackground({
  width = 5000,
  height = 5000,
}: DottedBackgroundProps) {
  return (
    <Svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <Defs>
        <Pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
          <Circle cx="1" cy="1" r="1" fill="#D1D5DB" />
        </Pattern>
      </Defs>

      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}
