import { ItemType } from "./item/item.types";
import { LaneProps } from "./lane/lane.types";

export type LaneMetadata = {
    items: ItemType[];
} & Omit<LaneProps, "children">;
