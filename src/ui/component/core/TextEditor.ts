import quilt from "lang/en-nz"
import MarkdownIt from "markdown-it"
import { baseKeymap, setBlockType, toggleMark, wrapIn } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { buildInputRules, buildKeymap } from "prosemirror-example-setup"
import { gapCursor } from "prosemirror-gapcursor"
import { history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import type { ParseSpec } from "prosemirror-markdown"
import { schema as baseSchema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser } from "prosemirror-markdown"
import type { Attrs, MarkSpec, MarkType, NodeSpec, NodeType } from "prosemirror-model"
import { Fragment, Node, NodeRange, ResolvedPos, Schema } from "prosemirror-model"
import type { Command, PluginSpec, PluginView } from "prosemirror-state"
import { EditorState, Plugin } from "prosemirror-state"
import { findWrapping, liftTarget, Transform } from "prosemirror-transform"
import { EditorView } from "prosemirror-view"
import Announcer from "ui/Announcer"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import Checkbutton from "ui/component/core/Checkbutton"
import type { InputExtensions } from "ui/component/core/extension/Input"
import Input from "ui/component/core/extension/Input"
import type Label from "ui/component/core/Label"
import type Popover from "ui/component/core/Popover"
import RadioButton from "ui/component/core/RadioButton"
import Slot from "ui/component/core/Slot"
import type { Quilt } from "ui/utility/TextManipulator"
import Arrays from "utility/Arrays"
import Define from "utility/Define"
import Objects from "utility/Objects"
import State from "utility/State"
import type Strings from "utility/Strings"
import w3cKeyname from "w3c-keyname"

////////////////////////////////////
//#region Module Augmentation

const baseKeyName = w3cKeyname.keyName
w3cKeyname.keyName = (event: Event) => {
	const keyboardEvent = event as KeyboardEvent
	if (keyboardEvent.code.startsWith("Numpad") && !keyboardEvent.shiftKey && (keyboardEvent.ctrlKey || keyboardEvent.altKey)) {
		Object.defineProperty(event, "shiftKey", { value: true })
		const str = keyboardEvent.code.slice(6)
		if (str === "Decimal")
			return "."

		if (!isNaN(+str))
			return str
	}

	return baseKeyName(event)
}

declare module "prosemirror-model" {
	interface ResolvedPos {
		closest (node: NodeType, startingAtDepth?: number): Node | undefined
	}
	interface Node {
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

Define(ResolvedPos.prototype, "closest", function (node, startingAtDepth) {
	startingAtDepth ??= this.depth
	for (let depth = startingAtDepth; depth >= 0; depth--) {
		const current = this.node(depth)
		if (current.type === node)
			return current
	}

	return undefined
})

Define(Node.prototype, "pos", function (document) {
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

Define(Node.prototype, "parent", function (document) {
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

Define(Node.prototype, "depth", function (document) {
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

Define(Fragment.prototype, "pos", function (document) {
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

Define(Fragment.prototype, "range", function (document) {
	const pos = this.pos(document)
	if (!pos)
		return undefined

	const $from = document.resolve(pos)
	const $to = document.resolve(pos + this.size)
	return new NodeRange($from, $to, Math.min($from.depth, $to.depth))
})

Define(Fragment.prototype, "parent", function (document) {
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

declare module "prosemirror-transform" {
	interface Transform {
		stripNodeType (range: NodeRange, node: NodeType): this
		stripNodeType (within: Fragment, node: NodeType): this
	}
}

Define(Transform.prototype, "stripNodeType", function (from: NodeRange | Fragment, type: NodeType): Transform {
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
			throw new Error("Unable to continue stripping, no pos")

		const liftRange = node.content.range(tr.doc)
		if (!liftRange)
			throw new Error("Unable to continue stripping, unable to resolve node range")

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
				throw new Error("Unable to continue stripping, unable to resolve new range")

			range = newRange
		}
	}
})

//#endregion
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
			...baseSchema.spec.nodes.get("heading"),
			content: "text*",
		},
		text_align: {
			attrs: { align: { default: "left", validate: (value: any) => value === "left" || value === "center" || value === "right" } },
			content: "block+",
			group: "block",
			defining: true,
			parseDOM: [
				{ tag: "center", getAttrs: () => ({ align: "center" }) },
				{
					tag: "*", getAttrs: (element: HTMLElement) => {
						const textAlign = element.style.getPropertyValue("text-align")
						if (!textAlign)
							return false

						return { align: textAlign }
					},
				},
			],
			toDOM: (node: Node) => ["div", Objects.filterNullish({
				"class": node.attrs.align === "left" ? "align-left" : undefined,
				"style": `text-align:${node.attrs.align as string}`,
			}), 0] as const,
		},
	}),
	marks: {
		...baseSchema.spec.marks.toObject() as Record<Marks<typeof baseSchema>, MarkSpec>,
		underline: {
			parseDOM: [
				{ tag: "u" },
				{ style: "text-decoration=underline", clearMark: m => m.type.name === "underline" },
			],
			toDOM () { return ["u"] },
		},
		strikethrough: {
			parseDOM: [
				{ tag: "s" },
				{ style: "text-decoration=line-through", clearMark: m => m.type.name === "strikethrough" },
			],
			// toDOM () { return ["s"] },
			toDOM () {
				const span = document.createElement("span")
				span.style.setProperty("text-decoration", "line-through")
				return span
			},
		},
		subscript: {
			parseDOM: [
				{ tag: "sub" },
			],
			toDOM () { return ["sub"] },
		},
		superscript: {
			parseDOM: [
				{ tag: "sup" },
			],
			toDOM () { return ["sup"] },
		},
	},
})

//#endregion
////////////////////////////////////

////////////////////////////////////
//#region TODO Markdown stuff

const markdownSpec: Record<string, ParseSpec> = {
	...defaultMarkdownParser.tokens,
	underline: {
		mark: "underline",
	},
}
delete markdownSpec.image
const markdownParser = new MarkdownParser(schema, MarkdownIt("commonmark", { html: true }), markdownSpec)

//#endregion
////////////////////////////////////

interface TextEditorExtensions {
	toolbar: Component
	document?: Input
	mirror?: EditorView
}

interface TextEditor extends Input, TextEditorExtensions { }

let globalid = 0
const TextEditor = Component.Builder((component): TextEditor => {
	const id = globalid++

	const isMarkdown = State<boolean>(false)
	const content = State<string>("")

	// eslint-disable-next-line prefer-const
	let editor!: TextEditor
	const state = State<EditorState | undefined>(undefined)

	////////////////////////////////////
	//#region Announcements

	state.subscribe(component, () => {
		if (!editor.mirror?.hasFocus() || !editor.mirror.state.selection.empty)
			return

		const pos = editor.mirror.state.doc.resolve(editor.mirror.state.selection.from + 1)
		Announcer.interrupt("text-editor/format/inline", announce => {
			const markTypes = Object.keys(schema.marks) as Marks[]

			let hadActive = false
			for (const type of markTypes) {
				if (!isMarkActive(schema.marks[type], pos))
					continue

				hadActive = true
				announce(`component/text-editor/formatting/${type}`)
			}

			if (!hadActive)
				announce("component/text-editor/formatting/none")
		})
	})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Toolbar

	////////////////////////////////////
	//#region Components

	type ButtonType = keyof { [N in Quilt.SimpleKey as N extends `component/text-editor/toolbar/button/${infer N}` ? N extends `${string}/${string}` ? never : N : never]: true }
	type UnsimpleButtonType = keyof { [N in keyof Quilt as N extends `component/text-editor/toolbar/button/${infer N}` ? N extends `${string}/${string}` ? never : N : never]: true }

	const ToolbarButtonGroup = Component.Builder(component => component
		.ariaRole("group")
		.style("text-editor-toolbar-button-group"))

	const ToolbarButtonMark = Component.Builder((_, type: Marks) => {
		const mark = schema.marks[type]
		const toggler = markToggler(mark)
		const markActive = state.map(state => isMarkActive(mark))
		return Checkbutton()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
			.style.bind(markActive, "text-editor-toolbar-button--enabled")
			.use(markActive)
			.clearPopover()
			.event.subscribe("click", event => {
				event.preventDefault()
				toggler()
			})
	})

	type UsableNodes = keyof { [N in keyof Quilt as N extends `component/text-editor/toolbar/button/${infer N extends Strings.Replace<Nodes, "_", "-">}` ? N : never]: true }
	const ToolbarButtonWrap = Component.Builder((_, type: UsableNodes) =>
		ToolbarButtonWrapAny(type, schema.nodes[type.replaceAll("-", "_")]))
	const ToolbarButtonWrapAny = Component.Builder((_, type: ButtonType, node: NodeType, attrs?: Attrs) => {
		const wrap = wrapper(node, attrs)
		return Button()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
			.clearPopover()
			.event.subscribe("click", event => {
				event.preventDefault()
				wrap()
			})
	})

	const ToolbarButtonBlockType = Component.Builder((_, type: UsableNodes) => {
		const node = schema.nodes[type.replaceAll("-", "_")]
		const toggle = blockTypeToggler(node)
		const typeActive = state.map(state => isTypeActive(node))
		return RadioButton()
			.setName(`text-editor-${id}-block-type`)
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
			.style.bind(typeActive, "text-editor-toolbar-button--enabled")
			.use(typeActive)
			.clearPopover()
			.event.subscribe("click", event => {
				event.preventDefault()
				toggle()
			})
	})

	const ToolbarButtonPopover = Component.Builder((_, type: ButtonType, initialiser: (popover: Popover) => any) =>
		ToolbarButtonPopoverNoLabel(type, initialiser)
			.ariaLabel.use(`component/text-editor/toolbar/button/${type}`))

	const ToolbarButtonPopoverNoLabel = Component.Builder((_, type: UnsimpleButtonType, initialiser: (popover: Popover) => any) => {
		return Button()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`, "text-editor-toolbar-button--has-popover")
			.popover("hover", (popover, button) => {
				popover
					.style("text-editor-toolbar-popover")
					.anchor.add("aligned left", "off bottom")
					.setMousePadding(20)
					.tweak(initialiser)

				button.style.bind(popover.visible, "text-editor-toolbar-button--has-popover-visible")
			})
	})

	let inTransaction = false
	function wrapCmd (cmd: Command): () => void {
		return () => {
			if (!state.value)
				return

			inTransaction = true
			cmd(state.value, editor.mirror?.dispatch, editor.mirror)
			editor.document?.focus()
			inTransaction = false
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
						throw new Error("Unable to strip nodes, unable to resolve new range")

					tr.stripNodeType(range, schema.nodes.text_align)
					tr.scrollIntoView()

					dispatch(tr)
				}
				return true
			})

		return wrapCmd(wrapIn(node, attrs))
	}

	function blockTypeToggler (node: NodeType) {
		return wrapCmd(setBlockType(node))
	}

	//#endregion
	////////////////////////////////////

	const toolbar = Component()
		.style("text-editor-toolbar")
		.ariaRole("toolbar")
		.append(ToolbarButtonGroup()
			.ariaLabel.use("component/text-editor/toolbar/group/inline")
			.append(ToolbarButtonMark("strong"))
			.append(ToolbarButtonMark("em"))
			.append(ToolbarButtonPopover("other-formatting", popover => popover
				.append(ToolbarButtonMark("underline"))
				.append(ToolbarButtonMark("strikethrough"))
				.append(ToolbarButtonMark("subscript"))
				.append(ToolbarButtonMark("superscript"))
				.append(ToolbarButtonMark("code"))
			)))
		.append(ToolbarButtonGroup()
			.ariaLabel.use("component/text-editor/toolbar/group/block")
			.append(
				ToolbarButtonPopoverNoLabel("align", popover => popover
					.append(ToolbarButtonWrapAny("align-left", schema.nodes.text_align, { align: "left" }))
					.append(ToolbarButtonWrapAny("align-centre", schema.nodes.text_align, { align: "center" }))
					.append(ToolbarButtonWrapAny("align-right", schema.nodes.text_align, { align: "right" }))
				)
					.tweak(button => {
						state.use(button, () => {
							const align = !editor?.mirror?.hasFocus() && !inTransaction ? "left" : getAlign() ?? "mixed"
							button.ariaLabel.set(quilt["component/text-editor/toolbar/button/align"](
								quilt[`component/text-editor/toolbar/button/align/currently/${align}`]()
							).toString())
							button.style.remove("text-editor-toolbar-align-left", "text-editor-toolbar-align-centre", "text-editor-toolbar-align-right", "text-editor-toolbar-align-mixed")
							button.style(`text-editor-toolbar-align-${align}`)
						})
					})
			))
		.append(ToolbarButtonGroup()
			.ariaLabel.use("component/text-editor/toolbar/group/block-type")
			.ariaRole("radiogroup")
			.append(ToolbarButtonBlockType("paragraph"))
			.append(ToolbarButtonBlockType("code-block")))
		.append(ToolbarButtonGroup()
			.ariaLabel.use("component/text-editor/toolbar/group/wrapper")
			.append(ToolbarButtonWrap("blockquote")))
		.appendTo(component)

	//#endregion
	////////////////////////////////////

	let label: Label | undefined
	const stopUsingLabel = () => {
		label?.event.unsubscribe("remove", stopUsingLabel)
		label = undefined
	}
	editor = component
		.and(Input)
		.style("text-editor")
		.event.subscribe("click", (event) => {
			const target = Component.get(event.target)
			if (target !== toolbar && !target?.is(TextEditor))
				return

			editor.document?.focus()
		})
		.extend<TextEditorExtensions & Partial<InputExtensions>>(editor => ({
			toolbar,
			setRequired (required = true) {
				editor.style.toggle(required, "text-editor--required")
				editor.required.value = required
				refresh()
				return editor
			},
			setLabel (newLabel) {
				label = newLabel
				label?.event.subscribe("remove", stopUsingLabel)
				refresh()
				return editor
			},
		}))

	editor
		.append(toolbar)
		.append(Slot()
			.use(isMarkdown, (slot, isMarkdown) => {
				if (isMarkdown) {
					state.value = undefined
					return
				}

				return createDefaultView(slot)
			}))

	return editor

	////////////////////////////////////
	//#region ProseMirror Init

	function createDefaultView (slot: Slot) {
		const view = new EditorView(slot.element, {
			state: EditorState.create({
				doc: markdownParser.parse(content.value),
				plugins: [
					buildInputRules(schema),
					keymap(buildKeymap(schema, {})),
					keymap(baseKeymap),
					keymap({
						"Mod-s": toggleMark(schema.marks.strikethrough),
						"Mod-S": toggleMark(schema.marks.strikethrough),
						"Mod-.": toggleMark(schema.marks.superscript),
						"Mod-,": toggleMark(schema.marks.subscript),
						"Alt-Ctrl-0": setBlockType(schema.nodes.paragraph),
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
			.ariaRole("textbox")
			.style("text-editor-document")
			.setId(`text-editor-${id}`)
			.attributes.set("aria-multiline", "true")

		toolbar.ariaControls(editor.document)
		refresh()

		return () => {
			content.value = defaultMarkdownSerializer.serialize(view.state.doc)
			editor.mirror = undefined
			editor.document = undefined
			refresh()
			view.destroy()
		}
	}

	//#endregion
	////////////////////////////////////

	function refresh () {
		label?.setInput(editor.document)
		editor.document?.setName(label?.for)
		editor.document?.setId(label?.for)
		label?.setId(label.for.map(v => `${v}-label`))
		toolbar.ariaLabelledBy(label)
		editor.document?.ariaLabelledBy(label)
		editor.document?.attributes.toggle(editor.required.value, "aria-required", "true")
	}

	function isMarkActive (type: MarkType, pos?: ResolvedPos) {
		if (!state.value)
			return false

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos)
			return !!type.isInSet(state.value.storedMarks || pos.marks())

		return state.value.doc.rangeHasMark(selection.from, selection.to, type)
	}

	function isTypeActive (type: NodeType, pos?: ResolvedPos) {
		if (!state.value)
			return false

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos)
			return !!pos.closest(type)

		let found = false
		state.value.doc.nodesBetween(selection.from, selection.to, node => {
			found ||= node.type === type
		})
		return found
	}

	function getAlign (pos?: ResolvedPos): "left" | "centre" | "right" | undefined {
		if (!state.value)
			return undefined

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const align = pos.closest(schema.nodes.text_align)?.attrs.align ?? "left"
			return align === "center" ? "centre" : align
		}

		const align1 = getAlign(selection.$from)
		const align2 = getAlign(selection.$to)
		if (align1 === align2)
			return align1

		return undefined
	}
})

export default TextEditor
