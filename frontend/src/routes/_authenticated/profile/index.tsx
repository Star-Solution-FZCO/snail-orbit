import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "modules";

type ProfileViewSearch = {
    tab?: string;
};

export const Route = createFileRoute("/_authenticated/profile/")({
    component: ProfileView,
    validateSearch: (search: Record<string, unknown>): ProfileViewSearch => {
        return search as ProfileViewSearch;
    },
});
