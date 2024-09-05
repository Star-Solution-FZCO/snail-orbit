import { UniqueIdentifier } from "@dnd-kit/core";
import { PropsWithChildren } from "react";

export type LaneProps = {
    id: UniqueIdentifier;
    title: string;
} & PropsWithChildren;
