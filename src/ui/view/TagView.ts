import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import EndpointFeedGetAuthed from 'endpoint/feed/EndpointFeedGetAuthed'
import Session from 'model/Session'
import Tags from 'model/Tags'
import TagBlock from 'ui/component/TagBlock'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
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
const fromURL = (name: string) => name.replaceAll(fromURLRegex, (_, dash: string, char: string) => `${dash ? ' ' : ''}${char.toUpperCase()}`)
export default ViewDefinition({
	async load (params: TagViewParams) {
		const tag = params.custom_name ?? await Tags.resolve(fromURL(params.category), fromURL(params.name))
		if (!tag)
			throw Errors.NotFound()

		return { tag }
	},
	create (params: TagViewParams, { tag }) {
		const view = View('tag')

		TagBlock(tag)
			.appendTo(view.content)

		WorkFeed()
			.setFromEndpoint((Session.Auth.author.value ? EndpointFeedGetAuthed : EndpointFeedGet)
				.prep(undefined, {
					whitelistTags: [`${tag.category}: ${tag.name}`],
				}))
			.appendTo(view.content)

		return view
	},
})
