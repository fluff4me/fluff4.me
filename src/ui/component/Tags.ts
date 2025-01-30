import type { Tag as TagData } from 'api.fluff4.me'
import TagsModel from 'model/Tags'
import Component from 'ui/Component'
import Slot from 'ui/component/core/Slot'
import Tag from 'ui/component/Tag'
import type { TagsState } from 'ui/component/TagsEditor'
import AbortPromise from 'utility/AbortPromise'
import State from 'utility/State'

interface TagsDefinition {
	initialiseGlobalTags?(component: Component, tags: TagData[]): unknown
	initialiseCustomTags?(component: Component, tags: string[]): unknown
}

interface TagsExtensions {
	set (state: TagsState, definition?: TagsDefinition): this
}

interface Tags extends Component, TagsExtensions {

}

const Tags = Component.Builder((component): Tags => {
	const state = State<TagsState | undefined>(undefined)
	let definition: TagsDefinition | undefined

	Slot()
		.use(state.map(component, state => state?.global_tags), AbortPromise.asyncFunction(async (signal, slot, tagStrings) => {
			const tags = await TagsModel.resolve(tagStrings)
			return tags?.length && Component()
				.style('work-tags', 'work-tags-global')
				.tweak(definition?.initialiseGlobalTags, tags)
				.append(...tags.map(tag => Tag(tag)))
		}))
		.appendTo(component)

	Slot()
		.use(state.map(component, state => state?.custom_tags), (slot, customTags) => customTags?.length && Component()
			.style('work-tags', 'work-tags-custom')
			.tweak(definition?.initialiseCustomTags, customTags)
			.append(...customTags.map(tag => Tag(tag))))
		.appendTo(component)

	return component.extend<TagsExtensions>(tags => ({
		set (newState, newDefinition) {
			state.value = newState
			definition = newDefinition
			return tags
		},
	}))
})

export default Tags
