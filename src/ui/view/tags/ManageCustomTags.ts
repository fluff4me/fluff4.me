import EndpointTagCustomDelete from 'endpoint/tag/EndpointTagCustomDelete'
import EndpointTagCustomPromote from 'endpoint/tag/EndpointTagCustomPromote'
import EndpointTagCustomRename from 'endpoint/tag/EndpointTagCustomRename'
import type { TagsManifest } from 'model/Tags'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Heading from 'ui/component/core/Heading'
import LabelledRow from 'ui/component/core/LabelledRow'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import TextInput from 'ui/component/core/TextInput'
import Tag from 'ui/component/Tag'
import TagBlock from 'ui/component/TagBlock'
import TagsEditor, { filterTagSegment } from 'ui/component/TagsEditor'
import TagEditForm from 'ui/view/tags/TagEditForm'
import AbortPromise from 'utility/AbortPromise'
import Arrays from 'utility/Arrays'
import State from 'utility/State'

export default Component.Builder((component, manifest: State<TagsManifest | undefined>, customTags: State<string[]>) => {
	const block = component.and(Block)
	block.content.style('view-type-manage-tags-tag-block')

	const filter = TextInput()
		.placeholder.use('view/manage-tags/shared/hint/filter')
		.appendTo(block.content)

	const filteredIn = (tag: string) => !filter.state.value.length || tag.includes(filter.state.value)

	const tagList = Component()
		.style('view-type-manage-tags-tag-list')
		.appendTo(block.content)

	const selectedTags = State<string[]>([])
	let lastAdded: string | undefined
	let lastRemoved: string | undefined

	customTags.use(tagList, customTags => {
		tagList.removeContents()

		for (const tag of customTags.sort((a, b) => a.localeCompare(b))) {
			const selected = selectedTags.mapManual(tags => tags.includes(tag))
			const filteredOut = State.MapManual([filter.state, selected],
				(text, selected) => !selected && !filteredIn(tag))

			Tag(tag)
				.style('view-type-manage-tags-tag')
				.style.bind(filteredOut, 'view-type-manage-tags-tag--filtered-out')
				.style.bind(selected, 'tag--selected', 'view-type-manage-tags-tag--selected')
				.event.subscribe('click', event => {
					const previousSelectedTags = selectedTags.value.slice()

					if (selectedTags.value.includes(tag)) {
						if (event.shiftKey && event.altKey && lastRemoved && lastRemoved !== tag) {
							const otherIndex = customTags.indexOf(lastRemoved)
							const thisIndex = customTags.indexOf(tag)
							const start = Math.min(otherIndex, thisIndex)
							const end = Math.max(otherIndex, thisIndex)
							Arrays.remove(selectedTags.value, ...customTags.slice(start, end + 1).filter(filteredIn))
							selectedTags.emit(previousSelectedTags)
							return
						}

						lastRemoved = tag
						Arrays.remove(selectedTags.value, tag)
						selectedTags.emit(previousSelectedTags)
						return
					}

					if (event.shiftKey && lastAdded && lastAdded !== tag) {
						const otherIndex = customTags.indexOf(lastAdded)
						const thisIndex = customTags.indexOf(tag)
						const start = Math.min(otherIndex, thisIndex)
						const end = Math.max(otherIndex, thisIndex)
						Arrays.add(selectedTags.value, ...customTags.slice(start, end + 1).filter(filteredIn))
						selectedTags.emit(previousSelectedTags)
						return
					}

					lastAdded = tag
					Arrays.add(selectedTags.value, tag)
					selectedTags.emit(previousSelectedTags)
				})
				.appendTo(tagList)
		}
	})

	Component()
		.style('view-type-manage-tags-tag-list')
		.append(Heading()
			.setAestheticStyle(false)
			.style('view-type-manage-tags-section-heading')
			.text.use('view/manage-tags/shared/label/selected-tags'))
		.append(Slot().use(selectedTags, (slot, tags) => {
			for (const tag of tags) {
				Tag(tag)
					.style('view-type-manage-tags-tag', 'tag--selected', 'view-type-manage-tags-tag--selected')
					.event.subscribe('click', () => {
						const previousSelectedTags = selectedTags.value.slice()
						Arrays.remove(selectedTags.value, tag)
						selectedTags.emit(previousSelectedTags)
					})
					.appendTo(slot)
			}
		}))
		.appendToWhen(selectedTags.mapManual(tags => !!tags.length), block.content)

	Placeholder()
		.text.use('view/manage-tags/shared/hint/select-tags')
		.appendToWhen(selectedTags.mapManual(tags => !tags.length), block.footer.left)

	////////////////////////////////////
	//#region Rename

	const renameTab = Tab()
		.text.use('view/manage-tags/custom-tags/action/rename')

	const renameRow = ActionRow()
		.style('view-type-manage-tags-custom-tag-action-rename-row')
		.appendTo(renameTab.content)
	const renameInput = TextInput()
		.placeholder.use('view/manage-tags/custom-tags/hint/rename')
		.appendTo(renameRow.left)

	const renameButton = Button()
		.type('primary')
		.text.use('view/manage-tags/custom-tags/action/rename')
		.event.subscribe('click', async () => {
			const oldName = selectedTags.value[0]
			const newName = filterTagSegment(renameInput.state.value)
			if (!newName || newName === oldName)
				return

			const confirmed = await ConfirmDialog.prompt(renameButton, { dangerToken: 'tag-modify' })
			if (!confirmed)
				return

			const response = await EndpointTagCustomRename.query({ params: { name: oldName }, body: { name: newName } })
			if (toast.handleError(response))
				return

			const previousSelectedTags = selectedTags.value.slice()
			Arrays.remove(selectedTags.value, oldName)
			Arrays.remove(customTags.value, oldName)
			Arrays.add(customTags.value, newName)
			selectedTags.emit(previousSelectedTags)
			customTags.emit()

			renameInput.value = ''
		})
		.appendTo(renameRow.right)

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Promote

	const promoteTab = Tab()
		.text.use('view/manage-tags/custom-tags/action/promote')

	////////////////////////////////////
	//#region Into New Tag

	const promoteNewTag = Tab()
		.text.use('view/manage-tags/custom-tags/action/promote/new-tag')

	const newTagForm = TagEditForm(manifest)
		.appendTo(promoteNewTag.content)

	selectedTags.subscribeManual((newTags, oldTags) => {
		const addedTags = newTags.filter(tag => !oldTags?.includes(tag))
		const removedTags = oldTags?.filter(tag => !newTags.includes(tag))
		Arrays.add(newTagForm.aliasesEditor.state.value.custom_tags, ...addedTags)
		Arrays.remove(newTagForm.aliasesEditor.state.value.custom_tags, ...removedTags ?? [])
		newTagForm.aliasesEditor.state.emit()
	})

	newTagForm.submit
		.text.use('view/manage-tags/custom-tags/action/promote')
		.event.subscribe('click', async () => {
			const promotedTags = selectedTags.value.slice()
			if (!promotedTags.length)
				return

			const newTag = newTagForm.getFormData()
			if (!newTag)
				return

			const response = await EndpointTagCustomPromote.query({
				body: {
					into_new_tag: newTag,
					promoted_from_tags: promotedTags,
				},
			})
			if (toast.handleError(response))
				return

			const previousSelectedTags = selectedTags.value.slice()
			Arrays.remove(customTags.value, ...promotedTags)
			Arrays.remove(selectedTags.value, ...promotedTags)
			customTags.emit()
			selectedTags.emit(previousSelectedTags)
		})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Into Existing Tag

	const promoteExistingTag = Tab()
		.text.use('view/manage-tags/custom-tags/action/promote/existing-tag')

	const existingTagSelector = TagsEditor()
		.setGlobalTagsOnly()
		.setMaxLengthGlobal(1)

	const existingTagToPromoteInto = existingTagSelector.state.mapManual(tags => tags.global_tags.at(0))
	existingTagSelector.appendToWhen(existingTagToPromoteInto.falsy, promoteExistingTag.content)

	Slot().appendTo(promoteExistingTag.content).use(existingTagToPromoteInto, AbortPromise.asyncFunction(async (signal, slot, tagString) => {
		if (!tagString)
			return

		const tag = await Tags.resolve(tagString)
		if (!tag) {
			existingTagSelector.state.value.global_tags = []
			existingTagSelector.state.emit()
			return
		}

		TagBlock(tag)
			.style('view-type-manage-tags-custom-tag-action-promote-existing-tag')
			.appendTo(slot)
	}))

	const addNewAliasesContainer = LabelledRow()
		.style('view-type-manage-tags-custom-tag-action-promote-existing-tag-new-aliases')
		.tweak(row => row.label
			.style('view-type-manage-tags-custom-tag-action-promote-existing-tag-new-aliases-label')
			.text.use('view/manage-tags/custom-tags/label/promote/existing-tag/new-aliases'))
		.appendToWhen(existingTagToPromoteInto.truthy, promoteExistingTag.content)

	const addNewAliasesEditor = TagsEditor()
		.style('view-type-manage-tags-custom-tag-action-promote-existing-tag-new-aliases-editor')
		.setCustomTagsOnly()
		.tweak(editor => editor.inputWrapper.style('view-type-manage-tags-custom-tag-action-promote-existing-tag-new-aliases-editor-input-wrapper'))
		.appendTo(addNewAliasesContainer.content
			.style('view-type-manage-tags-custom-tag-action-promote-existing-tag-new-aliases-content'))

	selectedTags.subscribeManual((newTags, oldTags) => {
		const addedTags = newTags.filter(tag => !oldTags?.includes(tag))
		const removedTags = oldTags?.filter(tag => !newTags.includes(tag))
		Arrays.add(addNewAliasesEditor.state.value.custom_tags, ...addedTags)
		Arrays.remove(addNewAliasesEditor.state.value.custom_tags, ...removedTags ?? [])
		addNewAliasesEditor.state.emit()
	})

	const promoteIntoExistingActionRow = ActionRow()
		.style('view-type-manage-tags-custom-tag-action-promote-row')
		.appendToWhen(existingTagToPromoteInto.truthy, promoteExistingTag.content)

	Button()
		.text.use('view/manage-tags/custom-tags/action/promote/existing-tag-change')
		.event.subscribe('click', () => {
			existingTagSelector.state.value.global_tags = []
			existingTagSelector.state.emit()
		})
		.appendTo(promoteIntoExistingActionRow.right)

	Button()
		.type('primary')
		.text.use('view/manage-tags/custom-tags/action/promote')
		.event.subscribe('click', async () => {
			const promotedTags = selectedTags.value.slice()
			if (!promotedTags.length)
				return

			const [tag] = existingTagSelector.state.value.global_tags
			if (!tag)
				return

			const response = await EndpointTagCustomPromote.query({
				body: {
					into_existing_tag: {
						id: tag,
						aliases: addNewAliasesEditor.state.value.custom_tags,
					},
					promoted_from_tags: promotedTags,
				},
			})
			if (toast.handleError(response))
				return

			const previousSelectedTags = selectedTags.value.slice()
			Arrays.remove(customTags.value, ...promotedTags)
			Arrays.remove(selectedTags.value, ...promotedTags)
			customTags.emit()
			selectedTags.emit(previousSelectedTags)
		})
		.appendTo(promoteIntoExistingActionRow.right)

	//#endregion
	////////////////////////////////////

	const promoteTabinator = Tabinator()
		.allowNoneVisible()
		.addTab(promoteNewTag)
		.addTab(promoteExistingTag)
		.appendTo(promoteTab.content)

	Placeholder()
		.text.use('view/manage-tags/custom-tags/hint/promote/into')
		.prependTo(promoteTabinator.header)

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Delete

	const deleteTab = Tab()
		.text.use('view/manage-tags/custom-tags/action/delete')

	const row = ActionRow().appendTo(deleteTab.content)

	Placeholder()
		.text.use('view/manage-tags/shared/hint/delete-tags')
		.appendTo(row.left)

	Button()
		.type('primary')
		.text.use('view/manage-tags/custom-tags/action/delete')
		.event.subscribe('click', async () => {
			const tagsToDelete = selectedTags.value.slice()
			if (!tagsToDelete.length)
				return

			const response = await EndpointTagCustomDelete.query({ body: { tags: tagsToDelete } })
			if (toast.handleError(response))
				return

			const previousSelectedTags = selectedTags.value.slice()
			Arrays.remove(customTags.value, ...tagsToDelete)
			Arrays.remove(selectedTags.value, ...tagsToDelete)
			customTags.emit()
			selectedTags.emit(previousSelectedTags)
		})
		.appendTo(row.right)

	//#endregion
	////////////////////////////////////

	Tabinator()
		.allowNoneVisible()
		.addTabWhen(selectedTags.mapManual(tags => tags.length === 1), renameTab)
		.addTab(promoteTab)
		.addTab(deleteTab)
		.appendToWhen(selectedTags.mapManual(tags => !!tags.length), block.footer.left)

	return block
})
