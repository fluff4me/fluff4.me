import type { TagId, TagsManifest, TagsManifestTag } from 'model/Tags'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Heading from 'ui/component/core/Heading'
import Slot from 'ui/component/core/Slot'
import TextInput from 'ui/component/core/TextInput'
import Tag from 'ui/component/Tag'
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

	return block
})
