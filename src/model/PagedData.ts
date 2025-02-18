import type { EndpointResponse, PaginatedEndpoint, PreparedPaginatedQueryReturning, PreparedQueryOf, ResponseData } from 'endpoint/Endpoint'
import EventManipulator from 'ui/utility/EventManipulator'
import { mutable } from 'utility/Objects'
import type { StateOr } from 'utility/State'
import State from 'utility/State'
import type { PromiseOr } from 'utility/Type'

export interface PagedDataEvents<T> {
	DeletePage (page: number): void
	UnsetPages (startPage: number, endPageInclusive: number): void
}

interface PagedData<T> {
	readonly pageCount: State<number | undefined>
	readonly event: EventManipulator<this, PagedDataEvents<T>>
	get pages (): readonly State<T | false | null>[]
	/** @deprecated */
	get rawPages (): State.Mutable<PromiseOr<State.Mutable<T | false | null>>[]>
	get (page: number): PromiseOr<State<T | false | null>>
	set (page: number, data: T, isLastPage?: boolean): void
	unset (page: number): void
	unset (startPage: number, endPageInclusive: number): void
	delete (page: number): void
	setPageCount (count: number | true): void
	clear (): void
}

export interface PagedDataDefinition<T> {
	get (page: number): PromiseOr<StateOr<T | false | null>>
}

const PagedData = Object.assign(
	function <T> (definition: PagedDataDefinition<T>): PagedData<T> {
		const pageCount = State<number | undefined>(undefined)
		const pages: State.Mutable<PromiseOr<State.Mutable<T | false | null>>[]> = State([], false)// .setId('PagedData pages')
		const result: PagedData<T> = {
			pageCount,
			event: undefined!,
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
			unset (startPage, endPageInclusive: number = startPage) {
				for (let i = startPage; i <= endPageInclusive; i++)
					// eslint-disable-next-line @typescript-eslint/no-array-delete
					delete pages.value[i]

				pages.emit()
				result.event.emit('UnsetPages', startPage, endPageInclusive)
			},
			delete (page) {
				void pages.value.splice(page, 1)
				pages.emit()
				result.event.emit('DeletePage', page)
			},
			setPageCount (count) {
				pageCount.value = count === true ? undefined : count
			},
			clear () {
				pages.value = []
				pageCount.value = undefined
			},
		}

		mutable(result).event = EventManipulator(result)
		return result
	},
	{
		fromEndpoint,
	}
)

export interface EndpointResponseDismantledData<C, A> {
	content: C[]
	auxiliary: A
}
export type EndpointResponseDataDismantler<T, C, A> = (data: T) => EndpointResponseDismantledData<C, A>

function fromEndpoint<ENDPOINT extends PreparedQueryOf<PaginatedEndpoint>> (endpoint: ENDPOINT): PagedData<ResponseData<EndpointResponse<ENDPOINT>> extends infer T ? T extends (infer T)[] ? T : T : never>
function fromEndpoint<ENDPOINT extends PreparedQueryOf<PaginatedEndpoint>, C, A> (endpoint: ENDPOINT, orElse: undefined, dismantler: EndpointResponseDataDismantler<NoInfer<ResponseData<EndpointResponse<ENDPOINT>>>, C, A>): { [KEY in keyof A]: State<A[KEY] extends any[] ? A[KEY] : []> } extends infer AUX ? PagedData<C> & AUX : never
function fromEndpoint<ENDPOINT extends PreparedQueryOf<PaginatedEndpoint>, ELSE> (endpoint: ENDPOINT, orElse: (page: number) => ELSE | null): PagedData<(ResponseData<EndpointResponse<ENDPOINT>> extends infer T ? T extends (infer T)[] ? T : T : never) | ELSE>
function fromEndpoint<ENDPOINT extends PreparedQueryOf<PaginatedEndpoint>, C, A, ELSE> (endpoint: ENDPOINT, orElse: (page: number) => ELSE | null, dismantler: EndpointResponseDataDismantler<NoInfer<ResponseData<EndpointResponse<ENDPOINT>>>, C, A>): { [KEY in keyof A]: State<A[KEY] extends any[] ? A[KEY] : []> } extends infer AUX ? PagedData<C | ELSE> & AUX : never
function fromEndpoint (endpoint: PreparedPaginatedQueryReturning<any> | PreparedPaginatedQueryReturning<any[]>, orElse?: (page: number) => any, dismantler?: EndpointResponseDataDismantler<any, any, Record<string, any>>): any {
	const e = endpoint as PreparedQueryOf<PaginatedEndpoint>

	const aux: Record<string, State<any[]>> = {}
	const result = PagedData({
		async get (page) {
			const response = await e.query(undefined, { page })
			if (response.code === 404)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return orElse ? orElse(page) : null

			if (toast.handleError(response))
				return false

			if (dismantler) {
				const { content, auxiliary } = dismantler(response.data)

				for (const [key, value] of Object.entries(auxiliary)) {
					if (value === content)
						continue

					const state = aux[key] ??= State<any[]>([])
					const mutableContent = content as any[] & Record<string, State<any[]>>
					mutableContent[key] ??= state
					result[key] ??= state
					Object.assign(result, { aux })

					if (Array.isArray(value))
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						state.value.push(...value)
					else
						state.value.push(value)
					state.emit()
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return content
			}

			if (!Array.isArray(response.data) || response.data.length)
				return response.data

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return orElse ? orElse(page) : null
		},
	}) as PagedData<any> & Record<string, State<any[]>>

	return result
}

export default PagedData
