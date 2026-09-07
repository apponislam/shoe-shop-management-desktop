import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["electron/main.ts", "electron/preload.ts"],
    outDir: "dist-electron",
    format: ["cjs"],
    external: ["electron"],
    noExternal: ["@prisma/client", "@prisma/adapter-better-sqlite3"],
    clean: false,
});
