// vite.config.js
import {defineConfig} from 'vite';

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
    ],
    esbuild: {
        legalComments: "none",
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        keepNames: false,
    },
    build: {
        minify: 'esbuild',

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