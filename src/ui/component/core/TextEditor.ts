import MarkdownIt from "markdown-it"
import { baseKeymap, setBlockType, toggleMark, wrapIn } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { buildInputRules, buildKeymap } from "prosemirror-example-setup"
import { gapCursor } from "prosemirror-gapcursor"
import { history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import type { ParseSpec } from "prosemirror-markdown"
import { schema as baseSchema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser } from "prosemirror-markdown"
import type { MarkSpec, MarkType, NodeSpec, NodeType, ResolvedPos } from "prosemirror-model"
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
import type Popover from "ui/component/core/Popover"
import Slot from "ui/component/core/Slot"
import type { Quilt } from "ui/utility/TextManipulator"
import Arrays from "utility/Arrays"
import Objects from "utility/Objects"
import State from "utility/State"
import type Strings from "utility/Strings"
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

	const state = State<EditorState | undefined>(undefined)

	////////////////////////////////////
	//#region ToolbarButton

	const ToolbarButtonGroup = Component.Builder(component => component
		.ariaRole("group")
		.style("text-editor-toolbar-button-group"))

	const ToolbarButtonMark = Component.Builder((_, type: Marks) => {
		const mark = schema.marks[type]
		const toggler = markToggler(mark)
		const markActive = state.map(state => isMarkActive(mark))
		return Checkbutton()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`)
			.ariaLabel(`component/text-editor/toolbar/button/${type}`)
			.style.bind(markActive, "text-editor-toolbar-button--enabled")
			.use(markActive)
			.clearPopover()
			.event.subscribe("click", event => {
				event.preventDefault()
				toggler()
			})
	})

	type UsableNodes = keyof { [N in keyof Quilt as N extends `component/text-editor/toolbar/button/${infer N extends Strings.Replace<Nodes, "_", "-">}` ? N : never]: true }
	const ToolbarButtonWrap = Component.Builder((_, type: UsableNodes) => {
		const node = schema.nodes[type.replaceAll("-", "_")]
		const wrap = wrapper(node)
		return Button()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`)
			.ariaLabel(`component/text-editor/toolbar/button/${type}`)
			.clearPopover()
			.event.subscribe("click", event => {
				event.preventDefault()
				wrap()
			})
	})

	const ToolbarButtonBlockType = Component.Builder((_, type: UsableNodes) => {
		const node = schema.nodes[type.replaceAll("-", "_")]
		const toggle = blockTypeToggler(node)
		return Button()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`)
			.ariaLabel(`component/text-editor/toolbar/button/${type}`)
			.clearPopover()
			.event.subscribe("click", event => {
				event.preventDefault()
				toggle()
			})
	})

	type ButtonType = keyof { [N in keyof Quilt as N extends `component/text-editor/toolbar/button/${infer N}` ? N : never]: true }
	const ToolbarButtonPopover = Component.Builder((_, type: ButtonType, initialiser: (popover: Popover) => any) => {
		return Button()
			.style("text-editor-toolbar-button", `text-editor-toolbar-${type}`, "text-editor-toolbar-button--has-popover")
			.ariaLabel(`component/text-editor/toolbar/button/${type}`)
			.popover("hover", (popover, button) => {
				popover
					.style("text-editor-toolbar-popover")
					.anchor.add("aligned left", "off bottom")
					.setMousePadding(20)
					.tweak(initialiser)

				button.style.bind(popover.visible, "text-editor-toolbar-button--has-popover-visible")
			})
	})

	function isMarkActive (type: MarkType, pos?: ResolvedPos) {
		if (!state.value)
			return false

		const selection = state.value.selection
		pos ??= !selection.empty ? undefined : selection.$from
		if (pos)
			return !!type.isInSet(state.value.storedMarks || pos.marks())

		return state.value.doc.rangeHasMark(selection.from, selection.to, type)
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
		.append(ToolbarButtonGroup()
			.ariaLabel("component/text-editor/toolbar/group/inline")
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
			.ariaLabel("component/text-editor/toolbar/group/block")
			.append(ToolbarButtonWrap("blockquote"))
			.append(ToolbarButtonBlockType("code-block")))
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

									if (editor.mirror?.hasFocus() && editor.mirror.state.selection.empty) {
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
