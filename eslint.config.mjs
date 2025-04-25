import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import parserTs from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import stylisticTs from "@stylistic/eslint-plugin-ts";

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,ts}"],
		plugins: { js, "@stylistic/ts": stylisticTs },
		extends: ["js/recommended"],
		languageOptions: {
			parser: parserTs
		}
	},
	{
		files: ["**/*.{js,mjs,cjs,ts}"],
		languageOptions: { globals: globals.browser },
		rules: {
			"@stylistic/ts/indent": ["error", 2],
			"@stylistic/js/no-tabs": ["error", { allowIndentationTabs: true }]
		}
	},
	tseslint.configs.recommended,

	eslintPluginPrettierRecommended,
	prettierConfig
]);
