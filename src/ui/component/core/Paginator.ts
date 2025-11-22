import type PagedData from 'model/PagedData'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Loading from 'ui/component/core/Loading'
import Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import MarkdownContent from 'ui/utility/MarkdownContent'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import Async from 'utility/Async'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Strings from 'utility/string/Strings'
import Style from 'utility/Style'
import type { PromiseOr } from 'utility/Type'

interface ScrollContext {
	scrollRect: DOMRect
	scrollAnchorTopRect: DOMRect
	scrollAnchorBottomRect: DOMRect
	previousScrollRect?: DOMRect
	scrollAnchorTopPreviousRect?: DOMRect
	scrollAnchorBottomPreviousRect?: DOMRect
}

interface Page<T> extends Slot {
	content: PromiseOr<State<T | false | null>>
}

export type PaginatorHasResultsPredicate<DATA> = (data: DATA, hasResults: (data: unknown) => boolean) => unknown

interface PaginatorExtensions<DATA = any> {
	readonly headerActions: ActionRow
	readonly page: State.Mutable<number>
	readonly data: State<DATA>
	readonly scrollAnchorBottom: Component
	set<DATA_SOURCE extends PagedData<DATA>> (data: DATA_SOURCE, page: number, initialiser: (slot: Slot, data: DATA_SOURCE extends PagedData<infer NEW_DATA> ? NEW_DATA : never, page: number, source: DATA_SOURCE, paginator: this) => unknown): Paginator<DATA_SOURCE extends PagedData<infer NEW_DATA> ? NEW_DATA : never>
	setHasResults (predicate?: PaginatorHasResultsPredicate<DATA | undefined | null | false>): this
	orElse (initialiser: (slot: Slot, paginator: this) => unknown): this
	setScroll (scroll: boolean | ((target: HTMLElement, direction: 'forward' | 'backward', context: ScrollContext) => unknown)): this
	getPages (): (Page<DATA> | undefined)[]
	onReset (owner: State.Owner | null, resetHandler: () => unknown): UnsubscribeState
}

interface PaginatorEvents {
	PageError (page: number): any
}

interface Paginator<DATA = any> extends Block, PaginatorExtensions<DATA> {
	readonly event: EventManipulator<this, Events<Block, PaginatorEvents>>
}

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

	void block.footer

	const scrollAnchorBottom = Component()
		.style('paginator-after-anchor')
		.appendTo(block)

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

	initPaginatorActions(block.footer)
	function initPaginatorActions (actions: ActionRow) {
		actions
			.style('paginator-actions')
			.style.bind(isFlush, 'paginator-actions--flush')
			.style.bind(isMultiPage.not, 'paginator-actions--hidden')

		actions.left.style('paginator-actions-left')
		actions.right.style('paginator-actions-right')
		actions.middle.style('paginator-actions-middle')

		// first
		Button()
			.setIcon('angles-left')
			.type('icon')
			.style('paginator-button')
			.style.bind(isFirstPage, 'paginator-button--disabled')
			.ariaLabel.use('paginator/first/label')
			.event.subscribe('click', () => cursor.value = 0)
			.appendTo(actions.left)

		// prev
		Button()
			.setIcon('angle-left')
			.type('icon')
			.style('paginator-button')
			.style.bind(isFirstPage, 'paginator-button--disabled')
			.ariaLabel.use('paginator/previous/label')
			.event.subscribe('click', () => cursor.value = Math.max(cursor.value - 1, 0))
			.appendTo(actions.left)

		// next
		Button()
			.setIcon('angle-right')
			.type('icon')
			.style('paginator-button')
			.style.bind(isLastPage, 'paginator-button--disabled')
			.ariaLabel.use('paginator/next/label')
			.event.subscribe('click', () => cursor.value = Math.min(cursor.value + 1, pageCount.value === undefined ? Infinity : pageCount.value - 1))
			.appendTo(actions.right)

		// last
		Button()
			.setIcon('angles-right')
			.type('icon')
			.style('paginator-button')
			.style.bind(isLastPage, 'paginator-button--disabled')
			.style.bind(hasNoPageCount, 'paginator-button--hidden')
			.ariaLabel.use('paginator/last/label')
			.event.subscribe('click', () => cursor.value = !pageCount.value ? cursor.value : pageCount.value - 1)
			.appendTo(actions.right)
	}

	let initialiser: ((slot: Slot, data: T, page: number, source: PagedData<T>, paginator: Paginator<T>) => unknown) | undefined
	let orElseInitialiser: ((slot: Slot, paginator: Paginator<T>) => unknown) | undefined
	let hasResultsPredicate: PaginatorHasResultsPredicate<T | undefined | null | false> | undefined

	let scrollOption: boolean | undefined | ((target: HTMLElement, direction: 'forward' | 'backward', context: ScrollContext) => unknown)

	let unsubscribeDataDeletePage: UnsubscribeState | undefined
	let unuseComponentRemoveToUnsubscribeDataDeletePage: UnsubscribeState | undefined

	const paginator: Paginator<T> = block
		.viewTransition('paginator')
		.style('paginator')
		.extend<PaginatorExtensions>(component => ({
			headerActions: undefined!,
			page: cursor,
			data: currentData,
			scrollAnchorBottom,
			set (data, page, initialiserIn) {
				initialiser = initialiserIn as never
				unuseCursor?.(); unuseCursor = undefined
				removeLastScrollIntoViewHandler?.(); removeLastScrollIntoViewHandler = undefined
				unsubscribeDataDeletePage?.(); unsubscribeDataDeletePage = undefined
				unuseComponentRemoveToUnsubscribeDataDeletePage?.(); unuseComponentRemoveToUnsubscribeDataDeletePage = undefined
				cursor.setValueSilent(page)
				allData.value = data
				cursor.emit()
				const emitCursorUpdate = () => cursor.emit()
				data.event.subscribe('DeletePage', emitCursorUpdate)
				unsubscribeDataDeletePage = () => data.event.unsubscribe('DeletePage', emitCursorUpdate)
				unuseComponentRemoveToUnsubscribeDataDeletePage = component.removed.matchManual(true, unsubscribeDataDeletePage)
				return component
			},
			orElse (initialiser) {
				orElseInitialiser = initialiser
				return component
			},
			setHasResults (predicate) {
				hasResultsPredicate = predicate
				return component
			},
			setScroll (scroll = true) {
				scrollOption = scroll
				return component
			},
			getPages () {
				return pages
			},
			onReset (owner, resetHandler) {
				return !owner ? allData.useManual(() => resetHandler()) : allData.use(owner, () => resetHandler())
			},
		}))
		.extendJIT('headerActions', paginator => ActionRow()
			.tweak(initPaginatorActions)
			.style('paginator-actions--header')
			.style.bind(isFlush, 'paginator-actions--header--flush')
			.prependTo(paginator))

	let bouncedFrom: number | undefined
	let scrollAnchorBottomPreviousRect: DOMRect | undefined
	let scrollAnchorTopPreviousRect: DOMRect | undefined
	let previousScrollRect: DOMRect | undefined
	let removeLastScrollIntoViewHandler: (() => void) | undefined
	let unuseCursor: UnsubscribeState | undefined
	const pages: (Page<T> | undefined)[] = []

	Slot()
		.use(allData, (slot, data) => {
			const wrapper = Slot().appendTo(slot)

			pages.splice(0, Infinity)

			const handleDelete = (event: Event, pageNumber: number) => {
				const page = pages[pageNumber]
				page?.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
					.style('paginator-page--hidden')
					.style.setVariable('page-direction', 0)
				pages.splice(pageNumber, 1)
			}
			data?.event.subscribe('DeletePage', handleDelete)
			slot.closed.matchManual(true, () => data?.event.unsubscribe('DeletePage', handleDelete))
			const handleUnset = (event: Event, startNumber: number, endNumberInclusive: number) => {
				for (let pageNumber = startNumber; pageNumber <= endNumberInclusive; pageNumber++) {
					pages[pageNumber]?.remove()
					// eslint-disable-next-line @typescript-eslint/no-array-delete
					delete pages[pageNumber]
				}
			}
			data?.event.subscribe('UnsetPages', handleUnset)
			slot.closed.matchManual(true, () => data?.event.unsubscribe('UnsetPages', handleUnset))
			// const handleSet = (event: Event, page: number, data: T) => {
			// 	if (cursor.value === page)
			// 		currentData.emit()
			// }
			// data?.event.subscribe('SetPage', handleSet)
			// slot.closed.awaitManual(true, () => data?.event.unsubscribe('SetPage', handleSet))

			let isInitialCursorEmit: number | false | undefined
			unuseCursor?.()
			unuseCursor = cursor.use(slot, async (pageNumber, previousPageNumber) => {
				isInitialCursorEmit ??= pageNumber
				if (pageNumber === isInitialCursorEmit) {
					isInitialCursorEmit = false
					return
				}

				previousScrollRect = new DOMRect(0, window.scrollY, window.innerWidth, document.documentElement.scrollHeight)
				scrollAnchorTopPreviousRect = paginator.element.getBoundingClientRect()
				scrollAnchorBottomPreviousRect = scrollAnchorBottom.element.getBoundingClientRect()
				removeLastScrollIntoViewHandler?.(); removeLastScrollIntoViewHandler = undefined

				const isInitialPage = !pages.length

				const newPage = pages[pageNumber] ??= Page(pageNumber)?.appendTo(wrapper)

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

				const content = await newPage.content

				const hasContent = content?.value === false || (hasResultsPredicate ?? hasResults)(content?.value, hasResults)
				if (hasContent) {
					newPage.style.remove('paginator-page--hidden')
					// waiting for transition end is broken by some kind of transition bug causing the event to never fire
					// const newScrollHeight = document.documentElement.scrollHeight
					// if (newScrollHeight > previousScrollRect.height)
					scrollIntoView(direction)
					// else {
					// 	const doScrollIntoView = () => scrollIntoView(direction)
					// 	previousPage?.element.addEventListener('transitionend', doScrollIntoView, { once: true })
					// 	removeLastScrollIntoViewHandler = () => {
					// 		previousPage?.element.removeEventListener('transitionend', doScrollIntoView)
					// 		removeLastScrollIntoViewHandler = undefined
					// 	}
					// }
					return
				}

				if (previousPageNumber !== undefined) {
					if (bouncedFrom === previousPageNumber)
						return

					// empty, play bounce animation
					pages[previousPageNumber]?.style('paginator-page--bounce')
					scrollIntoView(-1, true)
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

			function Page (pageNumber: number): Page<T> | undefined {
				const viewTransitionName = `paginator-page${Strings.uid()}`
				const page = Slot()
					.style('paginator-page')

				function newContent () {
					page.removeContents()
					return Slot()
						.style.remove('slot')
						.style('paginator-page-content')
						.style.bind(isFlush, 'paginator-page-content--flush')
						.subviewTransition(viewTransitionName)
						.appendTo(page)
				}

				if (!data)
					return undefined

				LoadingDialog().appendTo(newContent())

				const pageContent = data.get(pageNumber)
				void Promise.resolve(pageContent).then(pageContent => {
					pageContent.use(slot, async content => {
						const hasContent = (hasResultsPredicate ?? hasResults)(content, hasResults)
						if (hasContent) {
							if (paginator.getViewTransition())
								ViewTransition.perform('subview', viewTransitionName, swap)
							else
								void swap()

							async function swap () {
								await initialiser?.(newContent(), content as T, pageNumber, data!, paginator)
							}
							return
						}

						page.removeContents()
						// no content — either errored or empty

						while (content === false) {
							// errored, show retry dialog
							paginator.event.emit('PageError', pageNumber)

							await new Promise<void>(resolve => {
								ViewTransition.perform('subview', viewTransitionName, () => {
									RetryDialog(resolve).appendTo(newContent())
								})
								block.header.element.scrollIntoView()
							})

							ViewTransition.perform('subview', viewTransitionName, () => {
								LoadingDialog().appendTo(newContent())
							})

							content = (await data.get(pageNumber)).value
						}
					})
				})

				return Object.assign(page, { content: pageContent })
			}

			function scrollIntoView (direction: number, instant = false) {
				if (!direction || scrollOption === false)
					return

				if (component.closest(Popover))
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

				if (direction > 0) {
					const target = scrollTarget.getBoundingClientRect().top + window.scrollY - mastheadHeight.value - space4.value
					window.scrollTo({ top: target, behavior: instant ? 'instant' : 'smooth' })
				}
				else {
					const target = scrollTarget.getBoundingClientRect().top + window.scrollY + space4.value - window.innerHeight
					window.scrollTo({ top: target, behavior: instant ? 'instant' : 'smooth' })
				}
			}
		})
		.appendTo(content)

	return paginator

	function RetryDialog (retry: () => unknown) {
		return Component()
			.style('paginator-error')
			.append(Component()
				.style('paginator-error-text')
				.text.use('paginator/error'))
			.append(Button()
				.type('primary')
				.style('paginator-error-retry-button')
				.text.use('paginator/error/retry')
				.event.subscribe('click', () => retry()))
	}

	function LoadingDialog () {
		return Component()
			.style('paginator-loading')
			.append(Loading()
				.style('paginator-loading-flag'))
	}
})

function hasResults (result: unknown) {
	if (result === null || result === undefined || result === false)
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

MarkdownContent.handle((element, context) => {
	if (!element.getAttribute('id')?.length)
		return

	return () => {
		const anchor = Component().replaceElement(element, true)
			.style('link-anchor')

		anchor.onRooted(() => {
			const pageHidden = anchor.getStateForClosest(Paginator)
				.map(anchor, paginator => paginator
					?.getPages()
					.find(page => page?.element.contains(anchor.element))
					?.style.getState(anchor, 'paginator-page--hidden')
				)

			const id = anchor.element.id
			anchor.attributes.remove('id')

			anchor.attributes.bind(pageHidden.falsy, 'id', id)
		})
	}
})

export default Paginator
