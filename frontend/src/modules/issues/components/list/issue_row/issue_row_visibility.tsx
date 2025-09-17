import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Tooltip } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { IssueT } from "shared/model/types";

export const IssueRowVisibility: FC<{ permissions: IssueT["permissions"] }> = ({
    permissions,
}) => {
    const { t } = useTranslation();

    return (
        <Tooltip
            title={t("issues.visibleTo", {
                targets: permissions.map((p) => p.target.name).join(", "),
            })}
            placement="bottom-start"
        >
            <LockOutlinedIcon fontSize="inherit" color="disabled" />
        </Tooltip>
    );
};
