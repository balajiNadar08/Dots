import type { ImageSourcePropType } from "react-native";
import type { BackgroundId } from "../types/canvas";

export interface BackgroundOption {
  id: BackgroundId;
  label: string;
  source: ImageSourcePropType;
}

export const DEFAULT_BACKGROUND_ID: BackgroundId = "white";

export const BACKGROUNDS: BackgroundOption[] = [
  {
    id: "white",
    label: "White dotted grid",
    source: require("../assets/images/dot_bg_2.jpg"),
  },
  {
    id: "pink",
    label: "Pink dotted grid",
    source: require("../assets/images/dot_bg_pink.jpg"),
  },
  {
    id: "grey",
    label: "Grey dotted grid",
    source: require("../assets/images/dot_bg_grey.jpg"),
  },

  {
    id: "yellow",
    label: "Yellow dotted grid",
    source: require("../assets/images/dot_bg_yellow.jpg"),
  },
];

export const getBackgroundSource = (id: BackgroundId): ImageSourcePropType =>
  (BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]).source;
