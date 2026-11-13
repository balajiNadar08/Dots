import type { SharedValue } from "react-native-reanimated";

export interface CanvasItemData {
  id: string;
  title: string;
  imageUri: string;

  x: number;
  y: number;

  width: number;
  height: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export type BackgroundId = "white" | "pink" | "desi" | "grey" | "yellow" ;

export interface ItemLayout {
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: SharedValue<number>;
  height: SharedValue<number>;
}