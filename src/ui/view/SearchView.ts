import type { FeedSearch } from 'api.fluff4.me'
import EndpointFeedGetAuthed from 'endpoint/feed/EndpointFeedGetAuthed'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import type { TagId } from 'model/Tags'
import Tags from 'model/Tags'
import Block from 'ui/component/core/Block'
import Form from 'ui/component/core/Form'
import LabelledTable from 'ui/component/core/LabelledTable'
import TextInput from 'ui/component/core/TextInput'
import TagsEditor from 'ui/component/TagsEditor'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Errors from 'utility/Errors'
import Objects from 'utility/Objects'
import State from 'utility/State'
import Strings from 'utility/string/Strings'

const REDIRECT_HOME: Errors.Redirection = Errors.redirection('/')

export default ViewDefinition({
	// eslint-disable-next-line @typescript-eslint/require-await
	async load () {
		if (Session.Auth.state.value !== 'logged-in')
			return REDIRECT_HOME()
	},
	create () {
		const view = View('search')

		const block = Block().appendTo(view.content)
		const searchForm = block.and(Form, block.title)
		searchForm.title.text.use('view/search/title')

		const table = LabelledTable().appendTo(searchForm.content)

		// const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(it => typeof it === 'string')
		const isGlobalTagArray = (v: unknown): v is TagId[] => Array.isArray(v) && v.every(Tags.isId)
		const paramsRaw = new URLSearchParams(location.search).entries().toArray().toObject() as { [KEY in keyof FeedSearch]?: string }
		const params = {
			search: paramsRaw.search,
			whitelist_tags: Strings.optionalParseJSON(paramsRaw.whitelist_tags, isGlobalTagArray),
			blacklist_tags: Strings.optionalParseJSON(paramsRaw.blacklist_tags, isGlobalTagArray),
		} satisfies FeedSearch

		const textInput = TextInput()
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.feed_search?.search))
		textInput.value = params.search || ''
		table.label(label => label.text.use('view/search/input/text/label'))
			.content((content, label) => content.append(textInput.setLabel(label)))

		const whitelistTags = TagsEditor()
			.setGlobalTagsOnly()
			.globalHint.use('view/search/input/whitelist_tags/hint')
			.setMaxLengthGlobal(FormInputLengths.map(table, lengths => lengths?.feed_search?.tag_whitelist))
		whitelistTags.state.value = { global_tags: params.whitelist_tags ?? [], custom_tags: [] }
		table.label(label => label.text.use('view/search/input/whitelist_tags/label'))
			.content((content, label) => content.append(whitelistTags.setLabel(label)))

		const blacklist_tags = TagsEditor()
			.setGlobalTagsOnly()
			.globalHint.use('view/search/input/blacklist_tags/hint')
			.setMaxLengthGlobal(FormInputLengths.map(table, lengths => lengths?.feed_search?.tag_blacklist))
		blacklist_tags.state.value = { global_tags: params.blacklist_tags ?? [], custom_tags: [] }
		table.label(label => label.text.use('view/search/input/blacklist_tags/label'))
			.content((content, label) => content.append(blacklist_tags.setLabel(label)))

		searchForm.submit.textWrapper.text.use('view/search/action/submit')
		searchForm.onSubmit(updateSearchInput)

		const searchInput = State<FeedSearch | undefined>(undefined)
		updateSearchInput()
		function updateSearchInput () {
			searchInput.value = {
				search: textInput.value.trim() || undefined,
				whitelist_tags: whitelistTags.state.value.global_tags,
				blacklist_tags: blacklist_tags.state.value.global_tags,
			}
		}

		WorkFeed()
			.tweak(feed => searchInput.use(feed, search => {
				feed.setFromEndpoint(EndpointFeedGetAuthed.prep(undefined, search && Objects.filterNullish(search)))
			}))
			.appendTo(view.content)

		return view
	},
})
