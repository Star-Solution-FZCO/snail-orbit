import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "modules";

type ProfileViewSearch = {
    tab?: string;
};

export const Route = createFileRoute("/_authenticated/profile/")({
    component: Component,
    validateSearch: (search: Record<string, unknown>): ProfileViewSearch => {
        return search as ProfileViewSearch;
    },
});

function Component() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();

    const handleTabChange = (tab: string) => {
        navigate({ search: { ...search, tab } });
    };

    return <ProfileView tab={search.tab} onTabChange={handleTabChange} />;
}
