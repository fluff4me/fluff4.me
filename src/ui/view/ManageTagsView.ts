import EndpointTagCustomGetAll from 'endpoint/tag/EndpointTagCustomGetAll'
import Session from 'model/Session'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Placeholder from 'ui/component/core/Placeholder'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import TextInput from 'ui/component/core/TextInput'
import Tag from 'ui/component/Tag'
import NewTagForm from 'ui/component/tag/NewTagForm'
import { filterTagSegment } from 'ui/component/TagsEditor'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Arrays from 'utility/Arrays'
import Errors from 'utility/Errors'
import State from 'utility/State'

export default ViewDefinition({
	async load (params) {
		if (!Session.Auth.hasPrivilege('TagGlobalCreate'))
			throw Errors.Forbidden()

		const customTags = await EndpointTagCustomGetAll.query()
		if (toast.handleError(customTags))
			throw Errors.NotFound()

		const manifest = await Tags.getManifest()

		return {
			customTags: customTags.data,
			manifest,
		}
	},
	create: (params, { customTags, manifest }) => {
		const view = View('manage-tags')

		view.breadcrumbs.title.text.use('view/manage-tags/title')
		view.breadcrumbs.description.text.use('view/manage-tags/description')

		const customTagsBlock = Block().appendTo(view.content)
		customTagsBlock.title.text.use('view/manage-tags/custom-tags/title')
		customTagsBlock.content.style('view-type-manage-tags-custom-tag-block')

		const filter = TextInput()
			.placeholder.use('view/manage-tags/custom-tags/hint/filter')
			.appendTo(customTagsBlock.content)

		const filteredIn = (tag: string) => !filter.state.value.length || tag.includes(filter.state.value)

		const tagList = Component()
			.style('view-type-manage-tags-custom-tag-list')
			.appendTo(customTagsBlock.content)

		const selectedTags = State<string[]>([])
		let lastAdded: string | undefined
		let lastRemoved: string | undefined

		for (const tag of customTags.sort((a, b) => a.localeCompare(b))) {
			const selected = selectedTags.mapManual(tags => tags.includes(tag))
			const filteredOut = State.MapManual([filter.state, selected],
				(text, selected) => !selected && !filteredIn(tag))

			Tag(tag)
				.style('view-type-manage-tags-custom-tag')
				.style.bind(filteredOut, 'view-type-manage-tags-custom-tag--filtered-out')
				.style.bind(selected, 'view-type-manage-tags-custom-tag--selected')
				.event.subscribe('click', event => {
					if (selectedTags.value.includes(tag)) {
						if (event.shiftKey && event.altKey && lastRemoved && lastRemoved !== tag) {
							const otherIndex = customTags.indexOf(lastRemoved)
							const thisIndex = customTags.indexOf(tag)
							const start = Math.min(otherIndex, thisIndex)
							const end = Math.max(otherIndex, thisIndex)
							Arrays.remove(selectedTags.value, ...customTags.slice(start, end + 1).filter(filteredIn))
							selectedTags.emit()
							return
						}

						lastRemoved = tag
						Arrays.remove(selectedTags.value, tag)
						selectedTags.emit()
						return
					}

					if (event.shiftKey && lastAdded && lastAdded !== tag) {
						const otherIndex = customTags.indexOf(lastAdded)
						const thisIndex = customTags.indexOf(tag)
						const start = Math.min(otherIndex, thisIndex)
						const end = Math.max(otherIndex, thisIndex)
						Arrays.add(selectedTags.value, ...customTags.slice(start, end + 1).filter(filteredIn))
						selectedTags.emit()
						return
					}

					lastAdded = tag
					Arrays.add(selectedTags.value, tag)
					selectedTags.emit()
				})
				.appendTo(tagList)
		}

		Placeholder()
			.text.use('view/manage-tags/custom-tags/hint/select-tags')
			.appendToWhen(selectedTags.mapManual(tags => !tags.length), customTagsBlock.footer.left)

		////////////////////////////////////
		//#region Rename

		const renameTab = Tab()
			.text.use('view/manage-tags/custom-tags/action/rename')

		const renameRow = ActionRow().appendTo(renameTab.content)
		const renameInput = TextInput()
			.placeholder.use('view/manage-tags/custom-tags/hint/rename')
			.appendTo(renameRow.left)

		Button()
			.type('primary')
			.text.use('view/manage-tags/custom-tags/action/rename')
			.event.subscribe('click', async () => {
				const newName = filterTagSegment(renameInput.state.value)
				if (!newName || newName === selectedTags.value[0])
					return
			})
			.appendTo(renameRow.right)

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region Promote

		const promoteTab = Tab()
			.text.use('view/manage-tags/custom-tags/action/promote')

		const promoteNewTag = Tab()
			.text.use('view/manage-tags/custom-tags/action/promote/new-tag')

		NewTagForm(manifest)
			.appendTo(promoteNewTag.content)

		const promoteExistingTag = Tab()
			.text.use('view/manage-tags/custom-tags/action/promote/existing-tag')

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
			.text.use('view/manage-tags/custom-tags/hint/delete-tags')
			.appendTo(row.left)

		Button()
			.type('primary')
			.text.use('view/manage-tags/custom-tags/action/delete')
			.event.subscribe('click', async () => {

			})
			.appendTo(row.right)

		//#endregion
		////////////////////////////////////

		Tabinator()
			.allowNoneVisible()
			.addTabWhen(selectedTags.mapManual(tags => tags.length === 1), renameTab)
			.addTab(promoteTab)
			.addTab(deleteTab)
			.appendToWhen(selectedTags.mapManual(tags => !!tags.length), customTagsBlock.footer.left)

		return view
	},
})
