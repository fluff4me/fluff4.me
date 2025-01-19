import type Endpoint from 'endpoint/Endpoint'
import type { EndpointResponse, PaginatedEndpoint, PaginatedEndpointRoutes as PaginatedEndpointRoute, PreparedQueryOf, ResponseData } from 'endpoint/Endpoint'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Slot from 'ui/component/core/Slot'
import Async from 'utility/Async'
import State from 'utility/State'

type PaginatedEndpointRouteFiltered<DATA_FILTER> = keyof {
	[ROUTE in PaginatedEndpointRoute]: DATA_FILTER extends ResponseData<EndpointResponse<Endpoint<ROUTE>>> ? ROUTE : never
}

interface PaginatorUseInitialFactory<DATA, HOST> {
	thenUse<ROUTE extends PaginatedEndpointRouteFiltered<DATA>> (endpoint: PreparedQueryOf<Endpoint<ROUTE>>): PaginatorUseInitialFactory2<DATA, HOST>
}

interface PaginatorUseInitialFactory2<DATA, HOST> {
	withContent (contentInitialiser: (slot: Slot, response: DATA, paginator: HOST) => unknown): Promise<Paginator<DATA>>
}

interface PaginatorExtensions<DATA = any> {
	readonly page: State<number>
	readonly data: State<DATA>
	useEndpoint<ROUTE extends PaginatedEndpointRoute, DATA extends ResponseData<EndpointResponse<Endpoint<ROUTE>>>> (endpoint: PreparedQueryOf<Endpoint<ROUTE>>, contentInitialiser: (slot: Slot, response: DATA, paginator: this) => unknown): Promise<this>
	useInitial<DATA> (data: DATA | undefined, page: number, pageCount: number | true): PaginatorUseInitialFactory<DATA, this>
	orElse (contentInitialiser: (slot: Slot) => unknown): this
}

interface Paginator<DATA = any> extends Block, PaginatorExtensions<DATA> { }

type PageInitialiser<HOST extends Paginator> = (slot: Slot, response: ResponseData<EndpointResponse<PaginatedEndpoint>>, paginator: HOST) => unknown

interface PaginatorUsing<HOST extends Paginator> {
	endpoint: PreparedQueryOf<PaginatedEndpoint>
	pageCount: number | true
	initialiser: PageInitialiser<HOST>
}

interface PaginatorExtensionsInternal extends PaginatorExtensions, PaginatorUseInitialFactory<any, PaginatorExtensionsInternal>, PaginatorUseInitialFactory2<any, PaginatorExtensionsInternal> { }

const Paginator = Component.Builder((component): Paginator => {
	const block = component.and(Block)

	const isFlush = block.type.state.mapManual(type => type.has('flush'))

	block.style.bind(isFlush, 'paginator--flush')

	block.header
		.style('paginator-header')
		.style.bind(isFlush, 'paginator-header--flush')

	const content = block.content
		.style('paginator-content')

	block.footer
		.style('paginator-footer', 'paginator-footer--hidden')
		.style.bind(isFlush, 'paginator-footer--flush')

	block.footer.left.style('paginator-footer-left')
	block.footer.right.style('paginator-footer-right')

	const buttonFirst = Button()
		.setIcon('angles-left')
		.style('paginator-button')
		.event.subscribe('click', () => showPage(0))
		.appendTo(block.footer.left)

	const buttonPrev = Button()
		.setIcon('angle-left')
		.style('paginator-button')
		.event.subscribe('click', () => showPage(Math.max(cursor.value - 1, 0)))
		.appendTo(block.footer.left)

	const buttonNext = Button()
		.setIcon('angle-right')
		.style('paginator-button')
		.event.subscribe('click', () => showPage(Math.min(cursor.value + 1, using?.pageCount === true ? Infinity : pages.length - 1)))
		.appendTo(block.footer.right)

	const buttonLast = Button()
		.setIcon('angles-right')
		.style('paginator-button')
		.event.subscribe('click', () => showPage(pages.length - 1))
		.appendTo(block.footer.right)

	let pageContent: ResponseData<EndpointResponse<PaginatedEndpoint>>[] = []
	let pages: Slot[] = []
	const cursor = State(0)
	const data = cursor.mapManual(page => pageContent[page])
	let showingPage = -1
	let orElseContentInitialiser: ((slot: Slot) => unknown) | undefined
	let isEmpty = true

	let using: PaginatorUsing<Paginator> | undefined
	const paginator = block
		.viewTransition('paginator')
		.style('paginator')
		.extend<PaginatorExtensionsInternal>(component => ({
			page: cursor,
			data,
			useInitial (initialData, page, pageCount) {
				resetPages()
				pageContent[page] = initialData as never
				cursor.value = page
				data.refresh()
				using = { endpoint: undefined!, initialiser: undefined!, pageCount }
				return component
			},
			thenUse (endpoint) {
				using!.endpoint = endpoint as PreparedQueryOf<PaginatedEndpoint>
				return component
			},
			async withContent (contentInitialiser) {
				clearContent()
				using!.initialiser = contentInitialiser as never
				await setup(pageContent[cursor.value], cursor.value, using!.pageCount)
				return component
			},
			async useEndpoint (endpoint, initialiser) {
				clearContent()
				resetPages()

				const mainPage = MainPage()

				let response: EndpointResponse<PaginatedEndpoint>
				while (true) {
					const result = await endpoint.query()
					if (toast.handleError(result)) {
						mainPage.removeContents()
						await new Promise<void>(resolve => mainPage.append(RetryDialog(resolve)))
						continue
					}

					response = result as EndpointResponse<PaginatedEndpoint>
					break
				}

				using = { endpoint: endpoint as PreparedQueryOf<PaginatedEndpoint>, initialiser: initialiser as never, pageCount: response.page_count }
				await setup(response.data, 0, response.page_count)
				return component
			},
			orElse (contentInitialiser) {
				orElseContentInitialiser = contentInitialiser
				if (isEmpty) {
					clearContent()
					resetPages()
					const mainPage = MainPage()
						.style.remove('paginator-page--hidden')
					content.style('paginator-content--or-else')
					contentInitialiser(mainPage)
				}
				return component
			},
		}))
	return paginator

	function clearContent () {
		content.removeContents()
		block.footer.style('paginator-footer--hidden')
	}

	function resetPages () {
		pageContent = []
		pages = []
		cursor.value = 0
	}

	async function setup (initialData: ResponseData<EndpointResponse<PaginatedEndpoint>>, page: number, pageCount: number | true) {
		if (pageCount === true || pageCount > 1)
			block.footer.style.remove('paginator-footer--hidden')

		if (pageCount !== true)
			while (pages.length < pageCount)
				pages.push(Page())

		else if (!pages.length)
			MainPage() // already gets pushed

		const pageComponent = pages[page]
			.style('paginator-page--initial-load')
			.style.remove('paginator-page--hidden')

		pageContent[page] = initialData
		cursor.value = page
		data.refresh()

		if (initialData && (!Array.isArray(initialData) || initialData.length)) {
			await using!.initialiser(pageComponent, initialData, paginator)
			isEmpty = false
		}
		else {
			content.style('paginator-content--or-else')
			orElseContentInitialiser?.(pageComponent)
		}

		updateButtons(page)
	}

	function MainPage () {
		const mainPage = Page()
			.style('paginator-page--initial-load')
		pages.push(mainPage)
		return mainPage
	}

	function Page () {
		return Slot()
			.style('paginator-page', 'paginator-page--hidden')
			.style.bind(isFlush, 'paginator-page--flush')
			.appendTo(content)
	}

	function RetryDialog (retry: () => unknown) {
		return Component()
			.style('paginator-error')
			.append(Component()
				.style('paginator-error-text')
				.text.use('component/paginator/error'))
			.append(Button()
				.type('primary')
				.style('paginator-error-retry-button')
				.text.use('component/paginator/error/retry')
				.event.subscribe('click', () => retry()))
	}

	function updateButtons (page = cursor.value, pageCount = using?.pageCount ?? 0) {
		buttonFirst.style.toggle(page <= 0, 'paginator-button--disabled')
		buttonPrev.style.toggle(page <= 0, 'paginator-button--disabled')
		buttonNext.style.toggle(pageCount !== true && page >= pageCount - 1, 'paginator-button--disabled')
		buttonLast.style.toggle(pageCount !== true && page >= pageCount - 1, 'paginator-button--disabled')
		buttonLast.style.toggle(pageCount === true, 'paginator-button--hidden')
	}

	async function showPage (number: number) {
		if (cursor.value === number || !using)
			return

		const oldNumber = cursor.value
		const direction = Math.sign(number - oldNumber)

		pages[oldNumber]
			.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
			.style('paginator-page--hidden')
			.style.setVariable('page-direction', direction)

		let page = pages[number]
		if (!page)
			pages.push(page ??= Page())

		page.style.setVariable('page-direction', direction)

		updateButtons(number)

		if (pageContent[number]) {
			cursor.value = number
			page.style.remove('paginator-page--hidden')
			scrollIntoView(direction)
			return
		}

		let response: EndpointResponse<PaginatedEndpoint>
		while (true) {
			page.removeContents()
			showingPage = number
			const result = await using?.endpoint.query(undefined, { page: number })
			if (showingPage !== number)
				return

			const isError = toast.handleError(result)
			if (!isError && !hasResults(result.data)) {
				cursor.value = number
				pages[oldNumber].style('paginator-page--bounce')
				await Async.sleep(200)
				return showPage(oldNumber)
			}

			page.style.remove('paginator-page--hidden')

			if (isError) {
				await new Promise<void>(resolve => {
					RetryDialog(resolve).appendTo(page)
					block.header.element.scrollIntoView()
				})
				if (showingPage !== number)
					return

				continue
			}

			response = result as EndpointResponse<PaginatedEndpoint>
			break
		}

		pageContent[number] = response.data
		cursor.value = number
		await using?.initialiser(page, response.data, paginator)
		scrollIntoView(direction)
	}

	function scrollIntoView (direction: number) {
		const scrollTarget = direction > 0 ? block.element : pages[cursor.value].element.lastElementChild
		scrollTarget?.scrollIntoView()
	}
})

function hasResults (result: unknown) {
	if (result === null || result === undefined)
		return false

	if (typeof result !== 'object')
		return true

	if (Array.isArray(result))
		return result.length > 0

	for (const sub of Object.values(result))
		if (hasResults(sub))
			return true

	return false
}

export default Paginator
