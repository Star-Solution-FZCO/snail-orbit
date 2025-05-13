export const readFile = (file: File): Promise<ArrayBuffer> =>
    new Promise((res, rej) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            if (event.target?.result) res(event.target.result as ArrayBuffer);
            else rej();
        };
        fileReader.readAsArrayBuffer(file);
    });
