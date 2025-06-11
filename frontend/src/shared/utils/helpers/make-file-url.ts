import { API_URL, API_VERSION } from "app/config";

export const makeFileUrl = (fileId: string) => {
    return API_URL + API_VERSION + "/files/" + fileId;
};
