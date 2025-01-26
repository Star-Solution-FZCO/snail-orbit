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
};
