export function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

export function formatSpentTime(
    seconds: number,
    showHourMinutes: boolean = false,
) {
    if (seconds === 0) return "0s";

    const weekInSeconds = 7 * 24 * 60 * 60;
    const dayInSeconds = 24 * 60 * 60;
    const hourInSeconds = 60 * 60;
    const minuteInSeconds = 60;

    const weeks = Math.floor(seconds / weekInSeconds);
    let remainingSeconds = seconds % weekInSeconds;

    const days = Math.floor(remainingSeconds / dayInSeconds);
    remainingSeconds %= dayInSeconds;

    const hours = Math.floor(remainingSeconds / hourInSeconds);
    remainingSeconds %= hourInSeconds;

    const minutes = Math.floor(remainingSeconds / minuteInSeconds);
    const secs = remainingSeconds % minuteInSeconds;

    let mainFormat = "";

    if (weeks > 0) mainFormat += `${weeks}w `;
    if (days > 0) mainFormat += `${days}d `;
    if (hours > 0) mainFormat += `${hours}h `;
    if (minutes > 0) mainFormat += `${minutes}m `;
    if (secs > 0) mainFormat += `${secs}s`;

    const result = mainFormat.trim();

    if (!showHourMinutes) {
        return result;
    }

    if (seconds < dayInSeconds) {
        return result;
    }

    const totalHours = Math.floor(seconds / hourInSeconds);
    const totalMinutes = Math.floor(
        (seconds % hourInSeconds) / minuteInSeconds,
    );

    let hourMinuteFormat = "";
    if (totalHours > 0) {
        hourMinuteFormat += `${totalHours}h `;
    }
    if (totalMinutes > 0) {
        hourMinuteFormat += `${totalMinutes.toString().padStart(2, "0")}m`;
    } else if (totalHours > 0) {
        hourMinuteFormat += "00m";
    }

    hourMinuteFormat = hourMinuteFormat.trim();

    return `${hourMinuteFormat} - ${result}`;
}
