import quilt from 'lang/en-nz'
import Session from 'model/Session'
import { baseKeymap, lift, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { buildInputRules, buildKeymap } from 'prosemirror-example-setup'
import { gapCursor } from 'prosemirror-gapcursor'
import { history, redo, undo } from 'prosemirror-history'
import { InputRule, inputRules } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import type { ParseSpec } from 'prosemirror-markdown'
import { schema as baseSchema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown'
import type { Attrs, MarkSpec, MarkType, NodeSpec, NodeType } from 'prosemirror-model'
import { Fragment, Node, NodeRange, ResolvedPos, Schema } from 'prosemirror-model'
import { wrapInList } from 'prosemirror-schema-list'
import type { Command, PluginSpec, PluginView } from 'prosemirror-state'
import { EditorState, Plugin } from 'prosemirror-state'
import { findWrapping, liftTarget, Transform } from 'prosemirror-transform'
import { EditorView } from 'prosemirror-view'
import Announcer from 'ui/Announcer'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Checkbutton from 'ui/component/core/Checkbutton'
import Dialog from 'ui/component/core/Dialog'
import type { InputExtensions, InvalidMessageText } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import type Label from 'ui/component/core/Label'
import Popover from 'ui/component/core/Popover'
import RadioButton from 'ui/component/core/RadioButton'
import Slot from 'ui/component/core/Slot'
import type { Quilt } from 'ui/utility/StringApplicator'
import StringApplicator from 'ui/utility/StringApplicator'
import Viewport from 'ui/utility/Viewport'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import Arrays from 'utility/Arrays'
import Define from 'utility/Define'
import Objects from 'utility/Objects'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Store from 'utility/Store'
import Markdown from 'utility/string/Markdown'
import type MarkdownItHTML from 'utility/string/MarkdownItHTML'
import type Strings from 'utility/string/Strings'
import Time from 'utility/Time'
import type { PartialRecord } from 'utility/Type'
import w3cKeyname from 'w3c-keyname'

type NodeViewDesc = Exclude<ReturnType<Exclude<(globalThis.Node)['pmViewDesc'], undefined>['nearestDesc']>, undefined>

function vars (...params: any[]): void { }
function types<A extends any[]> (): void { }

////////////////////////////////////
//#region Module Augmentation

const baseKeyName = w3cKeyname.keyName
w3cKeyname.keyName = (event: Event) => {
	const keyboardEvent = event as KeyboardEvent
	if (keyboardEvent.code.startsWith('Numpad') && !keyboardEvent.shiftKey && (keyboardEvent.ctrlKey || keyboardEvent.altKey)) {
		Object.defineProperty(event, 'shiftKey', { value: true })
		const str = keyboardEvent.code.slice(6)
		if (str === 'Decimal')
			return '.'

		if (!isNaN(+str))
			return str
	}

	return baseKeyName(event)
}

////////////////////////////////////
//#region ProseMirror

declare module 'prosemirror-model' {
	interface ResolvedPos {
		closest (node: NodeType, startingAtDepth?: number): Node | undefined
		closest (node: NodeType, attrs?: Attrs, startingAtDepth?: number): Node | undefined
	}
	interface Node {
		matches (type?: NodeType, attrs?: Attrs): boolean
		hasAttrs (attrs: Attrs): boolean
		pos (document: Node): number | undefined
		range (document: Node): NodeRange | undefined
		parent (document: Node): Node | undefined
		depth (document: Node): number | undefined
	}
	interface Fragment {
		pos (document: Node): number | undefined
		range (document: Node): NodeRange | undefined
		parent (document: Node): Node | undefined
	}
}

Define(ResolvedPos.prototype, 'closest', function (node, attrsOrStartingAtDepth, startingAtDepth) {
	if (typeof attrsOrStartingAtDepth === 'number') {
		startingAtDepth = attrsOrStartingAtDepth
		attrsOrStartingAtDepth = undefined
	}

	const attrs = attrsOrStartingAtDepth

	startingAtDepth ??= this.depth
	for (let depth = startingAtDepth; depth >= 0; depth--) {
		const current = this.node(depth)
		if (current.type === node && (!attrs || current.hasAttrs(attrs)))
			return current
	}

	return undefined
})

Define(Node.prototype, 'matches', function (type, attrs): boolean {
	if (type !== undefined && this.type !== type)
		return false

	return attrs === undefined || this.hasAttrs(attrs)
})

Define(Node.prototype, 'hasAttrs', function (attrs) {
	for (const [attr, val] of Object.entries(attrs))
		if (this.attrs[attr] !== val)
			return false

	return true
})

Define(Node.prototype, 'pos', function (document) {
	if (document === this)
		return 0

	let result: number | undefined
	document.descendants((node, pos) => {
		if (result !== undefined)
			return false

		if (node === this) {
			result = pos
			return false
		}
	})
	return result
})

Define(Node.prototype, 'parent', function (document) {
	if (document === this)
		return undefined

	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const searchNode = this
	return searchChildren(document)

	function searchChildren (parent: Node) {
		let result: Node | undefined
		parent.forEach(child => {
			result ??= (child === searchNode ? parent : undefined)
				?? searchChildren(child)
		})
		return result
	}
})

Define(Node.prototype, 'depth', function (document) {
	if (document === this)
		return 0

	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const searchNode = this
	return searchChildren(document, 1)

	function searchChildren (parent: Node, depth: number) {
		let result: number | undefined
		parent.forEach(child => {
			result ??= (child === searchNode ? depth : undefined)
				?? searchChildren(child, depth + 1)
		})
		return result
	}
})

Define(Fragment.prototype, 'pos', function (document) {
	let result: number | undefined
	document.descendants((node, pos) => {
		if (result !== undefined)
			return false

		if (node.content === this) {
			result = pos + 1
			return false
		}
	})
	return result
})

Define(Fragment.prototype, 'range', function (document) {
	const pos = this.pos(document)
	if (!pos)
		return undefined

	const $from = document.resolve(pos)
	const $to = document.resolve(pos + this.size)
	return new NodeRange($from, $to, Math.min($from.depth, $to.depth))
})

Define(Fragment.prototype, 'parent', function (document) {
	if (document.content === this)
		return document

	let result: Node | undefined
	document.descendants((node, pos) => {
		if (result !== undefined)
			return false

		if (node.content === this) {
			result = node
			return false
		}
	})
	return result
})

declare module 'prosemirror-transform' {
	interface Transform {
		stripNodeType (range: NodeRange, node: NodeType): this
		stripNodeType (within: Fragment, node: NodeType): this
	}
}

Define(Transform.prototype, 'stripNodeType', function (from: NodeRange | Fragment, type: NodeType): Transform {
	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const tr = this

	let range = from instanceof Fragment ? from.range(tr.doc) : from
	if (!range)
		return this

	while (stripRange());
	return this

	function stripRange (): boolean {
		let stripped = false
		range!.parent.forEach((node, pos, index) => {
			if (stripped)
				return

			if (index >= range!.startIndex && index < range!.endIndex) {
				if (node.type === type) {
					stripNode(node)
					stripped = true
					return
				}

				if (stripDescendants(node)) {
					stripped = true
					return
				}
			}
		})

		return stripped
	}

	function stripDescendants (node: Node | Fragment) {
		let stripped = false
		node.descendants((node, pos) => {
			if (stripped)
				return

			if (node.type === type) {
				stripNode(node)
				stripped = true
				return
			}
		})
		return stripped
	}

	function stripNode (node: Node) {
		const nodePos = node.pos(tr.doc)
		if (nodePos === undefined)
			throw new Error('Unable to continue stripping, no pos')

		const liftRange = node.content.range(tr.doc)
		if (!liftRange)
			throw new Error('Unable to continue stripping, unable to resolve node range')

		const depth = liftTarget(liftRange)
		if (depth !== null)
			tr.lift(liftRange, depth)

		if (range) {
			let start = range.$from.pos
			start = start <= nodePos ? start : start - 1
			let end = range.$to.pos
			end = end < nodePos + node.nodeSize ? end - 1 : end - 2
			const newRange = tr.doc.resolve(start).blockRange(tr.doc.resolve(end))
			if (!newRange)
				throw new Error('Unable to continue stripping, unable to resolve new range')

			range = newRange
		}
	}
})

//#endregion
types<[ResolvedPos, Node, Fragment, Transform]>()
////////////////////////////////////

interface TextEditorDraft {
	name: string
	body: string
	created: number
}

declare module 'utility/Store' {
	interface ILocalStorage {
		textEditorDrafts: TextEditorDraft[]
	}
}

Session.setClearedWithSessionChange('textEditorDrafts')

//#endregion
vars(w3cKeyname.keyName)
types<[ResolvedPos, Node, Fragment, Transform]>()
types<[TextEditorDraft]>()
////////////////////////////////////

////////////////////////////////////
//#region Schema

type Nodes<SCHEMA = typeof schema> = SCHEMA extends Schema<infer NODES, any> ? NODES : never
type Marks<SCHEMA = typeof schema> = SCHEMA extends Schema<any, infer MARKS> ? MARKS : never
const schema = new Schema({
	nodes: Objects.filterNullish({
		...baseSchema.spec.nodes.toObject() as Record<Nodes<typeof baseSchema>, NodeSpec>,
		image: undefined,
		heading: {
			...baseSchema.spec.nodes.get('heading'),
			content: 'text*',
			toDOM (node: Node) {
				const heading = Component(`h${node.attrs.level as 1}`)
				heading.style('markdown-heading', `markdown-heading-${node.attrs.level as 1}`)
				return {
					dom: heading.element,
					contentDOM: heading.element,
				}
			},
		},
		text_align: {
			attrs: { align: { default: 'left', validate: (value: any) => value === 'left' || value === 'center' || value === 'right' } },
			content: 'block+',
			group: 'block',
			defining: true,
			parseDOM: [
				{ tag: 'center', getAttrs: () => ({ align: 'center' }) },
				{
					tag: '*', getAttrs: (element: HTMLElement) => {
						const textAlign = element.style.getPropertyValue('text-align')
						if (!textAlign)
							return false

						return {
							align: textAlign === 'justify' || textAlign === 'start' ? 'left'
								: textAlign === 'end' ? 'right'
									: textAlign,
						}
					},
					priority: 51,
				},
			],
			toDOM: (node: Node) => ['div', Objects.filterNullish({
				class: node.attrs.align === 'left' ? 'align-left' : undefined,
				style: `text-align:${node.attrs.align as string}`,
			}), 0] as const,
		},
	}),
	marks: {
		...baseSchema.spec.marks.toObject() as Record<Marks<typeof baseSchema>, MarkSpec>,
		underline: {
			parseDOM: [
				{ tag: 'u' },
				{ style: 'text-decoration=underline', clearMark: m => m.type.name === 'underline' },
			],
			toDOM () { return ['u'] },
		},
		strikethrough: {
			parseDOM: [
				{ tag: 's' },
				{ style: 'text-decoration=line-through', clearMark: m => m.type.name === 'strikethrough' },
			],
			// toDOM () { return ["s"] },
			toDOM () {
				const span = document.createElement('span')
				span.style.setProperty('text-decoration', 'line-through')
				return span
			},
		},
		subscript: {
			parseDOM: [
				{ tag: 'sub' },
			],
			toDOM () { return ['sub'] },
		},
		superscript: {
			parseDOM: [
				{ tag: 'sup' },
			],
			toDOM () { return ['sup'] },
		},
	},
})

//#endregion
vars(schema)
types<[Marks, Nodes]>()
////////////////////////////////////

////////////////////////////////////
//#region Markdown

const markdown = Markdown.clone()

const REGEX_ATTRIBUTE = (() => {
	const attr_name = '[a-zA-Z_:][a-zA-Z0-9:._-]*'
	const unquoted = '[^"\'=<>`\\x00-\\x20]+'
	const single_quoted = '\'[^\']*\''
	const double_quoted = '"[^"]*"'
	const attr_value = `(?:${unquoted}|${single_quoted}|${double_quoted})`
	const attribute = `(${attr_name})(?:\\s*=\\s*(${attr_value}))(?= |$)`
	return new RegExp(attribute, 'g')
})()

const REGEX_CSS_PROPERTY = /^[-a-zA-Z_][a-zA-Z0-9_-]*$/

interface MarkdownHTMLTokenRemapSpec {
	getAttrs: (token: MarkdownItHTML.Token) => Attrs | true | undefined
}

const markdownHTMLNodeRegistry: PartialRecord<Nodes, MarkdownHTMLTokenRemapSpec> = {
	text_align: {
		getAttrs: token => {
			const align = token.style?.get('text-align')
			if (!['left', 'center', 'right'].includes(align!))
				return undefined

			return { align }
		},
	},
}

// const markdownHTMLMarkRegistry: PartialRecord<Marks, MarkdownHTMLTokenRemapSpec> = {
// }

interface FluffToken extends MarkdownItHTML.Token {
	nodeAttrs?: Attrs
}

const originalParse = markdown.parse
markdown.parse = (src, env) => {
	const rawTokens = originalParse.call(markdown, src, env) as FluffToken[]

	const tokens: FluffToken[] = []
	// the `level` of the parent `_open` token
	let level = 0
	for (const token of rawTokens) {
		if (token.type !== 'html_block_open' && token.type !== 'html_block_close') {
			tokens.push(token)
			continue
		}

		if (token.nesting < 0) {
			const opening = tokens.findLast(token => token.level === level)
			if (!opening) {
				console.warn('Invalid HTML in markdown:', token.raw)
				continue
			}

			token.type = `${opening.type.slice(0, -5)}_close`
			tokens.push(token)
			level = token.level
			continue
		}

		for (const [nodeType, spec] of Object.entries(markdownHTMLNodeRegistry)) {
			const attrs = spec.getAttrs(token)
			if (attrs) {
				token.type = nodeType
				if (attrs !== true)
					token.nodeAttrs = attrs
				break
			}
		}

		token.type = `${token.type}_open`
		level = token.level
		tokens.push(token)
	}

	return tokens
}

const markdownParser = new MarkdownParser(schema, markdown, Objects.filterNullish({
	...defaultMarkdownParser.tokens,
	image: undefined,

	u: {
		mark: 'underline',
	},
	s: {
		mark: 'strikethrough',
	},

	...Object.entries(markdownHTMLNodeRegistry)
		.toObject(([tokenType, spec]) => [tokenType, ({
			block: tokenType,
			getAttrs: token => (token as FluffToken).nodeAttrs ?? {},
		} satisfies ParseSpec)]),
} satisfies Record<string, ParseSpec | undefined>))

const markdownSerializer = new MarkdownSerializer(
	{
		...defaultMarkdownSerializer.nodes,
		text_align: (state, node, parent, index) => {
			state.write(`<div style="text-align:${node.attrs.align}">\n`)
			state.renderContent(node)
			state.write('</div>')
			state.closeBlock(node)
		},
	},
	{
		...defaultMarkdownSerializer.marks,
		strikethrough: {
			open: '~~',
			close: '~~',
			expelEnclosingWhitespace: true,
		},
		underline: {
			open: '__',
			close: '__',
			expelEnclosingWhitespace: true,
		},
	},
)

function parseStyleAttributeValue (style: string): Map<string, string>
function parseStyleAttributeValue (style?: string | null): Map<string, string> | undefined
function parseStyleAttributeValue (style?: string | null) {
	if (style === undefined || style === null)
		return undefined

	const styles = new Map<string, string>()
	let key = ''
	let value = ''
	let inValue = false
	let isEscaped = false
	let isQuoted = false
	let quoteChar = ''
	let parenCount = 0

	for (let i = 0; i < style.length; i++) {
		const char = style[i]
		if (char === '\\') {
			isEscaped = true
			continue
		}

		if (isEscaped) {
			value += char
			isEscaped = false
			continue
		}

		if ((char === '"' || char === '\'') && !isQuoted) {
			isQuoted = true
			quoteChar = char
			continue
		}

		if (char === quoteChar && isQuoted) {
			isQuoted = false
			continue
		}

		if (char === '(' && !isQuoted) {
			parenCount++
			value += char
			continue
		}

		if (char === ')' && !isQuoted) {
			parenCount--
			value += char
			continue
		}

		if (char === ':' && !isQuoted && parenCount === 0) {
			inValue = true
			continue
		}

		if (char === ';' && !isQuoted && parenCount === 0) {
			if (key && value) {
				key = key.trim()
				if (!REGEX_CSS_PROPERTY.test(key))
					console.warn(`Invalid CSS property "${key}"`)
				else
					styles.set(key, value.trim())
				key = ''
				value = ''
			}
			inValue = false
			continue
		}

		if (inValue) {
			value += char
		}
		else {
			key += char
		}
	}

	if (key && value) {
		key = key.trim()
		if (!REGEX_CSS_PROPERTY.test(key))
			console.warn(`Invalid CSS property "${key}"`)
		else
			styles.set(key, value.trim())
	}

	return styles
}

//#endregion
vars(REGEX_ATTRIBUTE, REGEX_CSS_PROPERTY, markdownParser, markdownSerializer, parseStyleAttributeValue)
////////////////////////////////////

const BLOCK_TYPES = [
	'paragraph',
	'code_block',
] satisfies Nodes[]
type BlockType = (typeof BLOCK_TYPES)[number]

interface TextEditorExtensions {
	readonly toolbar: Component
	readonly default: StringApplicator.Optional<this>
	readonly content: State<string>
	document?: Input
	mirror?: EditorView
	useMarkdown (): string
}

interface TextEditor extends Input, TextEditorExtensions { }

let globalid = 0
const TextEditor = Component.Builder((component): TextEditor => {
	const id = globalid++

	const isMarkdown = State<boolean>(false)
	const content = State<string>('')
	const isFullscreen = State<boolean>(false)

	// eslint-disable-next-line prefer-const
	let editor!: TextEditor
	const state = State<EditorState | undefined>(undefined)

	////////////////////////////////////
	//#region Announcements

	state.subscribe(component, () => {
		if (!editor.mirror?.hasFocus() || !editor.mirror.state.selection.empty)
			return

		const pos = editor.mirror.state.selection.from + 1
		const $pos = editor.mirror.state.doc.resolve(pos > editor.mirror.state.doc.content.size ? pos - 1 : pos)
		Announcer.interrupt('text-editor/format/inline', announce => {
			const markTypes = Object.keys(schema.marks) as Marks[]

			let hadActive = false
			for (const type of markTypes) {
				if (!isMarkActive(schema.marks[type], $pos))
					continue

				hadActive = true
				announce(`component/text-editor/formatting/${type}`)
			}

			if (!hadActive)
				announce('component/text-editor/formatting/none')
		})
	})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Toolbar

	////////////////////////////////////
	//#region Components

	type ButtonType = keyof { [N in Quilt.SimpleKey as N extends `component/text-editor/toolbar/button/${infer N}` ? N extends `${string}/${string}` ? never : N : never]: true }
	type ButtonTypeNodes = keyof { [N in keyof Quilt as N extends `component/text-editor/toolbar/button/${infer N extends Strings.Replace<Nodes, '_', '-'>}` ? N : never]: true }

	////////////////////////////////////
	//#region Types

	const ToolbarButtonTypeMark = Component.Extension((component, type: Marks) => {
		const mark = schema.marks[type]
		return component
			.style(`text-editor-toolbar-${type}`)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
			.extend<{ mark: MarkType }>(() => ({ mark }))
	})

	const ToolbarButtonTypeNode = Component.Extension((component, type: ButtonTypeNodes) => {
		const node = schema.nodes[type.replaceAll('-', '_')]
		return component
			.style(`text-editor-toolbar-${type}`)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
			.extend<{ node: NodeType }>(() => ({ node }))
	})

	const ToolbarButtonTypeOther = Component.Extension((component, type: Exclude<ButtonType, ButtonTypeNodes | Marks>) => {
		return component
			.style(`text-editor-toolbar-${type}`)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
	})

	//#endregion
	vars(ToolbarButtonTypeMark, ToolbarButtonTypeNode, ToolbarButtonTypeOther)
	////////////////////////////////////

	////////////////////////////////////
	//#region Components

	const ToolbarButtonGroup = Component.Builder(component => component
		.ariaRole('group')
		.style('text-editor-toolbar-button-group'))

	const ToolbarButton = Component.Builder((_, handler: (component: Component) => unknown) => {
		return Button()
			.style('text-editor-toolbar-button')
			.clearPopover()
			.receiveFocusedClickEvents()
			.event.subscribe('click', event => {
				event.preventDefault()
				handler(event.component)
			})
	})

	const ToolbarCheckbutton = Component.Builder((_, state: State.Readonly<boolean>, toggler: (component: Component) => unknown) => {
		return Checkbutton()
			.style('text-editor-toolbar-button')
			.style.bind(state, 'text-editor-toolbar-button--enabled')
			.use(state)
			.clearPopover()
			.receiveFocusedClickEvents()
			.event.subscribe('click', event => {
				event.preventDefault()
				toggler(event.component)
			})
	})

	const ToolbarRadioButton = Component.Builder((_, name: string, state: State.Readonly<boolean>, toggler: (component: Component) => unknown) => {
		return RadioButton()
			.style('text-editor-toolbar-button')
			.setName(name)
			.style.bind(state, 'text-editor-toolbar-button--enabled')
			.use(state)
			.clearPopover()
			.receiveFocusedClickEvents()
			.event.subscribe('click', event => {
				event.preventDefault()
				toggler(event.component)
			})
	})

	const ToolbarButtonPopover = Component.Builder((_, align: 'left' | 'centre' | 'right') => {
		return Button()
			.style('text-editor-toolbar-button', 'text-editor-toolbar-button--has-popover')
			.clearPopover()
			.setPopover('hover', (popover, button) => {
				popover
					.style('text-editor-toolbar-popover')
					.style.bind(popover.popoverParent.nonNullish, 'text-editor-toolbar-popover-sub', `text-editor-toolbar-popover-sub--${align}`)
					.anchor.add(align === 'centre' ? align : `aligned ${align}`, 'off bottom')
					.style.toggle(align === 'left', 'text-editor-toolbar-popover--left')
					.style.toggle(align === 'right', 'text-editor-toolbar-popover--right')
					.setMousePadding(20)

				button.style.bind(popover.visible, 'text-editor-toolbar-button--has-popover-visible')
			})
			.receiveAncestorInsertEvents()
			.event.subscribe(['insert', 'ancestorInsert'], event =>
				event.component.style.toggle(!!event.component.closest(Popover), 'text-editor-toolbar-button--has-popover--within-popover'))
	})

	//#endregion
	vars(ToolbarButtonGroup, ToolbarButton, ToolbarCheckbutton, ToolbarRadioButton, ToolbarButtonPopover)
	////////////////////////////////////

	////////////////////////////////////
	//#region Specifics

	const ToolbarButtonMark = Component.Builder((_, type: Marks) => {
		const mark = schema.marks[type]
		const toggler = markToggler(mark)
		const markActive = state.map(component, state => isMarkActive(mark))
		return ToolbarCheckbutton(markActive, toggler)
			.and(ToolbarButtonTypeMark, type)
	})

	type Align = 'left' | 'centre' | 'right'
	const ToolbarButtonAlign = Component.Builder((_, align: Align) => {
		const toggler = wrapper(schema.nodes.text_align, { align: align === 'centre' ? 'center' : align })
		const alignActive = state.map(component, state => isAlignActive(align))
		return ToolbarRadioButton(`text-editor-${id}-text-align`, alignActive, toggler)
			.and(ToolbarButtonTypeOther, `align-${align}`)
	})

	const ToolbarButtonBlockType = Component.Builder((_, type: ButtonTypeNodes) => {
		const node = schema.nodes[type.replaceAll('-', '_')]
		const toggle = blockTypeToggler(node)
		const typeActive = state.map(component, state => isTypeActive(node))
		return ToolbarRadioButton(`text-editor-${id}-block-type`, typeActive, toggle)
			.and(ToolbarButtonTypeNode, type)
	})

	const ToolbarButtonHeading = Component.Builder((_, level: number) => {
		const node = schema.nodes.heading
		const toggle = blockTypeToggler(node, { level })
		const typeActive = state.map(component, state => isTypeActive(node, { level }))
		return ToolbarRadioButton(`text-editor-${id}-block-type`, typeActive, toggle)
			.style(`text-editor-toolbar-h${level as 1}`)
	})

	const ToolbarButtonWrap = Component.Builder((_, type: ButtonTypeNodes) =>
		ToolbarButton(wrapper(schema.nodes[type.replaceAll('-', '_')]))
			.and(ToolbarButtonTypeNode, type))

	const ToolbarButtonList = Component.Builder((_, type: Extract<ButtonTypeNodes, `${string}-list`>) =>
		ToolbarButton(listWrapper(schema.nodes[type.replaceAll('-', '_')]))
			.and(ToolbarButtonTypeNode, type))

	//#endregion
	vars(ToolbarButtonMark, ToolbarButtonAlign, ToolbarButtonBlockType, ToolbarButtonHeading, ToolbarButtonWrap, ToolbarButtonList)
	types<[Align]>()
	////////////////////////////////////

	////////////////////////////////////
	//#region Commands

	let inTransaction = false
	function wrapCmd (cmd: Command): (component: Component) => void {
		return (component: Component) => {
			if (!state.value)
				return

			inTransaction = true
			cmd(state.value, editor.mirror?.dispatch, editor.mirror)
			inTransaction = false

			if (!component.hasFocused.value)
				editor.document?.focus()
		}
	}

	function markToggler (type: MarkType) {
		return wrapCmd(toggleMark(type))
	}

	function wrapper (node: NodeType, attrs?: Attrs) {
		if (node === schema.nodes.text_align)
			return wrapCmd((state, dispatch) => {
				const { $from, $to } = state.selection
				let range = $from.blockRange($to)
				if (range) {
					const textAlignBlock = $from.closest(schema.nodes.text_align, range.depth)
					if (textAlignBlock && !range.startIndex && range.endIndex === textAlignBlock.childCount) {
						const pos = textAlignBlock.pos(state.doc)
						if (pos === undefined)
							return false

						if (dispatch) dispatch(state.tr
							.setNodeMarkup(pos, undefined, attrs)
							.stripNodeType(textAlignBlock.content, schema.nodes.text_align)
							.scrollIntoView())
						return true
					}
				}

				const wrapping = range && findWrapping(range, node, attrs)
				if (!wrapping)
					return false

				if (dispatch) {
					const tr = state.tr

					tr.wrap(range!, wrapping)
					range = tr.doc.resolve($from.pos + 1).blockRange(tr.doc.resolve($to.pos + 1))
					if (!range)
						throw new Error('Unable to strip nodes, unable to resolve new range')

					tr.stripNodeType(range, schema.nodes.text_align)
					tr.scrollIntoView()

					dispatch(tr)
				}
				return true
			})

		return wrapCmd(wrapIn(node, attrs))
	}

	function blockTypeToggler (node: NodeType, attrs?: Attrs) {
		return wrapCmd(setBlockType(node, attrs))
	}

	function listWrapper (node: NodeType, attrs?: Attrs) {
		return wrapCmd(wrapInList(node, attrs))
	}

	//#endregion
	vars(wrapCmd, markToggler, wrapper, blockTypeToggler, listWrapper)
	////////////////////////////////////

	//#endregion
	vars(ToolbarButtonTypeMark, ToolbarButtonTypeNode, ToolbarButtonTypeOther)
	vars(ToolbarButtonGroup, ToolbarButton, ToolbarCheckbutton, ToolbarRadioButton, ToolbarButtonPopover)
	vars(ToolbarButtonMark, ToolbarButtonAlign, ToolbarButtonBlockType, ToolbarButtonHeading, ToolbarButtonWrap, ToolbarButtonList)
	types<[ButtonType, ButtonTypeNodes, Align]>()
	////////////////////////////////////

	const toolbar = Component()
		.style('text-editor-toolbar')
		.style.bind(isFullscreen, 'text-editor-toolbar--fullscreen')
		.ariaRole('toolbar')
		.append(Component()
			.style('text-editor-toolbar-left')
			.append(ToolbarButtonGroup()
				.ariaLabel.use('component/text-editor/toolbar/group/inline')
				.append(ToolbarButtonMark('strong'))
				.append(ToolbarButtonMark('em'))
				.append(ToolbarButtonPopover('left')
					.and(ToolbarButtonTypeOther, 'other-formatting')
					.tweakPopover(popover => popover
						.append(ToolbarButtonMark('underline'))
						.append(ToolbarButtonMark('strikethrough'))
						.append(ToolbarButtonMark('subscript'))
						.append(ToolbarButtonMark('superscript'))
						.append(ToolbarButtonMark('code'))
					)))
			.append(ToolbarButtonGroup()
				.ariaLabel.use('component/text-editor/toolbar/group/block')
				.append(
					ToolbarButtonPopover('centre')
						.tweakPopover(popover => popover
							.ariaRole('radiogroup')
							.append(ToolbarButtonAlign('left'))
							.append(ToolbarButtonAlign('centre'))
							.append(ToolbarButtonAlign('right'))
						)
						.tweak(button => {
							state.use(button, () => {
								const align = !editor?.mirror?.hasFocus() && !inTransaction ? 'left' : getAlign() ?? 'mixed'
								button.ariaLabel.set(quilt['component/text-editor/toolbar/button/align'](
									quilt[`component/text-editor/toolbar/button/align/currently/${align}`]()
								).toString())
								button.style.remove('text-editor-toolbar-align-left', 'text-editor-toolbar-align-centre', 'text-editor-toolbar-align-right', 'text-editor-toolbar-align-mixed')
								button.style(`text-editor-toolbar-align-${align}`)
							})
						})
				))
			.append(ToolbarButtonGroup()
				.ariaRole()
				.append(ToolbarButtonPopover('centre')
					.tweakPopover(popover => popover
						.ariaRole('radiogroup')
						.append(ToolbarButtonBlockType('paragraph'))
						.append(ToolbarButtonPopover('centre')
							.style('text-editor-toolbar-heading')
							.tweakPopover(popover => popover
								.append(ToolbarButtonHeading(1))
								.append(ToolbarButtonHeading(2))
								.append(ToolbarButtonHeading(3))
								.append(ToolbarButtonHeading(4))
								.append(ToolbarButtonHeading(5))
								.append(ToolbarButtonHeading(6))
							))
						.append(ToolbarButtonBlockType('code-block'))
					)
					.tweak(button => {
						state.use(button, () => {
							const blockType = !editor?.mirror?.hasFocus() && !inTransaction ? 'paragraph' : getBlockType() ?? 'mixed'
							button.ariaLabel.set(quilt['component/text-editor/toolbar/button/block-type'](
								quilt[`component/text-editor/toolbar/button/block-type/currently/${blockType}`]()
							).toString())
							button.style.remove('text-editor-toolbar-mixed', ...BLOCK_TYPES
								.map(type => type.replaceAll('_', '-') as BlockTypeR)
								.map(type => `text-editor-toolbar-${type}` as const))
							button.style(`text-editor-toolbar-${blockType}`)
						})
					})))
			.append(ToolbarButtonGroup()
				.ariaLabel.use('component/text-editor/toolbar/group/wrapper')
				.append(ToolbarButton(wrapCmd(lift)).and(ToolbarButtonTypeOther, 'lift')
					.style.bind(state.map(component, value => !value || !lift(value)), 'text-editor-toolbar-button--hidden'))
				.append(ToolbarButtonWrap('blockquote'))
				.append(ToolbarButtonList('bullet-list'))
				.append(ToolbarButtonList('ordered-list'))
			)
			.append(ToolbarButtonGroup()
				.ariaLabel.use('component/text-editor/toolbar/group/insert')
				.append(ToolbarButton(wrapCmd((state, dispatch) => {
					dispatch?.(state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create()))
					return true
				}))
					.and(ToolbarButtonTypeOther, 'hr'))))
		.append(Component()
			.style('text-editor-toolbar-right')
			.append(ToolbarButtonGroup()
				.ariaLabel.use('component/text-editor/toolbar/group/actions')
				.append(ToolbarButton(wrapCmd(undo)).and(ToolbarButtonTypeOther, 'undo'))
				.append(ToolbarButton(wrapCmd(redo)).and(ToolbarButtonTypeOther, 'redo'))
				.append(ToolbarButton(toggleFullscreen)
					.style.bind(isFullscreen.not, 'text-editor-toolbar-fullscreen')
					.style.bind(isFullscreen, 'text-editor-toolbar-unfullscreen')
					.ariaLabel.bind(isFullscreen.map(component, fullscreen => quilt[`component/text-editor/toolbar/button/${fullscreen ? 'unfullscreen' : 'fullscreen'}`]().toString())))
			))

	//#endregion
	vars(toolbar)
	////////////////////////////////////

	////////////////////////////////////
	//#region Main UI

	let label: Label | undefined
	let unsubscribeLabelFor: UnsubscribeState | undefined
	let unuseLabelRemoved: UnsubscribeState | undefined
	const stopUsingLabel = () => {
		label = undefined
		unuseLabelRemoved?.(); unuseLabelRemoved = undefined
		unsubscribeLabelFor?.(); unsubscribeLabelFor = undefined
	}

	const hiddenInput = Component('input')
		.style('text-editor-validity-pipe-input')
		.tabIndex('programmatic')
		.attributes.set('type', 'text')
		.setName(`text-editor-validity-pipe-input-${Math.random().toString(36).slice(2)}`)

	const viewTransitionName = 'text-editor'
	const actualEditor = Component()
		.subviewTransition(viewTransitionName)
		.style('text-editor')
		.style.bind(isFullscreen, 'text-editor--fullscreen')
		.event.subscribe('click', event => {
			const target = Component.get(event.target)
			if (target !== toolbar && !target?.is(TextEditor))
				return

			editor.document?.focus()
		})
		.append(hiddenInput)
		.append(toolbar)

	editor = component
		.and(Slot)
		.and(Input)
		.append(actualEditor)
		.pipeValidity(hiddenInput)
		.extend<TextEditorExtensions & Partial<InputExtensions>>(editor => ({
			content,
			default: StringApplicator(editor, value => loadFromMarkdown(value)),
			toolbar,
			setRequired (required = true) {
				editor.style.toggle(required, 'text-editor--required')
				editor.required.value = required
				refresh()
				return editor
			},
			setLabel (newLabel) {
				stopUsingLabel()

				label = newLabel
				refresh()

				unuseLabelRemoved = label?.removed.use(editor, removed => removed && stopUsingLabel())
				// the moment a name is assigned to the editor, attempt to replace the doc with a local draft (if it exists)
				unsubscribeLabelFor = label?.for.use(editor, loadLocal)

				return editor
			},
			useMarkdown: () => {
				clearLocal()
				return !state.value ? '' : markdownSerializer.serialize(state.value?.doc)
			},
		}))

	const documentSlot = Slot(); documentSlot
		.style.bind(isFullscreen, 'text-editor-document-slot--fullscreen')
		.use(isMarkdown, (slot, isMarkdown) => {
			if (isMarkdown) {
				state.value = undefined
				return
			}

			return createDefaultView(Slot().appendTo(slot))
		})
		.appendTo(actualEditor)

	const contentWidth = State.Generator(() => `${editor.document?.element.scrollWidth ?? 0}px`)
		.observe(component, state, Viewport.size)

	const scrollbarProxy: Component = Component()
		.style('text-editor-document-scrollbar-proxy')
		.style.bind(isFullscreen, 'text-editor-document-scrollbar-proxy--fullscreen')
		.style.bind(contentWidth.map(component, () => (editor.document?.element.scrollWidth ?? 0) > (editor.document?.rect.value.width ?? 0)), 'text-editor-document-scrollbar-proxy--visible')
		.style.bindVariable('content-width', contentWidth)
		.event.subscribe('scroll', () =>
			editor.document?.element.scrollTo({ left: scrollbarProxy.element.scrollLeft, behavior: 'instant' }))
		.appendTo(actualEditor)

	const fullscreenContentWidth = State.Generator(() => `${documentSlot.element.scrollWidth ?? 0}px`)
		.observe(component, state, Viewport.size)
	documentSlot.style.bindVariable('content-width', fullscreenContentWidth)

	state.use(editor, state => {
		saveLocal(undefined, state?.doc)
		toolbar.rect.markDirty()
	})

	const fullscreenDialog = Dialog()
		.and(Slot)
		.style.remove('slot')
		.setFullscreen()
		.setOwner(editor)
		.bind(isFullscreen)
		.appendTo(document.body)

	editor.length.use(editor, (length = 0) => {
		let invalid: InvalidMessageText
		if (length > (editor.maxLength.value ?? Infinity))
			invalid = quilt['shared/form/invalid/too-long']()

		editor.setCustomInvalidMessage(invalid)
		editor.document?.setCustomInvalidMessage(invalid)
		hiddenInput.event.bubble('change')
	})

	//#endregion
	vars(editor, actualEditor, documentSlot, scrollbarProxy, fullscreenDialog)
	////////////////////////////////////

	return editor

	////////////////////////////////////
	//#region ProseMirror Init

	function markInputRule (
		regexp: RegExp,
		markType: MarkType,
		getAttrs: Attrs | null | ((matches: RegExpMatchArray) => Attrs | null) = null,
		getContent: string | Fragment | Node | readonly Node[] | ((matches: RegExpMatchArray) => string | Fragment | Node | readonly Node[]),
	) {
		return new InputRule(regexp, (state, match, start, end) => {
			const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs
			const content = getContent instanceof Function ? getContent(match) : getContent
			const tr = state.tr
			tr.replaceWith(start, end, typeof content === 'string' ? schema.text(content) : content)
			const mark = markType.create(attrs)
			tr.addMark(tr.mapping.map(start), tr.mapping.map(end), mark)
			tr.removeStoredMark(mark)
			return tr
		})
	}

	function createDefaultView (slot: Slot) {
		const view = new EditorView(slot.element, {
			state: EditorState.create({
				doc: markdownParser.parse(content.value),
				plugins: [
					buildInputRules(schema),
					inputRules({
						rules: [
							markInputRule(/\*\*([^*]+?)\*\*/, schema.marks.strong, undefined, match => match[1]),
							markInputRule(/__([^_]+?)__/, schema.marks.underline, undefined, match => match[1]),
							markInputRule(/\/\/([^/]+?)\/\//, schema.marks.em, undefined, match => match[1]),
							markInputRule(/`([^`]+?)`/, schema.marks.code, undefined, match => match[1]),
							markInputRule(/\[(.+?)\]\(([^ ]+?)(?:[  ](?:\((.+?)\)|["'“”‘’](.+?)["'“”‘’]))?\)/, schema.marks.link,
								([match, text, href, title1, title2]) => ({ href, title: title1 || title2 || undefined }),
								match => match[1]),
						],
					}),
					keymap(buildKeymap(schema, {})),
					keymap(baseKeymap),
					keymap({
						'Mod-s': toggleMark(schema.marks.strikethrough),
						'Mod-S': toggleMark(schema.marks.strikethrough),
						'Mod-.': toggleMark(schema.marks.superscript),
						'Mod-,': toggleMark(schema.marks.subscript),
						'Alt-Ctrl-0': setBlockType(schema.nodes.paragraph),
						...Arrays.range(1, 7)
							.toObject(i => [`Alt-Ctrl-${i}`, setBlockType(schema.nodes.heading, { level: i })]),
					}),
					dropCursor(),
					gapCursor(),
					history(),
					new Plugin({
						view () {
							return {
								update (view, prevState) {
									state.value = view.state
									if (state.value === prevState)
										state.emit()
								},
							} satisfies PluginView
						},
					} satisfies PluginSpec<any>),
				],
			}),
		})

		editor.mirror = view
		editor.document = Component()
			.and(Input)
			.replaceElement(editor.mirror.dom)
			.ariaRole('textbox')
			.classes.add('markdown')
			.style('text-editor-document')
			.style.bind(isFullscreen, 'text-editor-document--fullscreen')
			.setId(`text-editor-${id}`)
			.attributes.set('aria-multiline', 'true')
			.event.subscribe('scroll', () =>
				scrollbarProxy.element.scrollTo({ left: editor.document?.element.scrollLeft ?? 0, behavior: 'instant' }))

		toolbar.ariaControls(editor.document)
		refresh()

		return () => {
			content.value = markdownSerializer.serialize(view.state.doc)
			editor.mirror = undefined
			editor.document = undefined
			refresh()
			view.destroy()
		}
	}

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Events/Actions

	function refresh () {
		label?.setInput(editor.document)
		editor.document?.setName(label?.for)
		editor.document?.setId(label?.for)
		label?.setId(label.for.map(component, v => `${v}-label`))
		toolbar.ariaLabelledBy(label)
		editor.document?.ariaLabelledBy(label)
		editor.document?.attributes.toggle(editor.required.value, 'aria-required', 'true')
	}

	function toggleFullscreen () {
		ViewTransition.perform('subview', viewTransitionName, () => {
			isFullscreen.value = !isFullscreen.value
			actualEditor.appendTo(isFullscreen.value ? fullscreenDialog : editor)
			actualEditor.rect.markDirty()
		})
	}

	function clearLocal (name = editor.document?.name.value) {
		if (!name)
			return

		Store.items.textEditorDrafts = Store.items.textEditorDrafts?.filter(draft => draft.name !== name)
	}

	function loadFromMarkdown (markdown = '') {
		// hack to fix it not redrawing when calling updateState now?

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		((editor.mirror as any)?.docView as NodeViewDesc).dirty = 2 // CONTENT_DIRTY

		editor.mirror?.updateState(EditorState.create({
			plugins: editor.mirror.state.plugins.slice(),
			doc: markdownParser.parse(markdown),
		}))
	}

	function loadLocal (name = editor.document?.name.value) {
		if (!name)
			return

		const draft = Store.items.textEditorDrafts?.find(draft => draft.name === name)
		if (!draft)
			return

		loadFromMarkdown(draft.body)
	}

	function saveLocal (name = editor.document?.name.value, doc?: Node) {
		const body = !doc ? '' : markdownSerializer.serialize(doc)
		content.value = body
		editor.length.value = body.length

		if (!name)
			return

		if (body === editor.default.state.value)
			return clearLocal()

		Store.items.textEditorDrafts = [
			...!body ? [] : [{ name, body, created: Date.now() }],

			...(Store.items.textEditorDrafts ?? [])
				.filter(draft => true
					&& draft.name !== name // keep old drafts that don't share names with the new draft
					&& Date.now() - draft.created < Time.days(1) // keep old drafts only if they were made in the last day
					&& true),
		]
			// disallow more than 4 drafts due to localstorage limitations with using localStorage
			// this won't be necessary when drafts are stored in indexeddb
			.slice(0, 4)
	}

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region State

	function isMarkActive (type: MarkType, pos?: ResolvedPos) {
		if (!state.value)
			return false

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos)
			return !!type.isInSet(state.value.storedMarks || pos.marks())

		return state.value.doc.rangeHasMark(selection.from, selection.to, type)
	}

	function isTypeActive (type: NodeType, attrs?: Attrs, pos?: ResolvedPos) {
		if (!state.value)
			return false

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos)
			return !!pos.closest(type, attrs)

		let found = false
		state.value.doc.nodesBetween(selection.from, selection.to, node => {
			found ||= node.matches(type, attrs)
		})
		return found
	}

	type BlockTypeR = Strings.Replace<BlockType, '_', '-'>
	function getBlockType (pos: ResolvedPos): BlockTypeR
	function getBlockType (pos?: ResolvedPos): BlockTypeR | undefined
	function getBlockType (pos?: ResolvedPos): BlockTypeR | undefined {
		if (!state.value)
			return undefined

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos) {
			for (const blockType of BLOCK_TYPES)
				if (isTypeActive(schema.nodes[blockType], pos))
					return blockType.replaceAll('_', '-') as BlockTypeR
			return 'paragraph'
		}

		const types = new Set<BlockTypeR>()
		state.value.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
			if (node.type !== schema.nodes.text)
				return

			const $pos = state.value?.doc.resolve(pos)
			if (!$pos)
				return

			for (const blockType of BLOCK_TYPES)
				if (isTypeActive(schema.nodes[blockType], $pos)) {
					types.add(blockType.replaceAll('_', '-') as BlockTypeR)
					return
				}
		})

		if (!types.size)
			return getBlockType(selection.$from)

		if (types.size > 1)
			return undefined

		const [type] = types
		return type
	}

	function isAlignActive (align: Align | 'center', pos?: ResolvedPos) {
		if (!state.value)
			return false

		align = align === 'centre' ? 'center' : align

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos)
			return (pos.closest(schema.nodes.text_align)?.attrs.align ?? 'left') === align

		let found = false
		state.value.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
			const resolved = state.value?.doc.resolve(pos)
			found ||= !resolved ? align === 'left' : isAlignActive(align, resolved)
		})
		return found
	}

	function getAlign (pos: ResolvedPos): Align
	function getAlign (pos?: ResolvedPos): Align | undefined
	function getAlign (pos?: ResolvedPos): Align | undefined {
		if (!state.value)
			return undefined

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos) {
			const align = (pos.closest(schema.nodes.text_align)?.attrs.align ?? 'left') as Align | 'center'
			return align === 'center' ? 'centre' : align
		}

		const aligns = new Set<Align>()
		state.value.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
			if (node.type === schema.nodes.text) {
				const $pos = state.value?.doc.resolve(pos)
				if ($pos)
					aligns.add(getAlign($pos))
			}
		})

		if (!aligns.size)
			return getAlign(selection.$from)

		if (aligns.size > 1)
			return undefined

		const [align] = aligns
		return align
	}

	//#endregion
	////////////////////////////////////
})

export default TextEditor
