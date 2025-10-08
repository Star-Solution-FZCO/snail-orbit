(function (window) {
    window["env"] = window["env"] || {};

    window["env"]["API_URL"] = "${API_URL}";
    window["env"]["EVENTS_URL"] = "${EVENTS_URL}";
    window["env"]["APP_VERSION"] = "${APP_VERSION}";
    window["env"]["ENVIRONMENT"] = "${ENVIRONMENT}";
    window["env"]["SENTRY_DSN"] = "${SENTRY_DSN}";
    window["env"]["SENTRY_ENVIRONMENT"] = "${SENTRY_ENVIRONMENT}";
    window["env"]["FAVICON_URL"] = "${FAVICON_URL}";
    window["env"]["APP_TITLE"] = "${APP_TITLE}";
    window["env"]["APP_TITLE_PREFIX"] = "${APP_TITLE_PREFIX}";
})(this);
