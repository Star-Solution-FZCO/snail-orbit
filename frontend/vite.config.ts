import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, splitVendorChunkPlugin, type PluginOption } from "vite";
import unusedCode from "vite-plugin-unused-code";
import tsconfigPaths from "vite-tsconfig-paths";

const oneYear = 60 * 60 * 24 * 365;

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: "localhost",
        port: 3000,
        open: true,
        headers: {
            "Strict-Transport-Security": `max-age=${oneYear}; includeSubDomains; preload`,
        },
        proxy: {
            "/api": {
                target: "http://127.0.0.1:9090",
                changeOrigin: true,
                // for local oauth
                configure: (proxy) => {
                    proxy.on("proxyReq", (proxyReq) => {
                        proxyReq.setHeader("Host", "localhost:3000");
                        proxyReq.setHeader("X-Forwarded-Proto", "https");
                    });
                },
            },
        },
    },
    build: {
        outDir: "./build",
    },
    plugins: [
        react(),
        tsconfigPaths(),
        TanStackRouterVite(),
        basicSsl(),
        visualizer() as PluginOption,
        unusedCode({
            patterns: ["src/**/*.*"],
            exclude: ["**/index.ts", "src/vite-env.d.ts", "src/types/*.*"],
        }),
        splitVendorChunkPlugin(),
    ],
});
