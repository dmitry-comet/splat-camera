// vite.config.mjs
import { defineConfig } from "vite";

import vitePluginBundleObfuscator from "vite-plugin-bundle-obfuscator";
import { dependencies } from "./package.json";

import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getHtmlExcludes() {
	console.log(`${__dirname}`);

	const pagesDir = path.resolve(__dirname, 'src/html');
	const files = fs.readdirSync(pagesDir);
	return files
		.filter(file => file.endsWith('.html'))
		.map((file) => {
			return file.replace('.html', '.js');
		});
}

function getHtmlInputs() {
	console.log(`${__dirname}`);

	const pagesDir = path.resolve(__dirname, 'src/html');
	const files = fs.readdirSync(pagesDir);
	return files
		.filter(file => file.endsWith('.html'))
		.reduce((acc, file) => {
			acc[path.parse(file).name] = path.resolve(pagesDir, file)
			return acc
		}, {});
}

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
			excludes: [
				/babylonjs/,
				/luxon/,
				"babylon.js",
				...getHtmlExcludes()
			],
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
				main: path.resolve(__dirname, 'index.html'),
				...getHtmlInputs()
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
