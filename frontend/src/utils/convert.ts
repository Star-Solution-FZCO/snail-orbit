export function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

export function formatSpentTime(seconds: number) {
    if (seconds === 0) return "0s";

    const weekInSeconds = 5 * 8 * 60 * 60;
    const dayInSeconds = 8 * 60 * 60;
    const hourInSeconds = 60 * 60;
    const minuteInSeconds = 60;

    const weeks = Math.floor(seconds / weekInSeconds);
    seconds %= weekInSeconds;

    const days = Math.floor(seconds / dayInSeconds);
    seconds %= dayInSeconds;

    const hours = Math.floor(seconds / hourInSeconds);
    seconds %= hourInSeconds;

    const minutes = Math.floor(seconds / minuteInSeconds);
    const secs = seconds % minuteInSeconds;

    let result = "";
    if (weeks > 0) result += `${weeks}w `;
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0) result += `${secs}s`;

    return result.trim();
}
