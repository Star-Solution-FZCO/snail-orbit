export type IssuesActivitiesSettings = {
    displayComments?: boolean;
    displayingActivities?: boolean;
    sortOrder?: "oldestFirst" | "newestFirst";
};

export const issuesActivitiesSettingsDefaultValues: IssuesActivitiesSettings = {
    displayComments: true,
    displayingActivities: true,
    sortOrder: "oldestFirst",
};
