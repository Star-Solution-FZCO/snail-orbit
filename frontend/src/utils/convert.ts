import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

export function formatSpentTime(seconds: number) {
    if (seconds === 0) return "0s";

    const dur = dayjs.duration(seconds, "seconds");

    const weeks = Math.floor(dur.asWeeks());
    const days = dur.days();
    const hours = dur.hours();
    const minutes = dur.minutes();
    const secs = dur.seconds();

    let result = "";
    if (weeks > 0) result += `${weeks}w `;
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0) result += `${secs}s`;

    return result.trim();
}
