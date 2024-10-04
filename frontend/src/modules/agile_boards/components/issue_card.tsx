import { UniqueIdentifier } from "@dnd-kit/core";
import { Stack, styled } from "@mui/material";
import { Link } from "components/link";
import { FC } from "react";
import { IssueT } from "types";

export type IssueCardProps = {
    issue: IssueT;
    dragOverlay: boolean;
    dragging: boolean;
    sorting: boolean;
    index: number | undefined;
    fadeIn: boolean;
    disabled: boolean;
    id: UniqueIdentifier;
};

const IssueCardStyled = styled("div")(({ theme }) => ({
    padding: theme.spacing(1),
}));

export const IssueCard: FC<IssueCardProps> = ({
    issue: { id_readable, subject },
}) => {
    return (
        <IssueCardStyled>
            <Stack direction="row" spacing={1}>
                <Link to={`"/issues/${id_readable}`}>{id_readable}</Link>
                <span>{subject}</span>
            </Stack>
        </IssueCardStyled>
    );
};
