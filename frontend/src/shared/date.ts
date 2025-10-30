import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(updateLocale);

const sundayStartLocales = [
    "en_US",
    "en_CA",
    "es_MX",
    "pt_BR",
    "es_AR",
    "es_CL",
    "es_CO",
    "es_PE",
    "es_VE",
    "en_PH",
    "fil_PH",
    "zh_HK",
    "en_HK",
    "zh_TW",
    "ms_MY",
    "ja_JP",
    "ko_KR",
    "he_IL",
    "en_AU",
    "en_NZ",
    "en_SG",
];

const getWeekStartFromLocale = (locale: string): 0 | 1 => {
    const normalizedLocale = locale.toLowerCase();
    return sundayStartLocales.includes(normalizedLocale) ? 0 : 1;
};

const browserLocale = navigator.language || "en-gb";
export const weekStart = getWeekStartFromLocale(browserLocale);

dayjs.updateLocale(dayjs.locale(), {
    weekStart,
});

export default dayjs;
