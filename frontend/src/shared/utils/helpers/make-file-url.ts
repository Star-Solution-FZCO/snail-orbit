import { API_URL, apiVersion } from "app/config";

export const makeFileUrl = (fileId: string) => {
    return API_URL + apiVersion + "/files/" + fileId;
};
