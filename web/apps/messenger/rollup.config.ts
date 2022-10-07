import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import externals from "rollup-plugin-node-externals";
import strip from "@rollup/plugin-strip";

export default defineConfig({
    input: "./src/index.ts",
    output: [
        {
            file: "dist/bundle.cjs",
            format: "umd",
            sourcemap: true,
            name: "messenger"
        },
        {
            file: "dist/bundle.mjs",
            format: "esm",
            sourcemap: true
        },
    ],
    plugins: [
        json(),
        externals({
            devDeps: false,
        }),
        resolve(),
        commonjs(),
        typescript(),
        strip(),
    ],
    watch: {
        exclude: "node_modules/**",
    },
});