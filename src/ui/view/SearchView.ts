import type { FeedSearch, PaginationSearch, WorkStatus } from 'api.fluff4.me'
import EndpointFeedGetAuthed from 'endpoint/feed/EndpointFeedGetAuthed'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import type { TagId } from 'model/Tags'
import Tags from 'model/Tags'
import { WORK_STATUSES } from 'model/Works'
import Block from 'ui/component/core/Block'
import Form from 'ui/component/core/Form'
import LabelledTable from 'ui/component/core/LabelledTable'
import Slot from 'ui/component/core/Slot'
import TextInput, { FilterFunction } from 'ui/component/core/TextInput'
import TagsEditor from 'ui/component/TagsEditor'
import WorkFeed from 'ui/component/WorkFeed'
import WorkStatusDropdown from 'ui/component/WorkStatusDropdown'
import PaginatedView from 'ui/view/shared/component/PaginatedView'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Env from 'utility/Env'
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
		const view = PaginatedView('search')

		const searchStringState = State(location.search.replaceAll('?', ''))
		window.addEventListener('popstate', () => {
			searchStringState.value = location.search.replaceAll('?', '')
		})

		const searchInput = State<FeedSearch & PaginationSearch | undefined>(undefined)

		Slot().appendTo(view.content).use(searchStringState, (slot, searchString) => {
			const block = Block().appendTo(slot)
			const searchForm = block.and(Form, block.title)
			searchForm.title.text.use('view/search/title')

			const table = LabelledTable().appendTo(searchForm.content)

			// const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(it => typeof it === 'string')
			const isGlobalTagArray = (v: unknown): v is TagId[] => Array.isArray(v) && v.every(Tags.isId)
			const isWorkStatusArray = (v: unknown): v is WorkStatus[] => Array.isArray(v) && v.every(it => typeof it === 'string' && WORK_STATUSES.includes(it as WorkStatus))
			const paramsRaw = new URLSearchParams(`?${searchString}`).entries().toArray().toObject() as { [KEY in keyof (FeedSearch & PaginationSearch)]?: string }
			const params = {
				search: paramsRaw.search,
				whitelist_tags: Strings.optionalParseJSON(paramsRaw.whitelist_tags, isGlobalTagArray),
				blacklist_tags: Strings.optionalParseJSON(paramsRaw.blacklist_tags, isGlobalTagArray),
				blacklisted_work_statuses: Strings.optionalParseJSON(paramsRaw.blacklisted_work_statuses, isWorkStatusArray),
				minimum_word_count: +paramsRaw.minimum_word_count! || undefined,
				maximum_word_count: +paramsRaw.maximum_word_count! || undefined,
				page: +paramsRaw.page! || undefined,
			} satisfies FeedSearch & PaginationSearch

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

			const minimumWordCount = TextInput()
				.filter(FilterFunction.NUMERIC)
			minimumWordCount.value = `${params.minimum_word_count ?? ''}`
			table.label(label => label.text.use('view/search/input/minimum_word_count/label'))
				.content((content, label) => content.append(minimumWordCount.setLabel(label)))

			const maximumWordCount = TextInput()
				.filter(FilterFunction.NUMERIC)
			maximumWordCount.value = `${params.maximum_word_count ?? ''}`
			table.label(label => label.text.use('view/search/input/maximum_word_count/label'))
				.content((content, label) => content.append(maximumWordCount.setLabel(label)))

			const status = WorkStatusDropdown.Check(WORK_STATUSES.filter(status => !params.blacklisted_work_statuses?.includes(status)))
			table.label(label => label.text.use('view/search/input/statuses/label'))
				.content((content, label) => content.append(status.setLabel(label)))

			searchForm.submit.textWrapper.text.use('view/search/action/submit')
			searchForm.onSubmit(() => updateSearchInput())

			updateSearchInput(true)
			function updateSearchInput (usePageParam = false) {
				searchInput.value = {
					search: textInput.value.trim() || undefined,
					whitelist_tags: whitelistTags.state.value.global_tags,
					blacklist_tags: blacklist_tags.state.value.global_tags,
					blacklisted_work_statuses: WORK_STATUSES.filter(s => !status.selection.value?.includes(s)),
					minimum_word_count: !isNaN(+minimumWordCount.value) && +minimumWordCount.value > 99 ? +minimumWordCount.value : undefined,
					maximum_word_count: !isNaN(+maximumWordCount.value) && +maximumWordCount.value > 99 && +maximumWordCount.value >= (+minimumWordCount.value || 0) ? +maximumWordCount.value : undefined,
					page: (usePageParam && +params.page!) || 0,
				}
				const newSearch = `${(Object.entries(searchInput.value)
					.filter(([, value]) => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0))
					.map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)] as const)
					.collect(entries => new URLSearchParams(entries.toObject()).toString())
				)}`
				if (newSearch !== searchString) {
					searchString = newSearch
					searchStringState.setValueSilent(newSearch)
					history.pushState(null, '', `${Env.URL_ORIGIN}search?${newSearch}`)
				}
			}
		})

		view.paginator()
			.and(WorkFeed)
			.tweak(feed => {
				searchInput.use(feed, search => {
					feed.setFromEndpoint(EndpointFeedGetAuthed.prep(undefined, search && Objects.filterNullish(search)), search?.page || undefined)
				})
				feed.setPageHandler(page => {
					const searchString = searchStringState.value
					feed.setURL(`/search?${searchString}${searchString && page !== 0 ? '&' : ''}${page === 0 ? '' : `page=${page}`}`)
				})
			})
			.appendTo(view.content)

		return view
	},
})
