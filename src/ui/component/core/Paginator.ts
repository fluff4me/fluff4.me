import type PagedData from 'model/PagedData'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import Async from 'utility/Async'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Style from 'utility/Style'

interface ScrollContext {
	scrollRect: DOMRect
	scrollAnchorTopRect: DOMRect
	scrollAnchorBottomRect: DOMRect
	previousScrollRect?: DOMRect
	scrollAnchorTopPreviousRect?: DOMRect
	scrollAnchorBottomPreviousRect?: DOMRect
}

interface PaginatorExtensions<DATA = any> {
	readonly page: State.Mutable<number>
	readonly data: State<DATA>
	readonly scrollAnchorBottom: Component
	set<DATA_SOURCE extends PagedData<DATA>> (data: DATA_SOURCE, initialiser: (slot: Slot, data: DATA_SOURCE extends PagedData<infer NEW_DATA> ? NEW_DATA : never, page: number, source: DATA_SOURCE, paginator: this) => unknown): Paginator<DATA_SOURCE extends PagedData<infer NEW_DATA> ? NEW_DATA : never>
	orElse (initialiser: (slot: Slot, paginator: this) => unknown): this
	setScroll (scroll: boolean | ((target: HTMLElement, direction: 'forward' | 'backward', context: ScrollContext) => unknown)): this
}

interface Paginator<DATA = any> extends Block, PaginatorExtensions<DATA> { }

const Paginator = Component.Builder(<T> (component: Component): Paginator<T> => {
	const block = component.and(Block)

	const isFlush = block.type.state.mapManual(type => type.has('flush'))

	const mastheadHeight = Style.measure('--masthead-height')
	const space4 = Style.measure('--space-4')
	void mastheadHeight.value; void space4.value // trigger init

	block.style.bind(isFlush, 'paginator--flush')

	block.tweakJIT('header', header => {
		header.style('paginator-header')
			.style.bind(isFlush, 'paginator-header--flush')
			.style.bind(component.getStateForClosest(Popover).truthy, 'paginator-header--within-popover')

		block.content.style('paginator-content--has-header')
	})

	const content = block.content
		.style('paginator-content')
		.style.bind(isFlush, 'paginator-content--flush')

	block.footer
		.style('paginator-footer')
		.style.bind(isFlush, 'paginator-footer--flush')

	const scrollAnchorBottom = Component()
		.style('paginator-after-anchor')
		.appendTo(block)

	block.footer.left.style('paginator-footer-left')
	block.footer.right.style('paginator-footer-right')

	const cursor = State(0)
	const allData = State<PagedData<T> | undefined>(undefined, false)
	const pageCount = allData.mapManual(data => data?.pageCount)
	const hasNoPageCount = pageCount.mapManual(count => count === undefined)
	const isMultiPage = pageCount.mapManual(count => count === undefined || count > 1)

	const currentData = State<T | false | null>(false, false)
	let settingId = Symbol()
	State.Use(component, { cursor, allData }).use(component, async ({ cursor, allData }) => {
		if (!allData)
			return currentData.value = false

		const ownId = settingId = Symbol()
		const value = await allData?.get(cursor)
		if (settingId !== ownId)
			return

		currentData.bind(component, value)
	})

	const isFirstPage = cursor.mapManual(cursor => cursor <= 0)
	const isLastPage = State.Map(component, [cursor, pageCount], (cursor, pageCount) => cursor + 1 >= (pageCount ?? Infinity))

	// first
	Button()
		.setIcon('angles-left')
		.type('icon')
		.style('paginator-button')
		.style.bind(isFirstPage, 'paginator-button--disabled')
		.event.subscribe('click', () => cursor.value = 0)
		.appendTo(block.footer.left)

	// prev
	Button()
		.setIcon('angle-left')
		.type('icon')
		.style('paginator-button')
		.style.bind(isFirstPage, 'paginator-button--disabled')
		.event.subscribe('click', () => cursor.value = Math.max(cursor.value - 1, 0))
		.appendTo(block.footer.left)

	// next
	Button()
		.setIcon('angle-right')
		.type('icon')
		.style('paginator-button')
		.style.bind(isLastPage, 'paginator-button--disabled')
		.event.subscribe('click', () => cursor.value = Math.min(cursor.value + 1, pageCount.value === undefined ? Infinity : pageCount.value - 1))
		.appendTo(block.footer.right)

	// last
	Button()
		.setIcon('angles-right')
		.type('icon')
		.style('paginator-button')
		.style.bind(isLastPage, 'paginator-button--disabled')
		.style.bind(hasNoPageCount, 'paginator-button--hidden')
		.event.subscribe('click', () => cursor.value = !pageCount.value ? cursor.value : pageCount.value - 1)
		.appendTo(block.footer.right)

	let initialiser: ((slot: Slot, data: T, page: number, source: PagedData<T>, paginator: Paginator<T>) => unknown) | undefined
	let orElseInitialiser: ((slot: Slot, paginator: Paginator<T>) => unknown) | undefined

	let scrollOption: boolean | undefined | ((target: HTMLElement, direction: 'forward' | 'backward', context: ScrollContext) => unknown)

	const paginator = block
		.viewTransition('paginator')
		.style('paginator')
		.extend<PaginatorExtensions>(component => ({
			page: cursor,
			data: currentData,
			scrollAnchorBottom,
			set (data, initialiserIn) {
				initialiser = initialiserIn as never
				allData.value = data
				const emitCursorUpdate = () => cursor.emit()
				data.event.subscribe('DeletePage', emitCursorUpdate)
				component.removed.awaitManual(true, () => data.event.unsubscribe('DeletePage', emitCursorUpdate))
				return this as never
			},
			orElse (initialiser) {
				orElseInitialiser = initialiser
				return this
			},
			setScroll (scroll = true) {
				scrollOption = scroll
				return this
			},
		}))

	paginator.footer.style.bind(isMultiPage.not, 'paginator-footer--hidden')

	let bouncedFrom: number | undefined
	let scrollAnchorBottomPreviousRect: DOMRect | undefined
	let scrollAnchorTopPreviousRect: DOMRect | undefined
	let previousScrollRect: DOMRect | undefined
	let removeLastScrollIntoViewHandler: (() => void) | undefined
	let unuseCursor: UnsubscribeState | undefined

	Slot()
		.use(allData, (slot, data) => {
			const wrapper = Slot().appendTo(slot)

			const pages: (Page | undefined)[] = []
			const handleDelete = (event: Event, pageNumber: number) => {
				const page = pages[pageNumber]
				page?.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
					.style('paginator-page--hidden')
					.style.setVariable('page-direction', 0)
				pages.splice(pageNumber, 1)
			}
			data?.event.subscribe('DeletePage', handleDelete)
			slot.closed.awaitManual(true, () => data?.event.unsubscribe('DeletePage', handleDelete))
			const handleUnset = (event: Event, startNumber: number, endNumberInclusive: number) => {
				for (let pageNumber = startNumber; pageNumber <= endNumberInclusive; pageNumber++) {
					pages[pageNumber]?.remove()
					// eslint-disable-next-line @typescript-eslint/no-array-delete
					delete pages[pageNumber]
				}
			}
			data?.event.subscribe('UnsetPages', handleUnset)
			slot.closed.awaitManual(true, () => data?.event.unsubscribe('UnsetPages', handleUnset))
			// const handleSet = (event: Event, page: number, data: T) => {
			// 	if (cursor.value === page)
			// 		currentData.emit()
			// }
			// data?.event.subscribe('SetPage', handleSet)
			// slot.closed.awaitManual(true, () => data?.event.unsubscribe('SetPage', handleSet))

			unuseCursor?.()
			unuseCursor = cursor.use(slot, async (pageNumber, previousPageNumber) => {
				previousScrollRect = new DOMRect(0, window.scrollY, window.innerWidth, document.documentElement.scrollHeight)
				scrollAnchorTopPreviousRect = paginator.element.getBoundingClientRect()
				scrollAnchorBottomPreviousRect = scrollAnchorBottom.element.getBoundingClientRect()
				removeLastScrollIntoViewHandler?.(); removeLastScrollIntoViewHandler = undefined

				const isInitialPage = !pages.length

				const newPage = pages[pageNumber] ??= (await Page(pageNumber))?.appendTo(wrapper)

				const direction = Math.sign(pageNumber - (previousPageNumber ?? pageNumber))
				const previousPage = previousPageNumber === undefined ? undefined : pages[previousPageNumber]
				previousPage
					?.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
					.style('paginator-page--hidden')
					.style.setVariable('page-direction', direction)

				newPage
					?.style.toggle(isInitialPage, 'paginator-page--initial-load')
					.style.setVariable('page-direction', direction)

				if (!data || !newPage)
					return

				const hasContent = newPage.content.value === false || hasResults(newPage.content.value)
				if (hasContent) {
					newPage.style.remove('paginator-page--hidden')
					const newScrollHeight = document.documentElement.scrollHeight
					if (newScrollHeight > previousScrollRect.height)
						scrollIntoView(direction)
					else {
						const doScrollIntoView = () => scrollIntoView(direction)
						previousPage?.element.addEventListener('transitionend', doScrollIntoView, { once: true })
						removeLastScrollIntoViewHandler = () => {
							previousPage?.element.removeEventListener('transitionend', doScrollIntoView)
							removeLastScrollIntoViewHandler = undefined
						}
					}
					return
				}

				if (previousPageNumber !== undefined) {
					if (bouncedFrom === previousPageNumber)
						return

					// empty, play bounce animation
					pages[previousPageNumber]?.style('paginator-page--bounce')
					await Async.sleep(200)
					bouncedFrom = pageNumber
					cursor.value = previousPageNumber
				}
				else {
					const isTotallyEmpty = false
						|| data.pageCount.value === 0
						|| data.pages.every(page => false
							|| page.value === false
							|| page.value === null
							|| (Array.isArray(page.value) && !page.value.length)
						)
					if (isTotallyEmpty) {
						orElseInitialiser?.(newPage, paginator)
						newPage.style.remove('paginator-page--hidden')
						return
					}
				}
			})

			interface Page extends Slot {
				content: State<T | false | null>
			}

			async function Page (pageNumber: number): Promise<Page | undefined> {
				const page = Slot()
					.style('paginator-page', 'paginator-page--hidden')
					.style.bind(isFlush, 'paginator-page--flush')

				if (!data)
					return undefined

				const pageContent = await data.get(pageNumber)
				pageContent.use(slot, async content => {
					page.removeContents()

					const hasContent = hasResults(content)
					if (hasContent) {
						initialiser?.(page, content as T, pageNumber, data, paginator)
						return
					}

					// no content — either errored or empty

					if (content === false) {
						// errored, show retry dialog, when dialog 
						await new Promise<void>(resolve => {
							RetryDialog(resolve).appendTo(page)
							block.header.element.scrollIntoView()
						})
						return await data.get(pageNumber)
					}
				})

				return Object.assign(page, { content: pageContent })
			}

			function scrollIntoView (direction: number) {
				if (!direction || scrollOption === false)
					return

				const scrollTarget = direction > 0 ? block.element : scrollAnchorBottom.element
				if (!scrollTarget)
					return

				if (typeof scrollOption === 'function') {
					scrollOption(scrollTarget, direction > 0 ? 'forward' : 'backward', {
						scrollRect: new DOMRect(0, window.scrollY, window.innerWidth, document.documentElement.scrollHeight),
						scrollAnchorTopRect: block.element.getBoundingClientRect(),
						scrollAnchorBottomRect: scrollAnchorBottom.element.getBoundingClientRect(),
						previousScrollRect: previousScrollRect,
						scrollAnchorTopPreviousRect,
						scrollAnchorBottomPreviousRect,
					})
					return
				}

				const target = scrollTarget.getBoundingClientRect().top + window.scrollY - mastheadHeight.value - space4.value
				window.scrollTo({ top: target, behavior: 'smooth' })
			}
		})
		.appendTo(content)

	return paginator

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
