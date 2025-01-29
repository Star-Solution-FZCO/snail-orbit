export const Routes = {
    agileBoards: {
        index() {
            return "/agiles";
        },
        board(id: string) {
            return `${Routes.agileBoards.index()}/${id}`;
        },
        create() {
            return `${Routes.agileBoards.index()}/create`;
        },
        list() {
            return `${Routes.agileBoards.index()}/list`;
        },
    },
    issues: {
        index() {
            return `/issues`;
        },
        issue(id: string, subject?: string) {
            let url = `${Routes.issues.index()}/${id}`;
            if (subject) url += `/${subject}`;
            return url;
        },
    },
};
