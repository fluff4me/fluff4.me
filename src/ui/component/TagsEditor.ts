import type { TagId } from 'model/Tags'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import { BlockClasses } from 'ui/component/core/Block'
import type { InputExtensions, InvalidMessageText } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import Sortable, { SortableDefinition } from 'ui/component/core/ext/Sortable'
import ProgressWheel from 'ui/component/core/ProgressWheel'
import Slot from 'ui/component/core/Slot'
import TextInput, { FilterFunction } from 'ui/component/core/TextInput'
import type { TagData } from 'ui/component/Tag'
import Tag from 'ui/component/Tag'
import { AllowYOffscreen } from 'ui/utility/AnchorManipulator'
import Applicator from 'ui/utility/Applicator'
import AbortPromise from 'utility/AbortPromise'
import Mouse from 'utility/Mouse'
import type { StateOr } from 'utility/State'
import State from 'utility/State'
import Strings from 'utility/string/Strings'
import Task from 'utility/Task'

export interface TagsState {
	global_tags: TagId[]
	custom_tags: string[]
}

interface TagsEditorExtensions {
	readonly state: State.Mutable<TagsState>
	readonly default: Applicator.Optional<this, Partial<TagsState>>
	readonly maxLengthGlobal: State<number | undefined>
	readonly maxLengthCustom: State<number | undefined>
	readonly lengthGlobal: State.Generator<number>
	readonly lengthCustom: State.Generator<number>
	readonly touched: State<boolean>
	readonly input: TextInput
	readonly inputWrapper: Component
	setMaxLengthGlobal (maxLength?: StateOr<number | undefined>): this
	setMaxLengthCustom (maxLength?: StateOr<number | undefined>): this
	setCustomTagsOnly (): this
	setGlobalTagsOnly (): this
}

interface TagsEditor extends Component, TagsEditorExtensions, InputExtensions { }

const TagsEditor = Component.Builder((component): TagsEditor => {
	const tagsState = State<TagsState>({ global_tags: [], custom_tags: [] })
	const touched = State(false)

	const tagTypeFilter = State<undefined | 'global' | 'custom'>(undefined)

	////////////////////////////////////
	//#region Current

	const tagsContainer = Slot()
		.style('tags-editor-current')
		.use(tagsState, AbortPromise.asyncFunction(async (signal, slot, tags) => {
			const globalTags = await Tags.resolve(tags.global_tags)
			if (signal.aborted)
				return

			if (globalTags.length)
				Component()
					.and(Sortable as Sortable.BuilderOf<TagId>, SortableDefinition({
						stickyDistance: 10,
						getID: component => getTagID(component.as(Tag)?.tag) as TagId | undefined,
						onOrderChange: order => tagsState.value.global_tags.splice(0, Infinity, ...order),
					}))
					.style('tags-editor-current-type', 'tags-editor-current-global')
					.append(...globalTags.map(tag => Tag(tag)
						.setNavigationDisabled(true)
						.event.subscribe('auxclick', event => event.preventDefault())
						.event.subscribe('mouseup', event => Mouse.handleMiddle(event) && removeTag(tag))
						.addDeleteButton(() => removeTag(tag))
					))
					.appendTo(slot)

			if (tags.custom_tags.length)
				Component()
					.and(Sortable as Sortable.BuilderOf<string>, SortableDefinition({
						stickyDistance: 10,
						getID: component => getTagID(component.as(Tag)?.tag),
						onOrderChange: order => tagsState.value.custom_tags.splice(0, Infinity, ...order),
					}))
					.style('tags-editor-current-type', 'tags-editor-current-custom')
					.append(...tags.custom_tags.map(tag => Tag(tag)
						.setNavigationDisabled(true)
						.event.subscribe('auxclick', event => event.preventDefault())
						.event.subscribe('mouseup', event => Mouse.handleMiddle(event) && removeTag(tag))
						.addDeleteButton(() => removeTag(tag))
					))
					.appendTo(slot)

			const hasTags = !!globalTags.length || !!tags.custom_tags.length
			tagsContainer.style.toggle(hasTags, 'tags-editor-current')
		}))

	function getTagID (tag?: string | TagData) {
		return !tag ? '' : typeof tag === 'string' ? tag : `${tag.category}: ${tag.name}`
	}

	//#endregion
	////////////////////////////////////

	const inputWrapper = Component()
		.style('text-input', 'tags-editor-input-wrapper')
		.event.subscribe('click', () => input.focus())

	const input = TextInput()
		.style('tags-editor-input')
		.style.remove('text-input')
		.placeholder.use('shared/form/tags/placeholder')
		.filter(TagsFilter)
		.appendTo(inputWrapper)

	////////////////////////////////////
	//#region Suggestions

	const hasOrHadFocus = State.Some(component, component.hasFocused, component.hadFocusedLast)

	const suggestions = Slot()
		.style('tags-editor-suggestions')
		.use(State.UseManual(
			{
				tags: tagsState,
				filter: input.state,
				focus: hasOrHadFocus,
			}),
			AbortPromise.asyncFunction(async (signal, slot, { tags, filter, focus }) => {
				if (!filter && !focus)
					return

				const manifest = await Tags.getManifest()
				if (signal.aborted)
					return

				let [category, name] = Strings.splitOnce(filter, ':')
				if (name === undefined)
					name = category, category = ''

				category = category.trim(), name = name.trim()

				if (tagTypeFilter.value !== 'custom') {
					const categorySuggestions = category ? []
						: Object.values(manifest.categories)
							.filter(category => category.nameLowercase.startsWith(name))
							// only include categories that have tags that haven't been added yet
							.filter(category => Object.entries(manifest.tags)
								.some(([tagId, tag]) => tag.category === category.name && !tags.global_tags.some(added => tagId === added)))
							.sort(
								category => -Object.values(manifest.tags).filter(tag => tag.category === category.name).length,
								(a, b) => a.name.localeCompare(b.name),
							)
							.map(category => Tag.Category(category)
								.event.subscribe('click', () => input.value = `${category.name}: `))

					if (categorySuggestions.length)
						Component()
							.style('tags-editor-suggestions-type')
							.append(...categorySuggestions)
							.appendTo(slot)

					const tagSuggestions = category
						? Object.entries(manifest.tags)
							.filter(([, tag]) => tag.categoryLowercase.startsWith(category) && tag.nameLowercase.startsWith(name))
						: name
							? Object.entries(manifest.tags)
								.filter(([, tag]) => tag.wordsLowercase.some(word => word.startsWith(name)))
							: []

					tagSuggestions.filterInPlace(([tagId]) => !tags.global_tags.some(added => added === tagId))
					if (tagSuggestions.length)
						Component()
							.style('tags-editor-suggestions-type')
							.append(...tagSuggestions.map(([, tag]) => Tag(tag)
								.setNavigationDisabled(true)
								.event.subscribe('click', (event: MouseEvent & Partial<PointerEvent>) => {
									tags.global_tags.push(`${tag.category}: ${tag.name}`)
									tagsState.emit()
									input.value = ''
									touched.value = true
									if (event.pointerType === '')
										input.focus()
								})
							))
							.appendTo(slot)
				}

				if (tagTypeFilter.value !== 'global') {
					const customTagSuggestions = select(() => {
						if (!name) return []
						if (!category) return [Tag(name)]
						return [Tag(`${name} ${category}`), Tag(`${category} ${name}`)]
					})
					if (customTagSuggestions.length)
						Component()
							.style('tags-editor-suggestions-type')
							.append(Component()
								.style('tags-editor-suggestions-type-label')
								.text.use('shared/form/tags/suggestion/add-as-custom'))
							.append(...customTagSuggestions.map(tag => tag
								.setNavigationDisabled(true)
								.event.subscribe('click', (event: MouseEvent & Partial<PointerEvent>) => {
									tags.custom_tags.push(tag.tag as string)
									tagsState.emit()
									input.value = ''
									touched.value = true
									if (event.pointerType === '')
										input.focus()
								})
							))
							.appendTo(slot)
				}

				if (slot.size)
					Component()
						.style('tags-editor-suggestions-label')
						.text.use('shared/form/tags/suggestion/label')
						.prependTo(slot)

				editor.rect.markDirty()
			})
		)
		.appendTo(inputWrapper)

	//#endregion
	////////////////////////////////////

	const hiddenInput = Component('input')
		.style('tags-editor-validity-pipe-input')
		.tabIndex('programmatic')
		.attributes.set('type', 'text')
		.setName(`tags-editor-validity-pipe-input-${Math.random().toString(36).slice(2)}`)

	const maxLengthGlobal = State<number | undefined>(undefined)
	const maxLengthCustom = State<number | undefined>(undefined)

	const editor: TagsEditor = component
		.and(Input)
		.style('tags-editor')
		.append(tagsContainer)
		.append(inputWrapper)
		.append(hiddenInput)
		.pipeValidity(hiddenInput)
		.extend<TagsEditorExtensions>(editor => ({
			state: tagsState,
			get tags () {
				return tagsState.value
			},
			default: Applicator(editor, value => tagsState.value = {
				global_tags: value?.global_tags?.slice() ?? [],
				custom_tags: value?.custom_tags?.slice() ?? [],
			}),
			touched,

			maxLengthGlobal, maxLengthCustom,
			lengthGlobal: tagsState.mapManual(tags => tags.global_tags.length),
			lengthCustom: tagsState.mapManual(tags => tags.custom_tags.length),
			setMaxLengthGlobal (maxLength) {
				if (State.is(maxLength))
					maxLengthGlobal.bind(component, maxLength)
				else
					maxLengthGlobal.value = maxLength
				return editor
			},
			setMaxLengthCustom (maxLength) {
				if (State.is(maxLength))
					maxLengthCustom.bind(component, maxLength)
				else
					maxLengthCustom.value = maxLength
				return editor
			},

			input,
			inputWrapper,
			setCustomTagsOnly () {
				tagTypeFilter.value = 'custom'
				return editor
			},
			setGlobalTagsOnly () {
				tagTypeFilter.value = 'global'
				return editor
			},
		}))

	editor.disableDefaultHintPopoverVisibilityHandling()
	hasOrHadFocus.subscribeManual(focus => editor.getPopover()?.toggle(focus).anchor.apply())
	editor.setCustomHintPopover(popover => popover
		.appendWhen(tagTypeFilter.falsy,
			Input.createHintText(quilt => quilt['shared/form/tags/hint/main']()),
			Input.createHintText(quilt => quilt['shared/form/tags/hint/global']()),
			ProgressWheel.Length(editor.lengthGlobal, editor.maxLengthGlobal),
			Input.createHintText(quilt => quilt['shared/form/tags/hint/custom']()),
			ProgressWheel.Length(editor.lengthCustom, editor.maxLengthCustom),
		)
		.anchor.reset()
		.anchor.from(input)
		.anchor.add('off right', `.${BlockClasses.Main}`, 'centre', AllowYOffscreen)
	)

	tagsState.use(editor, tags => {
		let invalid: InvalidMessageText
		if (tags.global_tags.length > (editor.maxLengthGlobal.value ?? Infinity))
			invalid = quilt => quilt['shared/form/invalid/tags/too-many-global']()
		else if (tags.custom_tags.length > (editor.maxLengthCustom.value ?? Infinity))
			invalid = quilt => quilt['shared/form/invalid/tags/too-many-custom']()

		editor.setCustomInvalidMessage(invalid)
	})

	input.event.subscribe('keydown', async event => {
		if (event.key === 'Enter') {
			event.preventDefault()
			suggestions.getFirstDescendant(Tag)?.element.click()
			touched.value = true
			await Task.yield()
			input.focus()
		}
	})

	return editor

	function removeTag (tag: TagData | string) {
		const tagString = typeof tag === 'string' ? tag : `${tag.category}: ${tag.name}`
		if (typeof tag === 'string')
			tagsState.value.custom_tags.filterInPlace(tag => tag !== tagString)
		else
			tagsState.value.global_tags.filterInPlace(tag => tag !== tagString)

		tagsState.emit()
		touched.value = true
	}
})

////////////////////////////////////
//#region Input Filter

const TagsFilter = FilterFunction((before, selected, after) => {
	before = filterTagSegment(before)
	selected = filterTagSegment(selected)
	after = filterTagSegment(after)

	if (before.includes(':')) {
		selected = selected.replaceAll(':', ' ')
		after = after.replaceAll(':', ' ')
	}
	else if (selected.includes(':')) {
		after = after.replaceAll(':', ' ')
	}

	const shouldTrimBeforeEnd = true
		&& before.endsWith(' ')
		&& (false
			|| selected.startsWith(' ') || selected.startsWith(':')
			|| (!selected && (after.startsWith(' ') || after.startsWith(':')))
		)
	if (shouldTrimBeforeEnd)
		before = before.trimEnd()

	if (selected.endsWith(' ') && (after.startsWith(' ') || after.startsWith(':')))
		selected = selected.trimEnd()

	before = before.trimStart()
	after = after.trimEnd()
	if (!before)
		selected = selected.trimStart()
	if (!after)
		selected = selected.trimEnd()

	return [before, selected, after]
})

export function filterTagSegment (text: string) {
	return text.toLowerCase()
		.replace(/[^\w/!?&$'.,: -]/g, ' ')
		.replace(/(?<=:.*?):/g, ' ')
		.replace(/ {2,}/g, ' ')
		.replace(' :', ':')
}

//#endregion
////////////////////////////////////

export default TagsEditor
