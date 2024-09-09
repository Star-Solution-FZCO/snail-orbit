import { CSSProperties, forwardRef, memo, useEffect } from "react";
import { ItemContainer, ItemStyled } from "./Item.styles";
import { ItemProps } from "./item.types";

// TODO: Add sx support
const Item = memo(
    forwardRef<HTMLLIElement, ItemProps>(
        (
            {
                color,
                dragOverlay,
                dragging,
                disabled,
                fadeIn,
                height,
                index,
                listeners,
                renderItem,
                sorting,
                style,
                transition,
                transform,
                value,
                wrapperStyle,
                ...props
            },
            ref,
        ) => {
            useEffect(() => {
                if (!dragOverlay) {
                    return;
                }

                document.body.style.cursor = "grabbing";

                return () => {
                    document.body.style.cursor = "";
                };
            }, [dragOverlay]);

            if (renderItem)
                return renderItem({
                    dragOverlay: !!dragOverlay,
                    dragging: !!dragging,
                    sorting: !!sorting,
                    index,
                    fadeIn: !!fadeIn,
                    listeners,
                    ref,
                    style,
                    transform,
                    transition,
                    value,
                });

            return (
                <ItemContainer
                    fadeIn={fadeIn}
                    dragOverlay={dragOverlay}
                    style={
                        {
                            ...wrapperStyle,
                            transition: [transition, wrapperStyle?.transition]
                                .filter(Boolean)
                                .join(", "),
                            "--translate-x": transform
                                ? `${Math.round(transform.x)}px`
                                : undefined,
                            "--translate-y": transform
                                ? `${Math.round(transform.y)}px`
                                : undefined,
                            "--scale-x": transform?.scaleX
                                ? `${transform.scaleX}`
                                : undefined,
                            "--scale-y": transform?.scaleY
                                ? `${transform.scaleY}`
                                : undefined,
                            "--index": index,
                            "--color": color,
                        } as CSSProperties
                    }
                    ref={ref}
                >
                    <ItemStyled
                        dragging={dragging}
                        dragOverlay={dragOverlay}
                        disabled={disabled}
                        useColor={!!color}
                        style={style}
                        {...listeners}
                        {...props}
                        tabIndex={0}
                    >
                        {value}
                    </ItemStyled>
                </ItemContainer>
            );
        },
    ),
);

export default Item;
