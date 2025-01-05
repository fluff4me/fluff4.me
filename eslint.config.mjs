import pluginJs from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import 'eslint-plugin-only-warn'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** @import {TSESLint, TSESTree} from "@typescript-eslint/utils" */

/** @param {() => TSESLint.RuleModule} provider */
function rule (provider) {
	return provider()
}

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ files: ['**/*.{js,mjs,cjs,ts}'] },
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,

	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	stylistic.configs.customize({
		indent: 'tab',
		quotes: 'single',
		semi: false,
		jsx: false,
	}),

	{
		rules: {
			'no-constant-binary-expression': 'off',
			'no-empty': ['warn', { allowEmptyCatch: true }],
			'no-constant-condition': ['warn', { checkLoops: false }],
			'prefer-const': ['warn', { destructuring: 'all' }],
			'no-irregular-whitespace': ['warn', { skipRegExps: true }],

			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/consistent-type-imports': 'warn',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '.', varsIgnorePattern: '^[A-Z_]+$' }],
			'@typescript-eslint/no-unsafe-declaration-merging': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-empty-object-type': ['warn', { allowInterfaces: 'always' }],

			'@stylistic/no-trailing-spaces': 'off', // removed by typescript
			'@stylistic/indent': 'off',
			'@stylistic/indent-binary-ops': 'off',
			'@stylistic/multiline-ternary': 'off',
			'@stylistic/spaced-comment': ['warn', 'always', { exceptions: ['/'], markers: ['#region', '#endregion'] }],
			'@stylistic/space-before-function-paren': ['warn', 'always'],
			'@stylistic/quotes': ['warn', 'single'],
			'@stylistic/padded-blocks': ['warn', { blocks: 'never', classes: 'always' }],
			'@stylistic/arrow-parens': ['warn', 'as-needed'],
			'@stylistic/comma-dangle': ['warn', {
				arrays: 'always-multiline',
				objects: 'always-multiline',
				imports: 'always-multiline',
				exports: 'always-multiline',
				functions: 'ignore',
			}],
			'@stylistic/eol-last': ['warn', 'always'],
			'@stylistic/max-statements-per-line': ['warn', {
				ignoredNodes: [
					AST_NODE_TYPES.BreakStatement,
					AST_NODE_TYPES.ExpressionStatement,
					AST_NODE_TYPES.ReturnStatement,
				],
			}],
			'@stylistic/padding-line-between-statements': [
				'warn',
				{ blankLine: 'never', prev: 'block', next: '*' },
			],
		},
	},

	{
		plugins: {
			fluff: {
				rules: {
					'no-unused-expressions': rule(() => {
						const baseRule = tseslint.plugin.rules['no-unused-expressions']
						return {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							meta: {
								...baseRule.meta,
								docs: {
									description: 'Disallow unused expressions',
									extendsBaseRule: true,
									recommended: false,
								},
							},
							/**
							 * @param {Context} context
							 * @returns {TSESLint.RuleListener}
							 */
							create (context, options) {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
								const listeners = baseRule.create(context, options)
								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
								return {
									...listeners,
									ExpressionStatement (node) {
										if (node.expression?.type === AST_NODE_TYPES.SequenceExpression) {
											const expressions = node.expression.expressions
											const last = expressions[expressions.length - 1]
											// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
											return listeners.ExpressionStatement({
												...node,
												expression: last,
											})
										}
										// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
										return listeners.ExpressionStatement(node)
									},
								}
							},
						}
					}),
					'no-blank-lines-in-optional-blocks': rule(() => {
						const messages = {
							blankLineDetected: 'Avoid blank lines between a conditional or loop statement and its single non-block statement.',
						}
						/** @typedef {TSESLint.RuleContext<keyof typeof messages>} Context */
						return {
							meta: {
								type: 'layout',
								docs: {
									description: 'Warn about blank lines between a conditional/loop statement and its single non-block statement.',
									category: 'Stylistic Issues',
									recommended: false,
								},
								fixable: 'whitespace',
								schema: [], // No options for this rule
								messages,
							},
							/** @param {Context} context */
							create (context) {
								return {
									IfStatement (node) {
										checkStatement(context, node, node.consequent)
									},

									WhileStatement (node) {
										checkStatement(context, node, node.body)
									},

									ForStatement (node) {
										checkStatement(context, node, node.body)
									},

									ForInStatement (node) {
										checkStatement(context, node, node.body)
									},

									ForOfStatement (node) {
										checkStatement(context, node, node.body)
									},

									DoWhileStatement (node) {
										checkStatement(context, node, node.body)
									},
								}

								/**
								 * Checks for blank lines between a parent statement and its single statement body.
								 * @param {Context} context - The rule context.
								 * @param {TSESTree.Node} parentNode - The parent node (conditional or loop statement).
								 * @param {TSESTree.Node} childNode - The single non-block statement.
								 */
								function checkStatement (context, parentNode, childNode) {
									if (childNode.type === AST_NODE_TYPES.BlockStatement)
										return

									const lastToken = context.sourceCode.getTokenBefore(childNode)
									if (!lastToken)
										return

									if (lastToken.loc.end.line + 1 >= childNode.loc.start.line)
										return

									const sourceCode = context.sourceCode
									const commentsInRange = sourceCode.getCommentsBefore(childNode)
									if (commentsInRange.length)
										return

									const rangeStart = { line: lastToken.loc.end.line + 1, column: 0 }
									const rangeEnd = { line: childNode.loc.start.line, column: 0 }

									context.report({
										loc: { start: rangeStart, end: rangeEnd },
										messageId: 'blankLineDetected',
										fix (fixer) {
											return fixer.removeRange([
												sourceCode.getIndexFromLoc(rangeStart),
												sourceCode.getIndexFromLoc(rangeEnd),
											])
										},
									})
								}
							},
						}
					}),
				},
			},
		},
		rules: {
			'fluff/no-unused-expressions': 'warn',
			'fluff/no-blank-lines-in-optional-blocks': 'warn',
		},
	},
]
