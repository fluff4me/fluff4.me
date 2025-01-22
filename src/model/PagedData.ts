import type { PaginatedEndpoint, PreparedPaginatedQueryReturning, PreparedQueryOf } from 'endpoint/Endpoint'
import type { StateOr } from 'utility/State'
import State from 'utility/State'
import type { PromiseOr } from 'utility/Type'

interface PagedData<T> {
	readonly pageCount: State<number | undefined>
	get pages (): readonly State<T | false | null>[]
	/** @deprecated */
	get rawPages (): State.Mutable<PromiseOr<State.Mutable<T | false | null>>[]>
	get (page: number): PromiseOr<State<T | false | null>>
	set (page: number, data: T, isLastPage?: true): void
	setPageCount (count: number): void
	clear (): void
}

export interface PagedDataDefinition<T> {
	get (page: number): PromiseOr<StateOr<T | false | null>>
}

const PagedData = Object.assign(
	function <T> (definition: PagedDataDefinition<T>): PagedData<T> {
		const pageCount = State<number | undefined>(undefined)
		const pages: State.Mutable<PromiseOr<State.Mutable<T | false | null>>[]> = State([], false)// .setId('PagedData pages')
		return {
			pageCount,
			get pages () {
				return pages.value.filter((page): page is Exclude<typeof page, Promise<any>> => !(page instanceof Promise))
			},
			rawPages: pages,
			get (page): PromiseOr<State<T | false | null>> {
				if (pages.value[page] instanceof Promise)
					return pages.value[page]

				const existing = pages.value[page]?.value
				if (existing === undefined || existing === false) {
					pages.value[page] = Promise.resolve(definition.get(page))
						.then(data => {
							if (!State.is(pages.value[page])) { // if it's already a State, it's been updated before this, don't overwrite
								let newState: State.Mutable<T | false | null>
								if (State.is(data)) {
									newState = State(null, false)// .setId(`PagedData page ${page} get 1`)
									newState.bindManual(data)
								}
								else
									newState = State(data, false)// .setId(`PagedData page ${page} get 2`)

								pages.value[page] = newState
								pages.emit()
							}

							return pages.value[page]
						})
					pages.emit()
				}

				return pages.value[page]
			},
			set (page, data, isLastPage) {
				if (State.is(pages.value[page]))
					pages.value[page].value = data
				else
					pages.value[page] = State(data, false)// .setId(`PagedData page ${page} set`)

				if (isLastPage)
					pages.value.length = pageCount.value = page + 1
				else if (pageCount.value !== undefined && page >= pageCount.value)
					pageCount.value = undefined

				pages.emit()
			},
			setPageCount (count) {
				pageCount.value = count
			},
			clear () {
				pages.value = []
				pageCount.value = undefined
			},
		}
	},
	{
		fromEndpoint<T> (endpoint: PreparedPaginatedQueryReturning<T>): PagedData<T> {
			const e = endpoint as PreparedQueryOf<PaginatedEndpoint>
			return PagedData({
				async get (page) {
					const response = await e.query(undefined, { page })
					if (toast.handleError(response))
						return false

					if (!Array.isArray(response.data) || response.data.length)
						return response.data as T

					return null
				},
			})
		},
	}
)

export default PagedData
