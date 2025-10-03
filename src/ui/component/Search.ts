import type { SearchResponse } from 'api.fluff4.me'
import EndpointSearchGet from 'endpoint/search/EndpointSearchGet'
import Tags from 'model/Tags'
import type { RoutePath, RoutePathWithSearch } from 'navigation/RoutePath'
import Component from 'ui/Component'
import { AuthorFooter, AuthorSubtitle } from 'ui/component/Author'
import AuthorLink from 'ui/component/AuthorLink'
import Button from 'ui/component/core/Button'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import GradientText from 'ui/component/core/ext/GradientText'
import Heading from 'ui/component/core/Heading'
import Icon from 'ui/component/core/Icon'
import Link from 'ui/component/core/Link'
import Loading from 'ui/component/core/Loading'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import type { SlotInitialiserReturn } from 'ui/component/core/Slot'
import Slot from 'ui/component/core/Slot'
import Small from 'ui/component/core/Small'
import TextInput from 'ui/component/core/TextInput'
import PopoverBlock from 'ui/component/popover/PopoverBlock'
import { WorkFooter } from 'ui/component/Work'
import type TextManipulator from 'ui/utility/TextManipulator'
import Viewport from 'ui/utility/Viewport'
import AbortPromise from 'utility/AbortPromise'
import Async from 'utility/Async'
import State from 'utility/State'

export default Component.Builder(component => {
	const textInput = TextInput()
		.style('search-input')
		.placeholder.use('masthead/placeholder/search')

	const searchResults = State<SearchResponse | undefined>(undefined)
	const loading = State(false)

	const popover = PopoverBlock()
		.style('search-popover')
		.setOwner(component)
		.anchor.from(component)
		.anchor.reset()
		.anchor.add('sticky centre', 'off bottom')
		.anchor.orElseHide()
		.tweak(popover => {
			popover.header.style('search-popover-header')

			const stateWrapper = Component()
				.style('search-popover-state-wrapper')
				.appendTo(popover)

			Button()
				.style('search-popover-retry-button')
				.text.bind(Viewport.mobile.map(popover, mobile => quilt => quilt[mobile ? 'search/action/again/short' : 'search/action/again']()))
				.event.subscribe('click', () => lookup())
				.appendToWhen(loading.falsy, stateWrapper)

			Loading()
				.style('search-popover-loading')
				.tweak(component => component.enabled.bind(component, loading))
				.tweak(component => component.flag.style('search-popover-loading-flag'))
				.appendToWhen(loading, stateWrapper)

			const sectionsWrapper = Component()
				.style('search-popover-sections-wrapper')
				.appendTo(popover)

			////////////////////////////////////
			//#region Result Components

			interface ResultsSectionExtensions {
				readonly title: Heading
				readonly titleText: TextManipulator<this>
				readonly content: Slot
				handle (handler: (slot: ComponentInsertionTransaction, searchResults: SearchResponse | undefined) => SlotInitialiserReturn): this
			}

			interface ResultsSection extends Component, ResultsSectionExtensions { }

			const ResultsSection = Component.Builder((component): ResultsSection => {
				component.style('search-popover-section')

				const title = Heading()
					.setAestheticStyle(false)
					.style('search-popover-section-title')
					.appendTo(component)

				const content = Slot()
					.style('search-popover-section-content')
					.appendTo(component)

				return component.extend<ResultsSectionExtensions>(section => ({
					title,
					titleText: title.text.rehost(section),
					content,
					handle (handler) {
						content.use(searchResults, handler)
						return section
					},
				}))
			})

			interface SearchResultExtensions {
				readonly title: Heading
				readonly titleText: TextManipulator<this>
				readonly subtitle: Component
				readonly subtitleText: TextManipulator<this>
				readonly description: Paragraph
				readonly descriptionText: TextManipulator<this>
				readonly details: Component
			}

			interface SearchResult extends Link, SearchResultExtensions {
			}

			const SearchResult = Component.Builder('a', (component, link: RoutePath | undefined): SearchResult => {
				return component
					.and(Button).and(Link, link)
					.type('flush')
					.style('search-popover-result')
					.extend<SearchResultExtensions>(result => ({
						title: undefined!,
						titleText: undefined!,
						subtitle: undefined!,
						subtitleText: undefined!,
						description: undefined!,
						descriptionText: undefined!,
						details: undefined!,
					}))
					.extendJIT('title', result => Heading()
						.setAestheticStyle(false)
						.style('search-popover-result-title')
						.prependTo(result)
					)
					.extendJIT('titleText', result => result.title.text.rehost(result))
					.extendJIT('subtitle', result => Component()
						.style('search-popover-result-subtitle')
						.insertTo(component, 'after', result.title)
					)
					.extendJIT('subtitleText', result => result.subtitle.text.rehost(result))
					.extendJIT('description', result => Paragraph().and(Placeholder)
						.style('search-popover-result-description')
						.appendTo(component)
					)
					.extendJIT('descriptionText', result => result.description.text.rehost(result))
					.extendJIT('details', result => Component()
						.style('search-popover-result-details')
						.appendTo(component)
					)
			})

			const NoResults = Component.Builder(component => component.and(Paragraph).and(Small).and(Placeholder)
				.style('search-popover-no-results')
				.text.use('search/none')
			)

			//#endregion
			////////////////////////////////////

			ResultsSection()
				.titleText.use('search/section/works/title')
				.tweak(section => Link(textInput.state.map(section, (search): RoutePathWithSearch => `/search?search=${encodeURIComponent(search)}`))
					.and(Button)
					.style('search-popover-advanced-link')
					.text.use('search/action/advanced')
					.appendTo(section.title)
				)
				.handle((slot, searchResults) => {
					if (!searchResults?.works.length)
						return NoResults()

					for (const work of searchResults?.works ?? []) {
						const author = searchResults.authorData.find(a => a.vanity === work.author)
						SearchResult(`/work/${work.author}/${work.vanity}`)
							.titleText.set(work.name)
							.tweak(result => author && result.subtitle.append(AuthorLink(author)))
							.descriptionText.set(work.description)
							.tweak(result => result.description.style('search-popover-result-description--work'))
							.tweak(result => result.details.and(WorkFooter, work)
								.tweak(details => {
									details.left.style('search-popover-result-details-left')
									details.right.style('search-popover-result-details-right')
									details.status.use(details, status => status.style('search-popover-result-work-status'))
									details.statusIcon.use(details, c => c.style('search-popover-result-work-status-icon'))
									details.chapterCount.style('search-popover-result-work-chapter-count')
									details.wordCount?.style('search-popover-result-work-word-count')
									details.timestamp.use(details, c => c?.style('search-popover-result-work-timestamp'))
									State.Map(details, [details.timestamp, details.timestampAlternative], (timestamp, timestampAlternative) => timestamp ?? timestampAlternative)
										.use(details, timestamp => timestamp?.appendTo(result.subtitle))
								})
							)
							.appendTo(slot)
					}
				})
				.appendTo(sectionsWrapper)

			ResultsSection()
				.titleText.use('search/section/authors/title')
				.handle((slot, searchResults) => {
					const authors = searchResults?.authors.map(vanity => searchResults.authorData.find(a => a.vanity === vanity)).filter(a => a !== undefined)
					if (!authors?.length)
						return NoResults()

					for (const author of authors)
						SearchResult(`/author/${author.vanity}`)
							.titleText.set(author.name)
							.tweak(result => result.title.textWrapper.and(GradientText).useGradient(author.supporter?.username_colours))
							.tweak(result => result.subtitle.append(AuthorSubtitle(author)))
							.tweak(result => result.details.and(AuthorFooter, author)
								.tweak(details => {
									details.left.style('search-popover-result-details-left')
									details.right.style('search-popover-result-details-right')
									details.workCount?.style('search-popover-result-author-work-count')
									details.wordCount?.style('search-popover-result-author-word-count')
									details.timeJoin.remove()
								})
							)
							.appendTo(slot)
				})
				.appendTo(sectionsWrapper)

			ResultsSection()
				.style('search-popover-section--tags')
				.titleText.use('search/section/tags/title')
				.handle(AbortPromise.asyncFunction(async (signal, slot) => {
					const tags = await Tags.getManifest()
					if (signal.aborted)
						return

					const searchText = textInput.value.toLowerCase()

					const matchingTags = Object.keys(tags.tags)
						.filter(tag => tag.toLowerCase().includes(searchText))
						.map(tagId => tags.tags[tagId as keyof typeof tags.tags])

					if (!matchingTags.length)
						return NoResults()

					for (const tag of matchingTags)
						SearchResult(`/tag/${tag.categoryLowercase}/${tag.nameLowercase}`)
							.titleText.set(`${tag.category}: ${tag.name}`)
							.tweak(result => result.description
								.style('search-popover-result-description--tag')
								.setMarkdownContent(tag.description)
							)
							.appendTo(slot)
				}))
				.appendTo(sectionsWrapper)
		})
		.appendTo(document.body)

	////////////////////////////////////
	//#region Event Handling

	navigate.state.subscribe(component, () => {
		textInput.value = ''
		popover.hide()
	})

	textInput.event.subscribe('keydown', event => {
		if (event.key === 'Enter') {
			popover.focus()
		}
	})

	textInput.state.subscribeManual(searchText => {
		if (searchText.length < 3)
			return

		void queueLookup()
	})

	State.UseManual({ focused: textInput.hasFocused, longEnough: textInput.state.mapManual(state => state.length > 2) }).useManual(async ({ focused, longEnough }) => {
		if (focused && longEnough) {
			popover.show()
			popover.anchor.apply()
			await Async.sleep(50)
			popover.anchor.apply()
			updatePopoverWidth()
		}
		else if (!longEnough)
			popover.hide()
	})

	//#endregion
	////////////////////////////////////

	let lastLookup: number
	let lookupTimeout: number
	return component
		.style('search')
		.append(Icon('magnifying-glass')
			.style('search-icon')
		)
		.append(textInput)
		.onRooted(() => {
			Viewport.size.use(popover, updatePopoverWidth)
		})

	function queueLookup () {
		if (!lastLookup)
			return void lookup()

		const timeTillNextAvailableLookup = Math.max(0, (lastLookup + 1000) - Date.now())
		if (!timeTillNextAvailableLookup)
			return void lookup()

		clearTimeout(lookupTimeout)
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		lookupTimeout = window.setTimeout(lookup, timeTillNextAvailableLookup)
	}

	async function lookup () {
		lastLookup = Date.now()

		loading.value = true
		searchResults.value = textInput.value.length < 3 ? undefined
			: await EndpointSearchGet.query(undefined, { text: textInput.value })
				.then(response => response.data ?? undefined)
				.catch(() => undefined)
		loading.value = false
	}

	function updatePopoverWidth () {
		popover.style.setProperty('width', `${component.element.clientWidth}px`)
	}
})
