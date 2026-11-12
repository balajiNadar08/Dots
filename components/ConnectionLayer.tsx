import { memo } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { Feather } from "@expo/vector-icons";

import type { Connection, ItemLayout } from "../types/canvas";

const LINE_COLOR = "#D64545";
const LINE_THICKNESS = 2.5;
const BADGE_SIZE = 28;

/* ------------------------------ Lines ------------------------------ */

function ConnectionLine({ a, b }: { a: ItemLayout; b: ItemLayout }) {
  // A 1px-wide bar that is moved, rotated and stretched between the two card
  // centres. Runs on the UI thread every frame a card moves/resizes (no React
  // re-render) and, unlike a full-canvas <Svg>, needs no large native surface.
  const style = useAnimatedStyle(() => {
    const x1 = a.x.value + a.width.value / 2;
    const y1 = a.y.value + a.height.value / 2;
    const x2 = b.x.value + b.width.value / 2;
    const y2 = b.y.value + b.height.value / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;

    return {
      transform: [
        { translateX: (x1 + x2) / 2 - 0.5 },
        { translateY: (y1 + y2) / 2 - LINE_THICKNESS / 2 },
        { rotate: `${Math.atan2(dy, dx)}rad` },
        { scaleX: Math.max(Math.sqrt(dx * dx + dy * dy), 0.01) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: 1,
          height: LINE_THICKNESS,
          backgroundColor: LINE_COLOR,
        },
        style,
      ]}
    />
  );
}

interface LayerProps {
  connections: Connection[];
  /**
   * Live card geometry by item id. This MUST be an immutable snapshot: a new
   * Map instance whenever a card registers/unregisters. (Mutating one Map in
   * place made the React Compiler reuse a stale, empty render result after a
   * restart, so lines never appeared.)
   */
  layouts: ReadonlyMap<string, ItemLayout>;
}

function ConnectionLines({ connections, layouts }: LayerProps) {
  return (
    <>
      {connections.map((c) => {
        const a = layouts.get(c.fromId);
        const b = layouts.get(c.toId);
        if (!a || !b) return null;
        return <ConnectionLine key={c.id} a={a} b={b} />;
      })}
    </>
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
          (a.y.value + a.height.value / 2 + b.y.value + b.height.value / 2) /
            2 -
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