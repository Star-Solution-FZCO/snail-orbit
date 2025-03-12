import { createFileRoute } from "@tanstack/react-router";
import { MFAView } from "modules";

export const Route = createFileRoute("/login_/mfa")({
    component: MFAView,
});
