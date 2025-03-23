import EndpointTagCreateCategory from 'endpoint/tag/EndpointTagCreateCategory'
import EndpointTagDeleteCategory from 'endpoint/tag/EndpointTagDeleteCategory'
import EndpointTagUpdateCategory from 'endpoint/tag/EndpointTagUpdateCategory'
import type { TagsManifest, TagsManifestCategory } from 'model/Tags'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Heading from 'ui/component/core/Heading'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import TextInput from 'ui/component/core/TextInput'
import Tag from 'ui/component/Tag'
import CategoryEditForm from 'ui/view/tags/CategoryEditForm'
import State from 'utility/State'

const Category = Component.Builder((component, category: TagsManifestCategory): Tag => {
	return component.and(Tag, category.name)
		.style('view-type-manage-tags-tag', 'view-type-manage-tags-category', 'view-type-manage-tags-category--has-description')
		.tweak(tag => tag.removeContents())
		.append(Component()
			.style('tag-category', 'tag-category--standalone')
			.text.set(category.name))
		.append(Placeholder()
			.style('tag-category-description')
			.text.set(category.description))
})

export default Component.Builder((component, manifest: State<TagsManifest | undefined>) => {
	const block = component.and(Block)
	block.content.style('view-type-manage-tags-tag-block')

	const filter = TextInput()
		.placeholder.use('view/manage-tags/shared/hint/filter')
		.appendTo(block.content)

	const tagList = Component()
		.style('view-type-manage-tags-tag-list')
		.appendTo(block.content)

	const selectedCategory = State<string | undefined>(undefined)

	State.Use(component, { manifest, filter: filter.state }).use(component, ({ manifest, filter }) => {
		tagList.removeContents()
		if (!manifest)
			return

		filter = filter.toLowerCase()

		for (const [, category] of Object.entries(manifest.categories)) {
			if (filter && !category.name.toLowerCase().includes(filter.toLowerCase()))
				continue

			Category(category)
				.tweak(tag => tag.style.bind(selectedCategory.map(tag, c => c === category.name), 'tag--selected', 'view-type-manage-tags-tag--selected'))
				.event.subscribe('click', () => {
					if (selectedCategory.value === category.name)
						selectedCategory.value = undefined
					else
						selectedCategory.value = category.name
				})
				.appendTo(tagList)
		}
	})

	const hasSelectedCategory = selectedCategory.mapManual(c => !!c)

	Component()
		.style('view-type-manage-tags-tag-list')
		.append(Heading()
			.setAestheticStyle(false)
			.style('view-type-manage-tags-section-heading')
			.text.use('view/manage-tags/categories/label/selected'))
		.append(Slot().use(selectedCategory, (slot, categoryId) => {
			const category = manifest.value?.categories[categoryId!]
			if (!category)
				return

			Category(category)
				.style('tag--selected', 'view-type-manage-tags-tag--selected')
				.event.subscribe('click', () => {
					selectedCategory.value = undefined
				})
				.appendTo(slot)
		}))
		.appendToWhen(hasSelectedCategory, block.content)

	////////////////////////////////////
	//#region Create

	const createTab = Tab()
		.text.use('view/manage-tags/categories/action/create')

	const createForm = CategoryEditForm(manifest)
		.appendTo(createTab.content)

	createForm.submit
		.text.use('view/manage-tags/categories/action/create')
		.event.subscribe('click', async event => {
			event.preventDefault()

			const body = createForm.getFormData()
			if (!body)
				return

			const response = await EndpointTagCreateCategory.query({ body })
			if (toast.handleError(response))
				return

			if (!manifest.value)
				return

			Tags.addCategory(response.data)
		})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Modify

	const modifyTab = Tab()
		.text.use('view/manage-tags/categories/action/modify')

	Slot().appendTo(modifyTab.content).use(selectedCategory, (slot, category) => {
		if (!category)
			return

		const modifyForm = CategoryEditForm(manifest, category)
			.appendTo(slot)

		modifyForm.submit
			.text.use('view/manage-tags/categories/action/create')
			.event.subscribe('click', async event => {
				event.preventDefault()

				const body = modifyForm.getFormData()
				if (!body)
					return

				const confirmed = await ConfirmDialog.prompt(modifyForm, { dangerToken: 'tag-modify' })
				if (!confirmed)
					return

				const response = await EndpointTagUpdateCategory.query({ params: { name: category }, body })
				if (toast.handleError(response))
					return

				if (!manifest.value)
					return

				Tags.removeCategory(category)
				Tags.addCategory(response.data)
			})
	})

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Delete

	const deleteTab = Tab()
		.text.use('view/manage-tags/categories/action/delete')

	const deleteRow = ActionRow()
		.appendTo(deleteTab.content)

	const canDelete = State.Map(deleteRow, [manifest, selectedCategory], (manifest, selectedCategory) => true
		&& !!manifest
		&& !Object.values(manifest.tags).some(tag => tag.category === selectedCategory)
	)
	Placeholder()
		.text.use('view/manage-tags/categories/hint/no-delete')
		.appendToWhen(canDelete.falsy, deleteRow.left)

	Placeholder()
		.text.use('view/manage-tags/categories/hint/delete')
		.appendToWhen(canDelete, deleteRow.left)

	Button()
		.type('primary')
		.text.use('view/manage-tags/categories/action/delete')
		.event.subscribe('click', async () => {
			const category = selectedCategory.value
			if (!category)
				return

			const confirmed = await ConfirmDialog.prompt(deleteRow, { dangerToken: 'tag-modify' })
			if (!confirmed)
				return

			const response = await EndpointTagDeleteCategory.query({ params: { name: category } })
			if (toast.handleError(response))
				return

			Tags.removeCategory(category)
		})
		.appendTo(deleteRow.right)

	//#endregion
	////////////////////////////////////

	const tabinator = Tabinator()
		.allowNoneVisible()
		.addTabWhen(hasSelectedCategory.falsy, createTab)
		.addTabWhen(hasSelectedCategory, modifyTab)
		.addTabWhen(hasSelectedCategory, deleteTab)
		.appendTo(block.footer.left)

	Placeholder()
		.text.use('view/manage-tags/categories/hint/select-category')
		.appendToWhen(hasSelectedCategory.falsy, tabinator.header)

	return block
})
