export type PingEventType = {
    type: "ping";
};

export type IssueUpdateEventType = {
    type: "issue_update";
    data: { issue_id: string };
};

export type EventType = PingEventType | IssueUpdateEventType;
