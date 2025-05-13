import type { EndpointResponse, PaginatedEndpoint, PreparedQueryOf, ResponseData } from 'endpoint/Endpoint'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Loading from 'ui/component/core/Loading'
import Slot from 'ui/component/core/Slot'
import State from 'utility/State'
import type { PromiseOr } from 'utility/Type'

interface InfiniteScrollExtensions {
	// relevant methods and properties for infinite scroll can be defined here
	readonly ended: State<boolean>
	set (contentGenerator: (slot: Slot, signal: AbortSignal) => PromiseOr<boolean>): this
	setFromEndpoint<const QUERY extends PreparedQueryOf<PaginatedEndpoint>> (endpoint: QUERY, contentGenerator: (data: ResponseData<EndpointResponse<QUERY>>, slot: Slot, signal: AbortSignal) => PromiseOr<boolean | undefined | void>): this
	reset (): this
}

interface InfiniteScroll extends Component, InfiniteScrollExtensions { }

const InfiniteScroll = Component.Builder((component): InfiniteScroll => {
	const infiniteScroll = component.style('infinite-scroll')

	const ended = State(false)
	const generating = State(false)
	let contentGenerator: ((slot: Slot, signal: AbortSignal) => PromiseOr<boolean>) | undefined
	let contentController: AbortController | undefined
	let page = 0

	return infiniteScroll.extend<InfiniteScrollExtensions>(infiniteScroll => ({
		// implementation of infinite scroll methods and properties should go here
		ended,
		set (contentGeneratorIn) {
			contentGenerator = contentGeneratorIn
			infiniteScroll.reset()
			return infiniteScroll
		},
		setFromEndpoint (endpoint, contentGenerator) {
			infiniteScroll.set(async (slot, signal) => {
				const response = await endpoint.query(undefined, { page }, signal)
				if (signal.aborted)
					return false // no more

				if (response instanceof Error)
					throw response // handled by main infinite scroll content loop

				const hasMore = contentGenerator(response.data as never, slot, signal)

				if (typeof hasMore === 'object')
					return hasMore.then(hasMore => {
						page++
						return hasMore ?? response.has_more
					})

				page++
				return hasMore ?? response.has_more
			})
			return infiniteScroll
		},
		reset () {
			infiniteScroll.removeContents()
			contentController?.abort(); contentController = undefined
			ended.value = false
			page = 0
			void generate()
			return infiniteScroll
		},
	}))

	async function generate () {
		if (!contentGenerator || generating.value || ended.value)
			return

		generating.value = true
		const slot = Slot().appendTo(infiniteScroll)

		let signal: AbortSignal | undefined
		let hasMore: boolean | Promise<boolean> = true
		while (true) {
			slot.removeContents()

			contentController = new AbortController()
			signal = contentController.signal
			hasMore = contentGenerator(slot, signal)
			if (typeof hasMore === 'boolean')
				break

			// hasMore is a promise
			const loader = Loading().style('infinite-scroll-loading').appendTo(slot)
			try {
				hasMore = await hasMore

				if (signal.aborted)
					return

				loader.remove()
				break
			}
			catch (e) {
				toast.handleError(e)
				loader.remove()

				const retry = Button()
					.text.use('shared/action/retry')
					.appendTo(slot)

				await new Promise<void>(resolve => retry.event.subscribe('click', () => resolve()))

				if (contentController.signal.aborted)
					return

				continue
			}
		}

		ended.value = !hasMore
		generating.value = false

		if (ended.value)
			return

		const sentinel = Component().style.setProperties({ height: '1px', width: '100%', marginTop: '-1px' }).appendTo(slot)
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting)
					return

				observer.disconnect()
				sentinel.remove()

				if (signal.aborted)
					return

				void generate()
			},
			{
				root: null,
				rootMargin: '200px 0px',
				threshold: 0.01,
			}
		)
		observer.observe(sentinel.element)
		sentinel.onRemoveManual(() => observer.disconnect())
	}
})

export default InfiniteScroll
