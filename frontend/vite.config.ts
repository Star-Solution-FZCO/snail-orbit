import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: "localhost",
        port: 3000,
        open: true,
        https: true,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:9090",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "./build",
    },
    plugins: [react(), tsconfigPaths(), TanStackRouterVite(), basicSsl()],
});
