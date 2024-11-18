export function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

export function formatPeriodInSeconds(seconds: number) {
    if (seconds === 0) return "0s";
    const units = [
        { label: "d", value: 86400 },
        { label: "h", value: 3600 },
        { label: "m", value: 60 },
        { label: "s", value: 1 },
    ];
    const result = [];
    for (const unit of units) {
        const amount = Math.floor(seconds / unit.value);
        if (amount > 0) {
            result.push(`${amount}${unit.label}`);
            seconds -= amount * unit.value;
        }
    }
    return result.join(" ");
}
