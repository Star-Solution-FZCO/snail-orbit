const workflowTypes = ["on_change", "scheduled"] as const;

export type WorkflowTypeT = (typeof workflowTypes)[number];

export type WorkflowT = {
    id: string;
    name: string;
    description: string | null;
    type: WorkflowTypeT;
    schedule?: string;
};
