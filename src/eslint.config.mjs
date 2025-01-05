import eslintConfig from "../eslint.config.mjs";

/** @type {import('eslint').Linter.Config[]} */
export default [
	...eslintConfig,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	}
]
