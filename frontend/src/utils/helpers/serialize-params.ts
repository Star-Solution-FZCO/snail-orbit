type ValueType = string | number | boolean;

export const serializeParams = (
    params: Record<string, ValueType | ValueType[]>,
) => {
    let res = "";
    for (const key in params) {
        if (Array.isArray(params[key])) {
            for (const val of params[key]) {
                if (res != "") {
                    res += "&";
                }
                res += key + "=" + encodeURIComponent(val);
            }
        } else if (params[key] !== undefined) {
            if (res != "") {
                res += "&";
            }
            res += key + "=" + encodeURIComponent(params[key]);
        }
    }
    return res;
};
