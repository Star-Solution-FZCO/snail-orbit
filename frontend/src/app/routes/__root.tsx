import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { setUser, useAppDispatch, userApi } from "shared/model";

const Root = () => {
    const dispatch = useAppDispatch();

    const { data: profile } = userApi.useGetProfileQuery();

    useEffect(() => {
        if (profile) {
            dispatch(setUser(profile.payload));
        }
    }, [dispatch, profile]);

    return <Outlet />;
};

export const Route = createRootRoute({
    component: Root,
});
