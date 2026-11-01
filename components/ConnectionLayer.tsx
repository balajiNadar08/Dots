import { memo } from "react";
import Svg, { Line } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { Feather } from "@expo/vector-icons";

import type { Connection, ItemLayout } from "../types/canvas";

const AnimatedLine = Animated.createAnimatedComponent(Line);

const LINE_COLOR = "#D64545";
const BADGE_SIZE = 28;

/* ------------------------------ Lines ------------------------------ */

function ConnectionLine({ a, b }: { a: ItemLayout; b: ItemLayout }) {
  // Runs on the UI thread every frame the card moves/resizes. No React re-render.
  const animatedProps = useAnimatedProps(() => ({
    x1: a.x.value + a.width.value / 2,
    y1: a.y.value + a.height.value / 2,
    x2: b.x.value + b.width.value / 2,
    y2: b.y.value + b.height.value / 2,
  }));

  return (
    <AnimatedLine
      animatedProps={animatedProps}
      stroke={LINE_COLOR}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  );
}

interface LayerProps {
  connections: Connection[];
  layouts: Map<string, ItemLayout>;
  /** bumped whenever a card registers/unregisters, so the layer re-evaluates */
  version: number;
}

function ConnectionLines({ connections, layouts }: LayerProps) {
  return (
    <Svg
      width={5000}
      height={5000}
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {connections.map((c) => {
        const a = layouts.get(c.fromId);
        const b = layouts.get(c.toId);
        if (!a || !b) return null;
        return <ConnectionLine key={c.id} a={a} b={b} />;
      })}
    </Svg>
  );
}

export const ConnectionLinesLayer = memo(ConnectionLines);

/* ----------------------------- Badges ------------------------------ */

function ConnectionBadge({
  connection,
  a,
  b,
  onRemove,
}: {
  connection: Connection;
  a: ItemLayout;
  b: ItemLayout;
  onRemove: (id: string) => void;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          (a.x.value + a.width.value / 2 + b.x.value + b.width.value / 2) / 2 -
          BADGE_SIZE / 2,
      },
      {
        translateY:
          (a.y.value + a.height.value / 2 + b.y.value + b.height.value / 2) / 2 -
          BADGE_SIZE / 2,
      },
    ],
  }));

  const tap = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onRemove, connection.id);
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: BADGE_SIZE / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#FCA5A5",
          },
          style,
        ]}
      >
        <Feather name="x" size={15} color="#D64545" />
      </Animated.View>
    </GestureDetector>
  );
}

interface BadgesProps extends LayerProps {
  /** only connections touching this item show a remove badge */
  selectedItemId: string | null;
  onRemove: (id: string) => void;
}

function ConnectionBadges({
  connections,
  layouts,
  selectedItemId,
  onRemove,
}: BadgesProps) {
  if (!selectedItemId) return null;

  return (
    <>
      {connections
        .filter((c) => c.fromId === selectedItemId || c.toId === selectedItemId)
        .map((c) => {
          const a = layouts.get(c.fromId);
          const b = layouts.get(c.toId);
          if (!a || !b) return null;
          return (
            <ConnectionBadge
              key={c.id}
              connection={c}
              a={a}
              b={b}
              onRemove={onRemove}
            />
          );
        })}
    </>
  );
}

export const ConnectionBadgesLayer = memo(ConnectionBadges);