export const downloadFileToVariable = async (url: string): Promise<Blob> =>
    new Promise((resolve, reject) => {
        fetch(url)
            .then((res) => res.blob())
            .then(resolve)
            .catch(reject);
    });
