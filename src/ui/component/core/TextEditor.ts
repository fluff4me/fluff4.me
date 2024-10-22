import MarkdownIt from "markdown-it"
import { baseKeymap, setBlockType, toggleMark, wrapIn } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { buildInputRules, buildKeymap } from "prosemirror-example-setup"
import { gapCursor } from "prosemirror-gapcursor"
import { history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import type { ParseSpec } from "prosemirror-markdown"
import { schema as baseSchema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser } from "prosemirror-markdown"
import type { MarkSpec, MarkType, NodeSpec, NodeType } from "prosemirror-model"
import { Schema } from "prosemirror-model"
import type { Command, PluginSpec, PluginView } from "prosemirror-state"
import { EditorState, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import Announcer from "ui/Announcer"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import Checkbutton from "ui/component/core/Checkbutton"
import type { InputExtensions } from "ui/component/core/extension/Input"
import Input from "ui/component/core/extension/Input"
import type Label from "ui/component/core/Label"
import Slot from "ui/component/core/Slot"
import Arrays from "utility/Arrays"
import State from "utility/State"
import w3cKeyname from "w3c-keyname"

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

type BaseSchemaNodes = (typeof baseSchema) extends Schema<infer NODES, any> ? NODES : never
type BaseSchemaMarks = (typeof baseSchema) extends Schema<any, infer MARKS> ? MARKS : never
const schema = new Schema({
	nodes: {
		...baseSchema.spec.nodes.toObject() as Record<BaseSchemaNodes, NodeSpec>,
	},
	marks: {
		...baseSchema.spec.marks.toObject() as Record<BaseSchemaMarks, MarkSpec>,
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
			toDOM () { return ["s"] },
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

const markdownSpec: Record<string, ParseSpec> = {
	...defaultMarkdownParser.tokens,
	underline: {
		mark: "underline",
	},
}
delete markdownSpec.image
const markdownParser = new MarkdownParser(schema, MarkdownIt("commonmark", { html: true }), markdownSpec)

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

	const state = State<EditorState | undefined>(undefined)

	////////////////////////////////////
	//#region ToolbarButton

	const ToolbarButtonMark = Component.Builder((_, mark: MarkType) => {
		const toggler = markToggler(mark)
		const markActive = state.map(state => isMarkActive(mark))
		return Checkbutton()
			.style("text-editor-toolbar-button")
			.style.bind(markActive, "text-editor-toolbar-button--enabled")
			.use(markActive)
			.event.subscribe("click", event => {
				event.preventDefault()
				toggler()
			})
	})

	const ToolbarButtonWrap = Component.Builder((_, node: NodeType) => {
		const wrap = wrapper(node)
		return Button()
			.style("text-editor-toolbar-button")
			.event.subscribe("click", event => {
				event.preventDefault()
				wrap()
			})
	})

	const ToolbarButtonBlockType = Component.Builder((_, node: NodeType) => {
		const toggle = blockTypeToggler(node)
		return Button()
			.style("text-editor-toolbar-button")
			.event.subscribe("click", event => {
				event.preventDefault()
				toggle()
			})
	})

	function isMarkActive (type: MarkType) {
		if (!state.value)
			return false

		const { from, $from, to, empty } = state.value.selection
		if (empty)
			return !!type.isInSet(state.value.storedMarks || $from.marks())

		return state.value.doc.rangeHasMark(from, to, type)
	}

	function wrapCmd (cmd: Command): () => void {
		return () => {
			if (!state.value)
				return

			cmd(state.value, editor.mirror?.dispatch, editor.mirror)
			editor.document?.focus()
		}
	}

	function markToggler (type: MarkType) {
		return wrapCmd(toggleMark(type))
	}

	function wrapper (node: NodeType) {
		return wrapCmd(wrapIn(node))
	}

	function blockTypeToggler (node: NodeType) {
		return wrapCmd(setBlockType(node))
	}

	//#endregion
	////////////////////////////////////

	const toolbar = Component()
		.style("text-editor-toolbar")
		.ariaRole("toolbar")
		.append(Component()
			.ariaRole("group")
			.ariaLabel("component/text-editor/toolbar/group/inline")
			.append(ToolbarButtonMark(schema.marks.strong).style("text-editor-toolbar-bold").ariaLabel("component/text-editor/toolbar/button/strong"))
			.append(ToolbarButtonMark(schema.marks.em).style("text-editor-toolbar-italic").ariaLabel("component/text-editor/toolbar/button/emphasis"))
			.append(ToolbarButtonMark(schema.marks.underline).style("text-editor-toolbar-underline").ariaLabel("component/text-editor/toolbar/button/underline"))
			.append(ToolbarButtonMark(schema.marks.strikethrough).style("text-editor-toolbar-strikethrough").ariaLabel("component/text-editor/toolbar/button/strikethrough"))
			.append(ToolbarButtonMark(schema.marks.subscript).style("text-editor-toolbar-subscript").ariaLabel("component/text-editor/toolbar/button/subscript"))
			.append(ToolbarButtonMark(schema.marks.superscript).style("text-editor-toolbar-superscript").ariaLabel("component/text-editor/toolbar/button/superscript"))
			.append(ToolbarButtonMark(schema.marks.code).style("text-editor-toolbar-code").ariaLabel("component/text-editor/toolbar/button/code")))
		.append(Component()
			.ariaRole("group")
			.ariaLabel("component/text-editor/toolbar/group/block")
			.append(ToolbarButtonWrap(schema.nodes.blockquote).style("text-editor-toolbar-blockquote").ariaLabel("component/text-editor/toolbar/button/blockquote"))
			.append(ToolbarButtonBlockType(schema.nodes.code_block).style("text-editor-toolbar-code").ariaLabel("component/text-editor/toolbar/button/codeblock")))
		.appendTo(component)

	let label: Label | undefined
	const unuseLabel = () => {
		label?.event.unsubscribe("remove", unuseLabel)
		label = undefined
	}
	const editor = component
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
				label?.event.subscribe("remove", unuseLabel)
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

									if (editor.document?.element.contains(document.activeElement)) {
										Announcer.announce("text-editor/format/inline", announce => {
											if (!isMarkActive(schema.marks.em) && !isMarkActive(schema.marks.strong))
												announce("component/text-editor/formatting/none")
											else {
												if (isMarkActive(schema.marks.em))
													announce("component/text-editor/formatting/emphasis")
												if (isMarkActive(schema.marks.strong))
													announce("component/text-editor/formatting/strong")
											}
										})
									}
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

	function refresh () {
		label?.setInput(editor.document)
		editor.document?.setName(label?.for)
		editor.document?.setId(label?.for)
		label?.setId(label.for.map(v => `${v}-label`))
		toolbar.ariaLabelledBy(label)
		editor.document?.ariaLabelledBy(label)
		editor.document?.attributes.toggle(editor.required.value, "aria-required", "true")
	}
})

export default TextEditor
