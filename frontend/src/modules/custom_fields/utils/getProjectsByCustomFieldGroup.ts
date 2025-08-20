import { CustomFieldGroupT } from "shared/model/types";

export function getProjectsByCustomFieldGroup(
    fields: CustomFieldGroupT["fields"],
): CustomFieldGroupT["fields"][number]["projects"] {
    return Array.from(
        new Map(
            fields
                .map((f) => f.projects)
                .flat()
                .map((p) => [p.id, p]),
        ).values(),
    );
}
