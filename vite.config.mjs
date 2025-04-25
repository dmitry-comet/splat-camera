// vite.config.mjs
import { defineConfig } from "vite";

import vitePluginBundleObfuscator from "vite-plugin-bundle-obfuscator";
import { dependencies } from "./package.json";

function renderChunks(deps) {
	const chunks = {};
	Object.keys(deps).forEach((key) => {
		if (["@babylonjs/core", "@babylonjs/loaders", "luxon"].includes(key)) return;
		chunks[key] = [key];
	});
	return chunks;
}

import mkcert from "vite-plugin-mkcert";

export default defineConfig({
	esbuild: {
		minifySyntax: true,
		minifyIdentifiers: true,
		minifyWhitespace: true
	},
	plugins: [
		mkcert(),
		vitePluginBundleObfuscator({
			excludes: [/babylonjs/, /luxon/, /lq.js/, /hq.js/],
			enable: true,
			log: true,
			autoExcludeNodeModules: true,
			threadPool: { enable: true, size: 10 },
			options: {
				compact: true,
				controlFlowFlattening: true,
				controlFlowFlatteningThreshold: 1,
				deadCodeInjection: false,
				debugProtection: true,
				debugProtectionInterval: 0,
				disableConsoleOutput: true,
				identifierNamesGenerator: "hexadecimal",
				log: false,
				numbersToExpressions: true,
				renameProperties: false,
				renameGlobals: true,
				selfDefending: true,
				simplify: true,
				splitStrings: false,
				ignoreImports: true,
				stringArray: true,
				stringArrayCallsTransform: true,
				stringArrayCallsTransformThreshold: 0.5,
				stringArrayEncoding: [],
				stringArrayIndexShift: true,
				stringArrayRotate: true,
				stringArrayShuffle: true,
				stringArrayWrappersCount: 1,
				stringArrayWrappersChainedCalls: true,
				stringArrayWrappersParametersMaxCount: 2,
				stringArrayWrappersType: "variable",
				stringArrayThreshold: 0.75,
				unicodeEscapeSequence: false
			}
		})
	],
	build: {
		minify: "esbuild",
		rollupOptions: {
			input: {
				main: "./index.html",
				lq: "./src/html/lq.html",
				hq: "./src/html/hq.html"
			},
			output: {
				compact: true,
				minifyInternalExports: true,
				inlineDynamicImports: false,
				manualChunks: {
					babylonjs: ["@babylonjs/core", "@babylonjs/loaders"],
					luxon: ["luxon"],
					...renderChunks(dependencies)
				},
				entryFileNames: `scripts/[name].js`,
				chunkFileNames: `scripts/[name].js`,
				assetFileNames: `assets/[name].[ext]`
			}
		}
	}
});
