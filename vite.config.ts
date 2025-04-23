// vite.config.js
import {defineConfig} from 'vite';
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";
import {dependencies} from './package.json';

function renderChunks(deps: any) {
    let chunks: any = {};
    Object.keys(deps).forEach((key) => {
        if (['gsplat', '@babylonjs/core', '@babylonjs/loaders', 'luxon'].includes(key)) return;
        chunks[key] = [key];
    });
    return chunks;
}

// must be served with ssl for xr to be active
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
    plugins: [
        mkcert(),
        obfuscatorPlugin({
            // include: ["**/*.ts","**/*.js"],
            exclude: [/node_modules/, /polyfill/],
            debugger: true,
            options: {
                compact: true,
                controlFlowFlattening: false,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: false,
                debugProtectionInterval: 0,
                disableConsoleOutput: true,
                domainLock: [],
                domainLockRedirectUrl: 'about:blank',
                forceTransformStrings: [],
                identifierNamesCache: {},
                identifierNamesGenerator: 'hexadecimal',
                identifiersDictionary: [],
                identifiersPrefix: 'pfx',
                ignoreImports: false,
                inputFileName: '',
                log: false,
                numbersToExpressions: false,
                optionsPreset: 'default',
                renameGlobals: true,
                renameProperties: true,
                renamePropertiesMode: 'safe',
                reservedNames: ['displayLoadingUI', 'hideLoadingUI', 'meshes', 'scaling', 'FromEulerVector', 'CreatePlane'],
                reservedStrings: [],
                seed: 0,
                selfDefending: true,
                simplify: false,
                sourceMap: false,
                sourceMapBaseUrl: '',
                sourceMapFileName: '',
                sourceMapMode: 'separate',
                sourceMapSourcesMode: 'sources-content',
                splitStrings: false,
                splitStringsChunkLength: 10,
                stringArray: true,
                stringArrayCallsTransform: true,
                stringArrayCallsTransformThreshold: 0.5,
                stringArrayEncoding: [],
                stringArrayIndexesType: [
                    'hexadecimal-number'
                ],
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 1,
                stringArrayWrappersChainedCalls: true,
                stringArrayWrappersParametersMaxCount: 2,
                stringArrayWrappersType: 'variable',
                stringArrayThreshold: 0.75,
                target: 'browser',
                transformObjectKeys: true,
                unicodeEscapeSequence: true
            },
        }),
    ],
    esbuild: {
        legalComments: "none",
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        keepNames: false,
    },
    build: {
        minify: 'terser',

        terserOptions: {
            compress: true,
            mangle: true,
            keep_classnames: false,
        },

        rollupOptions: {
            input: {
                main: './index.html',
                babylon: './src/html/babylon.html',
                gsplat: './src/html/gsplat.html',
                gsplatv: './src/html/gsplatv.html',
            }
            ,
            output: {
                compact: true,
                minifyInternalExports: true,
                inlineDynamicImports: false,
                manualChunks: {
                    babylonjs: ['@babylonjs/core', '@babylonjs/loaders'],
                    gsplatjs: ['gsplat'],
                    luxon: ['luxon'],
                    ...renderChunks(dependencies),
                },
                entryFileNames: `scripts/[name].js`,
                chunkFileNames: `scripts/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },
        },
    },

})