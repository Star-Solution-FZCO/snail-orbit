import { getRouteApi } from "@tanstack/react-router";
import { FC } from "react";
import { issueApi } from "store";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

export const IssueView: FC = () => {
    const { issueId } = routeApi.useParams();

    const { data } = issueApi.useGetIssuesQuery(issueId);

    console.log(data);

    return <div>Test</div>;
};

export default IssueView;
