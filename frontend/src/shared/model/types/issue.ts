import type {
    FavoriteFilterOutput,
    IssueAttachmentBody,
    IssueAttachmentOut,
    IssueChangeOutputRootModel,
    IssueCreate,
    IssueDraftOutput,
    IssueFeedRecordOutput,
    IssueFieldChangeOutputRootModel,
    IssueHistoryOutput,
    IssueInterlinkTypeT,
    IssueLinkFieldOutput,
    IssueOutput,
    IssuePermissionOutput,
    IssueSpentTimeOutput,
} from "./backend-schema.gen";
import { issueInterlinkTypeTValues } from "./backend-schema.gen";
import type { ProjectT } from "./project";

export type IssueProjectT = Pick<ProjectT, "id" | "name" | "slug">;

export type IssueFavoriteFilter = FavoriteFilterOutput;

export type CreateIssueT = IssueCreate;
export type IssueT = IssueOutput;
export type IssueDraftT = IssueDraftOutput;

export type IssueWithErrorsT = IssueT & {
    error_fields?: Record<string, string>;
};

export type IssueHistoryT = IssueHistoryOutput;

export type IssueAttachmentBodyT = IssueAttachmentBody;
export type IssueAttachmentT = IssueAttachmentOut;

export type IssueChangeT = IssueChangeOutputRootModel;
export type IssueFieldChangeT = IssueFieldChangeOutputRootModel;

export type IssueActivityTypeT = "comment" | "spent_time" | "history";

export type IssueLinkFieldT = IssueLinkFieldOutput;

export const linkTypes = issueInterlinkTypeTValues;

export type IssueLinkTypeT = IssueInterlinkTypeT;

export type IssueLinkT = {
    id: string;
    issue: IssueLinkFieldT;
    type: IssueLinkTypeT;
};

export type IssueSpentTimeT = IssueSpentTimeOutput;

export type IssueFeedRecordT = IssueFeedRecordOutput;

export type IssuePermissionT = IssuePermissionOutput;
