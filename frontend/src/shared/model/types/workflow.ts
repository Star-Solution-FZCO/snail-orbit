export const workflowTypes = ["on_change", "scheduled"] as const;

export type WorkflowTypeT = (typeof workflowTypes)[number];

export type WorkflowT = {
    id: string;
    name: string;
    description: string | null;
    type: WorkflowTypeT;
    script: string;
    schedule?: string;
};

export type CreateWorkflowT = {
    name: string;
    description: string | null;
    type: WorkflowTypeT;
    script: string;
    schedule?: string | null;
};

export type UpdateWorkflowT = Partial<CreateWorkflowT>;
