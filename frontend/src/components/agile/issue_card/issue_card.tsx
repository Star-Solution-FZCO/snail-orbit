import { CSSProperties, FC } from "react";
import { IssueCardStyled } from "./issue_card.styles";
import { IssueCardProps } from "./issue_card.types";

const getGradientString = (colors?: string[]) => {
    if (!colors || !colors.length) return "";
    if (colors.length === 1)
        return `linear-gradient(to bottom, ${colors[0]}, ${colors[0]})`;
    const percent = Math.floor(100 / colors.length);
    const parts: string[] = colors.flatMap((color, idx, arr) => {
        if (idx === 0) return [`${color} ${percent}%`];
        if (idx === arr.length - 1) return [`${color} ${100 - percent}%`];
        return [
            `${color} ${idx * percent}%`,
            `${color} ${(idx + 1) * percent}%`,
        ];
    });

    return `linear-gradient(to bottom, ${parts.join(",")})`;
};

export const IssueCard: FC<IssueCardProps> = (props) => {
    return (
        <IssueCardStyled
            {...props}
            style={
                {
                    ...props.style,
                    "--colors": getGradientString(props.colors),
                } as CSSProperties
            }
        />
    );
};

export default IssueCard;
