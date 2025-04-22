// vite.config.js
import {defineConfig} from 'vite'

import { dependencies } from './package.json';

function renderChunks(deps) {
    let chunks = {};
    Object.keys(deps).forEach((key) => {
        if (['gsplat','@babylonjs/core', '@babylonjs/loaders'].includes(key)) return;
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
    build: {
        lib: {
            entry: './src/scripts/gsplat.ts',
            name: 'Gaussian Splat Camera',
            formats: ['es'],
        },
        rollupOptions: {
            emptyOutDir: false, // you need to delete the output directory outside vite!
            input: {
                main: './src/html/babylon.html',
                babylon: './src/html/babylon.html',
                gsplat: './src/html/gsplat.html',
                gsplatv: './src/html/gsplatv.html',
            },

            output: {
                inlineDynamicImports: false,
                manualChunks: {
                    babylonjs: ['@babylonjs/core', '@babylonjs/loaders'],
                    gsplatjs: ['gsplat'],
                    ...renderChunks(dependencies),
                },
                entryFileNames: `scripts/[name].js`,
                chunkFileNames: `scripts/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },

        },
    },

})