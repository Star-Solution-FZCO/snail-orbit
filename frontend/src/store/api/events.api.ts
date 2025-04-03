import { useCallback, useMemo } from "react";
import type { EventType } from "types/events";
import { serializeParams } from "utils/helpers/serialize-params";
import { useSseRequest } from "utils/hooks/use-sse-request";
import { useAppDispatch } from "../hooks";
import { issueApi } from "./issue.api";

type UseEventsSubscriptionParams = {
    ids?: string[];
    project_ids?: string[];
    onMessage?: (message: EventType) => void;
};

export const useEventsSubscription = (params: UseEventsSubscriptionParams) => {
    const url = useMemo(() => {
        const innerParams = {
            ids: params?.ids?.filter(Boolean) || [],
            project_ids: params?.project_ids?.filter(Boolean) || [],
        };
        return `issue?${serializeParams(innerParams)}`;
    }, [params.ids, params.project_ids]);

    return useSseRequest({ url, onMessage: params.onMessage });
};

export const useEventSubscriptionAutoReFetch = (
    params: Omit<UseEventsSubscriptionParams, "onMessage">,
) => {
    const dispatch = useAppDispatch();
    const onMessage = useCallback(
        (message: EventType) => {
            if (message.type === "issue_update") {
                dispatch(
                    issueApi.util.invalidateTags(["Issues", "IssueHistories"]),
                );
            }
        },
        [dispatch],
    );

    useEventsSubscription({ ...params, onMessage });
};
