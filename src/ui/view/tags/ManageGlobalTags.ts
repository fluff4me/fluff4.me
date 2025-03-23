import EndpointTagCreateGlobal from 'endpoint/tag/EndpointTagCreateGlobal'
import EndpointTagDeleteGlobal from 'endpoint/tag/EndpointTagDeleteGlobal'
import EndpointTagGlobalRecategorise from 'endpoint/tag/EndpointTagGlobalRecategorise'
import type { TagId, TagsManifest, TagsManifestTag } from 'model/Tags'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import Form from 'ui/component/core/Form'
import Heading from 'ui/component/core/Heading'
import LabelledRow from 'ui/component/core/LabelledRow'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import TextInput from 'ui/component/core/TextInput'
import Tag from 'ui/component/Tag'
import { Quilt } from 'ui/utility/StringApplicator'
import TagEditForm from 'ui/view/tags/TagEditForm'
import Arrays from 'utility/Arrays'
import State from 'utility/State'

export default Component.Builder((component, manifest: State<TagsManifest | undefined>) => {
	const block = component.and(Block)
	block.content.style('view-type-manage-tags-tag-block')

	const filter = TextInput()
		.placeholder.use('view/manage-tags/shared/hint/filter')
		.appendTo(block.content)

	const tagList = Component()
		.style('view-type-manage-tags-tag-list')
		.appendTo(block.content)

	const selectedTags = State<TagId[]>([])
	let lastAdded: TagId | undefined
	let lastRemoved: TagId | undefined

	State.Use(component, { manifest, filter: filter.state }).use(component, ({ manifest, filter }) => {
		tagList.removeContents()
		if (!manifest)
			return

		let [categoryFilter, tagFilter] = filter.toLowerCase().split(':')
		if (tagFilter === undefined)
			tagFilter = categoryFilter, categoryFilter = ''

		const filteredTags = (Object.entries(manifest.tags) as [TagId, TagsManifestTag][])
			.filter(([tagId, tag]) => !filter
				|| (tag.name.toLowerCase().includes(tagFilter) && tag.category.toLowerCase().includes(categoryFilter)))

		const filteredTagIds = filteredTags.map(([tagId]) => tagId)

		for (const [tagId, tag] of filteredTags) {
			Tag(tag)
				.tweak(tag => tag.style.bind(selectedTags.map(tag, t => t.includes(tagId)), 'tag--selected', 'view-type-manage-tags-tag--selected'))
				.event.subscribeCapture('click', event => {
					event.preventDefault()
					event.stopImmediatePropagation()

					const previousSelectedTags = selectedTags.value.slice()

					if (selectedTags.value.includes(tagId)) {
						if (event.shiftKey && event.altKey && lastRemoved && lastRemoved !== tagId) {
							const otherIndex = filteredTagIds.indexOf(lastRemoved)
							const thisIndex = filteredTagIds.indexOf(tagId)
							const start = Math.min(otherIndex, thisIndex)
							const end = Math.max(otherIndex, thisIndex)
							Arrays.remove(selectedTags.value, ...filteredTagIds.slice(start, end + 1))
							selectedTags.emit(previousSelectedTags)
							return
						}

						lastRemoved = tagId
						Arrays.remove(selectedTags.value, tagId)
						selectedTags.emit(previousSelectedTags)
						return
					}

					if (event.shiftKey && lastAdded && lastAdded !== tagId) {
						const otherIndex = filteredTagIds.indexOf(lastAdded)
						const thisIndex = filteredTagIds.indexOf(tagId)
						const start = Math.min(otherIndex, thisIndex)
						const end = Math.max(otherIndex, thisIndex)
						Arrays.add(selectedTags.value, ...filteredTagIds.slice(start, end + 1))
						selectedTags.emit(previousSelectedTags)
						return
					}

					lastAdded = tagId
					Arrays.add(selectedTags.value, tagId)
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
		.append(Slot().use(selectedTags, (slot, tagIds) => {
			const tags = tagIds.map(id => [id, manifest.value?.tags[id]] as const).filterInPlace((tag): tag is readonly [TagId, TagsManifestTag] => !!tag[1])
			if (!tags.length)
				return

			for (const [tagId, tag] of tags)
				Tag(tag)
					.style('tag--selected', 'view-type-manage-tags-tag--selected')
					.event.subscribeCapture('click', event => {
						event.preventDefault()
						event.stopImmediatePropagation()

						Arrays.remove(selectedTags.value, tagId)
						selectedTags.emit()
					})
					.appendTo(slot)
		}))
		.appendToWhen(selectedTags.mapManual(c => !!c.length), block.content)

	////////////////////////////////////
	//#region Create Tag

	const createTab = Tab()
		.text.use('view/manage-tags/global-tags/action/create')

	const createTagForm = TagEditForm(manifest)
		.appendTo(createTab.content)

	createTagForm.submit
		.text.use('view/manage-tags/global-tags/action/create')
		.event.subscribe('click', async () => {
			const body = createTagForm.getFormData()
			if (!body)
				return

			const response = await EndpointTagCreateGlobal.query({ body })
			if (toast.handleError(response))
				return

			if (!manifest.value)
				return

			Tags.addTag(response.data)
		})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Recategorise

	const recategoriseTab = Tab()
		.text.use('view/manage-tags/global-tags/action/recategorise')

	const recategoriseForm = Form(null).appendTo(recategoriseTab.content)
	let recategoriseFormCategory!: RadioDropdown<string>

	LabelledRow()
		.tweak(row => row.label.text.use('view/manage-tags/global-tag-form/category/label'))
		.tweak(row => row.content.append(recategoriseFormCategory = RadioDropdown()
			.setLabel(row.label)
			.setRequired()
			.tweak(dropdown => {
				manifest.use(dropdown, manifest => {
					dropdown.clear()
					if (!manifest)
						return

					for (const category of Object.values(manifest.categories))
						dropdown.add(category.nameLowercase, {
							translation: Quilt.fake(category.name),
						})
				})
			})
		))
		.appendTo(recategoriseForm.content)

	recategoriseForm.submit
		.text.use('view/manage-tags/global-tags/action/recategorise')
		.event.subscribe('click', async () => {
			const tags = selectedTags.value.slice()
			if (!tags.length)
				return

			const category = recategoriseFormCategory.selection.value
			if (!category)
				return

			const confirmed = await ConfirmDialog.prompt(recategoriseFormCategory, { dangerToken: 'tag-modify' })
			if (!confirmed)
				return

			const response = await EndpointTagGlobalRecategorise.query({ body: { tags, category } })
			if (toast.handleError(response))
				return

			Tags.recategoriseTags(category, ...tags)
		})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Modify Tag

	const modifyTab = Tab()
		.text.use('view/manage-tags/global-tags/action/modify')

	Slot().appendTo(modifyTab.content).use(selectedTags, (slot, tagIds) => {
		if (!tagIds.length || tagIds.length > 1)
			return

		const tagId = tagIds[0]
		const modifyForm = TagEditForm(manifest, tagId)
			.appendTo(slot)

		modifyForm.submit
			.text.use('view/manage-tags/global-tags/action/save')
			.event.subscribe('click', async () => {
				const body = modifyForm.getFormData()
				if (!body)
					return

				const confirmed = await ConfirmDialog.prompt(modifyForm, { dangerToken: 'tag-modify' })
				if (!confirmed)
					return

				const response = await EndpointTagCreateGlobal.query({ body })
				if (toast.handleError(response))
					return

				if (!manifest.value)
					return

				Tags.removeTags(tagId)
				Tags.addTag(response.data)
			})
	})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Delete Tag

	const deleteTab = Tab()
		.text.use('view/manage-tags/global-tags/action/delete')

	const deleteRow = ActionRow().appendTo(deleteTab.content)

	Placeholder()
		.text.use('view/manage-tags/shared/hint/delete-tags')
		.appendTo(deleteRow.left)

	Button()
		.type('primary')
		.text.use('view/manage-tags/custom-tags/action/delete')
		.event.subscribe('click', async () => {
			const tagsToDelete = selectedTags.value.slice()
			if (!tagsToDelete.length)
				return

			const confirmed = await ConfirmDialog.prompt(deleteRow, { dangerToken: 'tag-modify' })
			if (!confirmed)
				return

			const response = await EndpointTagDeleteGlobal.query({ body: { tags: tagsToDelete } })
			if (toast.handleError(response))
				return

			Tags.removeTags(...tagsToDelete)
			const previousSelectedTags = selectedTags.value.slice()
			Arrays.remove(selectedTags.value, ...tagsToDelete)
			selectedTags.emit(previousSelectedTags)
		})
		.appendTo(deleteRow.right)

	//#endregion
	////////////////////////////////////

	const hasNoSelectedTags = selectedTags.mapManual(tags => !tags.length)
	const hasSelectedTags = selectedTags.mapManual(tags => !!tags.length)
	const hasSingleTagSelected = selectedTags.mapManual(tags => tags.length === 1)

	const tabinator = Tabinator()
		.allowNoneVisible()
		.addTabWhen(hasNoSelectedTags, createTab)
		.addTabWhen(hasSingleTagSelected, modifyTab)
		.addTabWhen(hasSelectedTags, recategoriseTab)
		.addTabWhen(hasSelectedTags, deleteTab)
		.appendTo(block.footer.left)

	Placeholder()
		.text.use('view/manage-tags/shared/hint/select-tags')
		.appendToWhen(selectedTags.mapManual(tags => !tags.length), tabinator.header)

	return block
})
