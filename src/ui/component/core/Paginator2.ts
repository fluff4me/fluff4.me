import type PagedData from 'model/PagedData'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Slot from 'ui/component/core/Slot'
import Async from 'utility/Async'
import State from 'utility/State'

interface PaginatorExtensions<DATA = any> {
	readonly page: State<number>
	readonly data: State<DATA>
	set<NEW_DATA extends DATA> (data: PagedData<NEW_DATA>, initialiser: (slot: Slot, data: NEW_DATA, paginator: this) => unknown): Paginator2<NEW_DATA>
}

interface Paginator2<DATA = any> extends Block, PaginatorExtensions<DATA> { }

const Paginator2 = Component.Builder(<T> (component: Component): Paginator2<T> => {
	const block = component.and(Block)

	const isFlush = block.type.state.mapManual(type => type.has('flush'))

	block.style.bind(isFlush, 'paginator--flush')

	block.header
		.style('paginator-header')
		.style.bind(isFlush, 'paginator-header--flush')

	const content = block.content
		.style('paginator-content')

	block.footer
		.style('paginator-footer')
		.style.bind(isFlush, 'paginator-footer--flush')

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
	const isLastPage = State.Map(component, [cursor, pageCount], (cursor, pageCount) => cursor >= (pageCount ?? Infinity))

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

	let initialiser: ((slot: Slot, data: T, paginator: Paginator2<T>) => unknown) | undefined

	const paginator = block
		.viewTransition('paginator')
		.style('paginator')
		.extend<PaginatorExtensions>(component => ({
			page: cursor,
			data: currentData,
			set (data, initialiserIn) {
				initialiser = initialiserIn as never
				allData.value = data
				return this as never
			},
		}))

	paginator.footer.style.bind(isMultiPage.not, 'paginator-footer--hidden')

	Slot()
		.use(allData, (slot, data) => {
			const wrapper = Slot().appendTo(slot)

			const pages: (Page | undefined)[] = []
			cursor.use(slot, async (pageNumber, previousPageNumber) => {
				const isInitialPage = !pages.length

				const direction = Math.sign(pageNumber - (previousPageNumber ?? pageNumber))
				const previousPage = previousPageNumber === undefined ? undefined : pages[previousPageNumber]
				previousPage
					?.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
					.style('paginator-page--hidden')
					.style.setVariable('page-direction', direction)

				const newPage = pages[pageNumber] ??= (await Page(pageNumber))?.appendTo(wrapper)
				newPage
					?.style.toggle(isInitialPage, 'paginator-page--initial-load')
					.style.setVariable('page-direction', direction)

				if (!data || !newPage)
					return

				const hasContent = newPage.content.value === false || hasResults(newPage.content.value)
				if (hasContent) {
					newPage.style.remove('paginator-page--hidden')
					scrollIntoView(direction)
					return
				}

				if (previousPageNumber !== undefined) {
					// empty, play bounce animation
					pages[previousPageNumber]?.style('paginator-page--bounce')
					await Async.sleep(200)
					cursor.value = previousPageNumber
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
						initialiser?.(page, content as T, paginator)
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
				if (!direction)
					return

				const scrollTarget = direction > 0 ? block.element : pages[cursor.value]?.element.lastElementChild
				scrollTarget?.scrollIntoView()
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

export default Paginator2
