export const downloadBlob = (content: Blob, filename: string) => {
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const downloadTextFile = (
    content: string,
    filename: string,
    mimeType = "text/plain",
) => {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
};
