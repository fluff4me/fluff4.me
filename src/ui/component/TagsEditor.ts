import type { TagId } from "model/Tags"
import Tags from "model/Tags"
import Component from "ui/Component"
import type { InputExtensions } from "ui/component/core/ext/Input"
import Input from "ui/component/core/ext/Input"
import Slot from "ui/component/core/Slot"
import TextInput from "ui/component/core/TextInput"
import Tag from "ui/component/Tag"
import Applicator from "ui/utility/Applicator"
import AbortPromise from "utility/AbortPromise"
import State from "utility/State"

export interface TagsState {
	global_tags: TagId[]
	custom_tags: string[]
}

interface TagsEditorExtensions {
	readonly state: State<TagsState>
	readonly default: Applicator.Optional<this, Partial<TagsState>>
}

interface TagsEditor extends Component, TagsEditorExtensions, InputExtensions { }

const TagsEditor = Component.Builder((component): TagsEditor => {
	const tagsState = State<TagsState>({ global_tags: [], custom_tags: [] })

	const tagsContainer = Slot()
		.style("tags-editor-added")
		.use(tagsState, AbortPromise.asyncFunction(async (signal, slot, tags) => {
			const globalTags = await Tags.resolve(tags.global_tags)
			if (signal.aborted)
				return

			if (globalTags.length)
				Component()
					.style("tags-editor-added-type", "tags-editor-added-global")
					.append(...globalTags.map(tag => Tag(tag)))
					.appendTo(slot)

			if (tags.custom_tags.length)
				Component()
					.style("tags-editor-added-type", "tags-editor-added-custom")
					.append(...tags.custom_tags.map(tag => Tag(tag)))
					.appendTo(slot)
		}))

	const input = TextInput()
		.style("tags-editor-input")
		.placeholder.use("view/work-edit/shared/form/tags/placeholder")

	const tagSuggestions = Component().style("tags-editor-suggestions")
	const tagCustomSuggestions = Component().style("tags-editor-suggestions-type").appendTo(tagSuggestions)
	const tagCategorySuggestions = Component().style("tags-editor-suggestions-type").appendTo(tagSuggestions)
	const tagGlobalSuggestions = Component().style("tags-editor-suggestions-type").appendTo(tagSuggestions)

	const editor: TagsEditor = component
		.and(Input)
		.style("tags-editor")
		.append(tagsContainer)
		.append(input)
		.append(tagSuggestions)
		.extend<TagsEditorExtensions>(editor => ({
			state: tagsState,
			get tags () {
				return tagsState.value
			},
			default: Applicator(editor, value =>
				tagsState.value = { global_tags: value?.global_tags?.slice() ?? [], custom_tags: value?.custom_tags?.slice() ?? [] }),
		}))

	input.event.subscribe("keydown", event => {
		if (event.key === "Enter" && input.value.trim()) {
			event.preventDefault()
		}

		updateSuggestions()
	})

	editor.length.value = 0
	return editor

	function updateSuggestions () {
		tagCustomSuggestions
		tagCategorySuggestions
		tagGlobalSuggestions
	}
})

export default TagsEditor
