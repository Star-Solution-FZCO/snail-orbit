import GroupIcon from "@mui/icons-material/Group";
import { AvatarAdornment } from "../../shared/ui/fields/adornments/avatar_adornment";
import type { BasicUserT, GroupT } from "../../shared/model/types";

export type ValueType = BasicUserT | GroupT;

export const isUser = (value: ValueType): value is BasicUserT =>
    "email" in value;

export const getRightAdornment = (value: ValueType) =>
    value ? (
        isUser(value) ? (
            <AvatarAdornment src={value.avatar} />
        ) : (
            <GroupIcon fontSize="medium" sx={{ width: 26, height: 26 }} />
        )
    ) : undefined;
