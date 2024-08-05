import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Layout } from "components";
import { useAppSelector } from "store";

export const Route = createFileRoute("/_authenticated")({
    component: () => {
        const { user } = useAppSelector((state) => state.profile);

        if (!user) {
            return (
                <Navigate
                    to="/login"
                    search={{
                        redirect: location.pathname,
                    }}
                />
            );
        }

        return <Layout />;
    },
});
