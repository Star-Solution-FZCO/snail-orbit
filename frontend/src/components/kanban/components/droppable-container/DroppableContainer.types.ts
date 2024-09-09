import { UniqueIdentifier } from "@dnd-kit/core";
import { CSSProperties } from "react";
import { ContainerProps } from "../container";

export type DroppableContainerProps = {
    disabled?: boolean;
    id: UniqueIdentifier;
    items: UniqueIdentifier[];
    style?: CSSProperties;
} & ContainerProps;
