export type WorkflowTypeT = "on_change" | "scheduleed";

export type WorkflowT = {
    id: string;
    name: string;
    description: string | null;
    type: WorkflowTypeT;
    schedule?: string;
};
