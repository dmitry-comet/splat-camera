// vite.config.js
import {defineConfig} from 'vite'

import { dependencies } from './package.json';

function renderChunks(deps) {
    let chunks = {};
    Object.keys(deps).forEach((key) => {
        if (['gsplat'].includes(key)) return;
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
            entry: './scripts/gsplat.ts',
            name: 'Gaussian Splat Camera',
            formats: ['es'],
        },
        rollupOptions: {
            emptyOutDir: false, // you need to delete the output directory outside vite!
            input: {
                main: './index.html',
                gsplat: './gsplat/index.html',
            },

            output: {
                inlineDynamicImports: false,
                manualChunks: {
                    gsplat: ['gsplat'],
                    ...renderChunks(dependencies),
                },
                entryFileNames: `scripts/[name].js`,
                chunkFileNames: `scripts/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },

        },
    },

})