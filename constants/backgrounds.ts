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
    source: require("../assets/images/dot_bg_2.webp"),
  },
  {
    id: "pink",
    label: "Pink heart grid",
    source: require("../assets/images/dot_bg_pink4.webp"),
  },
  {
    id: "desi",
    label: "Desi",
    source: require("../assets/images/desi.webp"),
  },
  {
    id: "yellow",
    label: "Yellow plus grid",
    source: require("../assets/images/dot_bg_yellow2.webp"),
  },
  {
    id: "grey",
    label: "Grey slash grid",
    source: require("../assets/images/dot_bg_grey2.webp"),
  },
];

export const getBackgroundSource = (id: BackgroundId): ImageSourcePropType =>
  (BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]).source;
