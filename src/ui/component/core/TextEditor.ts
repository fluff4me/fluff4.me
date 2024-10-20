import { baseKeymap } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { buildInputRules, buildKeymap } from "prosemirror-example-setup"
import { gapCursor } from "prosemirror-gapcursor"
import { history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { defaultMarkdownParser, defaultMarkdownSerializer, schema } from "prosemirror-markdown"
import type { PluginSpec, PluginView } from "prosemirror-state"
import { EditorState, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import Component from "ui/Component"
import type { InputExtensions } from "ui/component/core/extension/Input"
import Input from "ui/component/core/extension/Input"
import type Label from "ui/component/core/Label"
import Slot from "ui/component/core/Slot"
import State from "utility/State"

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

	const toolbar = Component()
		.style("text-editor-toolbar")
		.ariaRole("toolbar")
		.appendTo(component)

	let label: Label | undefined
	const unuseLabel = () => {
		label?.event.unsubscribe("remove", unuseLabel)
		label = undefined
	}
	const editor = component
		.and(Input)
		.style("text-editor")
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
				if (isMarkdown)
					return

				return createDefaultView(slot)
			}))

	return editor

	function createDefaultView (slot: Slot) {
		const view = new EditorView(slot.element, {
			state: EditorState.create({
				doc: defaultMarkdownParser.parse(content.value),
				plugins: [
					buildInputRules(schema),
					keymap(buildKeymap(schema, {})),
					keymap(baseKeymap),
					dropCursor(),
					gapCursor(),
					history(),
					new Plugin({
						view () {
							return {

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
		editor.document?.ariaLabelledBy(label)
		editor.document?.attributes.toggle(editor.required.value, "aria-required", "true")
	}
})

export default TextEditor
