import type { TagsManifest, TagsManifestCategory } from 'model/Tags'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Heading from 'ui/component/core/Heading'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import TextInput from 'ui/component/core/TextInput'
import Tag from 'ui/component/Tag'
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
		.appendToWhen(selectedCategory.mapManual(c => !!c), block.content)

	Placeholder()
		.text.use('view/manage-tags/categories/hint/select-category')
		.appendToWhen(selectedCategory.mapManual(category => !category), block.footer.left)

	return block
})
