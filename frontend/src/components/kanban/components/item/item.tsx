import { CSSProperties, forwardRef, memo, useEffect } from "react";
import { ItemContainer, ItemStyled } from "./Item.styles";
import { ItemProps } from "./item.types";

const Item = memo(
    forwardRef<HTMLLIElement, ItemProps>(
        (
            {
                dragOverlay,
                dragging,
                disabled,
                fadeIn,
                index,
                listeners,
                renderItemContent,
                sorting,
                style,
                transition,
                transform,
                id,
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
                        } as CSSProperties
                    }
                    ref={ref}
                >
                    <ItemStyled
                        dragging={dragging}
                        dragOverlay={dragOverlay}
                        disabled={disabled}
                        style={style}
                        {...listeners}
                        {...props}
                        tabIndex={0}
                    >
                        {renderItemContent
                            ? renderItemContent({
                                  dragging: !!dragging,
                                  dragOverlay: !!dragOverlay,
                                  disabled: !!disabled,
                                  index,
                                  fadeIn: !!fadeIn,
                                  sorting: !!sorting,
                                  id,
                                  ...props,
                              })
                            : id}
                    </ItemStyled>
                </ItemContainer>
            );
        },
    ),
);

export default Item;
