import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import externals from "rollup-plugin-node-externals";
import strip from "@rollup/plugin-strip";
import replace from "@rollup/plugin-replace";
import * as pkg from "./package.json";

export default defineConfig({
    input: "./src/index.ts",
    output: [
        {
            file: pkg.main,
            format: "umd",
            sourcemap: true,
            name: pkg.name,
            globals: {
                "socket.io-client": "socket_ioClient",
                "lodash": "_"
            }
        },
        {
            file: pkg.module,
            format: "esm",
            sourcemap: true,
            globals: {
                "socket.io-client": "socket_ioClient",
                "lodash": "_"
            }
        },
    ],
    plugins: [
        json(),
        resolve(),
        commonjs({
            sourceMap: true
        }),
        typescript({
            sourceMap: true,
        }),
        externals({
            devDeps: false,
        }),
        replace({
            preventAssignment: true,
            __PROTOCOL_VERSION__: JSON.stringify("poco-0.1")
        })
    ],
    watch: {
        exclude: "node_modules/**",
    },
});