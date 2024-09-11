import { UniqueIdentifier } from "@dnd-kit/core";
import { CSSProperties } from "react";
import { SwimLineProps } from "../swim-line";

export type DroppableSwimLineProps = {
    disabled?: boolean;
    id: UniqueIdentifier;
    items: UniqueIdentifier[];
    style?: CSSProperties;
} & SwimLineProps;
