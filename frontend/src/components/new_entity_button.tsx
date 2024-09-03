import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Link } from "./link";

const pathEntityMap: Record<
    string,
    {
        path: string;
        label: string;
    }
> = {
    issues: {
        path: "/issues/create",
        label: "issues.new",
    },
    agiles: {
        path: "/agiles/create",
        label: "agileBoards.new",
    },
    projects: {
        path: "/projects/create",
        label: "projects.new",
    },
    "custom-fields": {
        path: "/custom-fields/create",
        label: "customFields.new",
    },
    groups: {
        path: "/groups/create",
        label: "groups.new",
    },
    roles: {
        path: "/roles/create",
        label: "roles.new",
    },
};

const NewEntityButton = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const currentPath = location.pathname.split("/")[1];
    const entity = pathEntityMap[currentPath];

    if (!entity) {
        return null;
    }

    return (
        <Link to={entity.path}>
            <Button startIcon={<AddIcon />} variant="contained" size="small">
                {t(entity.label)}
            </Button>
        </Link>
    );
};

export { NewEntityButton };
