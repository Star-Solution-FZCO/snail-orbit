import type {
    IssueCreate,
    IssueAttachmentBody,
    IssueAttachmentOut,
    IssueChangeOutputRootModel,
    IssueDraftOutput,
    IssueFeedRecordOutput,
    IssueFieldChangeOutputRootModel,
    IssueHistoryOutput,
    IssueInterlinkTypeT,
    IssueLinkFieldOutput,
    IssueOutput,
    IssueSpentTimeOutput,
} from "./backend-schema.gen";
import { issueInterlinkTypeTValues } from "./backend-schema.gen";
import type { ProjectT } from "./project";

export type IssueProjectT = Pick<ProjectT, "id" | "name" | "slug">;

export type CreateIssueT = IssueCreate;
export type IssueT = IssueOutput;
export type IssueDraftT = IssueDraftOutput;

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
