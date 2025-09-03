import { createFileRoute } from "@tanstack/react-router";
import { MFAView } from "pages/auth/auth_mfa";

export const Route = createFileRoute("/login_/mfa")({
    component: MFAView,
});
