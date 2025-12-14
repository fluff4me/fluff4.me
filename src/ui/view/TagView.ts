import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import EndpointFeedGetAuthed from 'endpoint/feed/get/EndpointFeedGetAuthed'
import Session from 'model/Session'
import Tags from 'model/Tags'
import ActionBlock from 'ui/component/ActionBlock'
import Tag from 'ui/component/Tag'
import TagBlock from 'ui/component/TagBlock'
import WorkFeed from 'ui/component/WorkFeed'
import { Quilt } from 'ui/utility/StringApplicator'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTitle from 'ui/view/shared/ext/ViewTitle'
import Errors from 'utility/Errors'

interface TagViewGlobalParams {
	category: string
	name: string
	custom_name?: never
}

// interface TagViewCustomParams {
// 	category?: never
// 	name?: never
// 	custom_name: string
// }

type TagViewParams = TagViewGlobalParams // | TagViewCustomParams

const fromURLRegex = /(-|^)(.)/g
const fromURL = (name: string) => name.replaceAll(fromURLRegex, (_, dash: string, char: string) => `${dash ? ' ' : ''}${char}`)
export default ViewDefinition({
	async load (params: TagViewParams) {
		const tag = params.custom_name ?? await Tags.resolve(fromURL(params.category), fromURL(params.name))
		if (!tag)
			throw Errors.NotFound()

		return { tag }
	},
	create (params: TagViewParams, { tag }) {
		const view = View('tag')

		const tagBlock = TagBlock(tag)
			.viewTransition('tag-view-tag')
			.tweak(block => block.header.getFirstDescendant(Tag)?.nameWrapper.and(ViewTitle, Quilt.fake(`${tag.category}: ${tag.name}`)))
			.appendTo(view.content)

		ActionBlock()
			.viewTransition('tag-view-tag-actions')
			.attachAbove()
			.addActions(tagBlock)
			.appendTo(view.content)

		WorkFeed()
			.setFromEndpoint((Session.Auth.author.value ? EndpointFeedGetAuthed : EndpointFeedGet)
				.prep(undefined, {
					whitelist_tags: [`${tag.category}: ${tag.name}`],
				}))
			.appendTo(view.content)

		return view
	},
})
