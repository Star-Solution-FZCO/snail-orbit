const LAST_VIEW_KEY = "LAST_VIEW_BOARD";

export const setLastViewBoardId = (id: string) => {
    localStorage.setItem(LAST_VIEW_KEY, id);
};

export const getLastViewBoardId = () => {
    return localStorage.getItem(LAST_VIEW_KEY);
};
