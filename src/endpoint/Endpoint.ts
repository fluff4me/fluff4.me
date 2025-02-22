import type { ErrorResponse, PaginatedResponse, Paths, Response } from 'api.fluff4.me'
import Env from 'utility/Env'
import Objects from 'utility/Objects'
import Time from 'utility/Time'
import type { Empty } from 'utility/Type'

declare module 'api.fluff4.me' {
	interface Response<T> {
		headers: Headers
	}

	interface PaginatedResponse<T> {
		next?(): Promise<PaginatedResponse<T> | ErrorResponse<PaginatedResponse<T>>>
		getPage (page: number): Promise<PaginatedResponse<T> | ErrorResponse<PaginatedResponse<T>>>
	}

	interface ErrorResponse<T> extends Error {
		headers: Headers
		retry?(): Promise<T | ErrorResponse<T>>
	}
}

type ExtractData<PATH extends string[]> = PATH extends infer PATH2 ? { [INDEX in keyof PATH2 as PATH2[INDEX] extends `{${infer VAR_NAME}}` ? VAR_NAME : never]: string } : never
type SplitPath<PATH extends string> = PATH extends `${infer X}/${infer Y}` ? [X, ...SplitPath<Y>] : [PATH]

type EndpointQuery<ROUTE extends keyof Paths> =
	Paths[ROUTE]['body'] extends infer BODY ?
	Paths[ROUTE]['search'] extends infer SEARCH ?

	Exclude<Paths[ROUTE]['response'], ErrorResponse<any>> extends infer RESPONSE ?
	(RESPONSE | ErrorResponse<RESPONSE>) extends infer RESPONSE ?

	(
		& ([keyof BODY] extends [never] ? object : { body: BODY })
		& (
			ExtractData<SplitPath<ROUTE>> extends infer PARAMS ?
			PARAMS extends Empty ? object
			: { params: PARAMS }
			: never
		)
	) extends infer DATA ?

	[keyof SEARCH] extends [never]
	? (
		[keyof DATA] extends [never]
		? { (data?: undefined): Promise<RESPONSE> }
		: { (data: DATA): Promise<RESPONSE> }
	)
	: (
		[keyof { [K in keyof SEARCH as object extends Pick<SEARCH, K> ? never : K]: SEARCH[K] }] extends [never]
		? (
			[keyof DATA] extends [never]
			? { (data?: undefined, query?: SEARCH): Promise<RESPONSE> }
			: { (data: DATA, query?: SEARCH): Promise<RESPONSE> }
		)
		: (
			[keyof DATA] extends [never]
			? { (data: undefined, query: SEARCH): Promise<RESPONSE> }
			: { (data: DATA, query: SEARCH): Promise<RESPONSE> }
		)
	)

	: never
	: never
	: never
	: never
	: never

interface Endpoint<ROUTE extends keyof Paths, QUERY extends EndpointQuery<ROUTE> = EndpointQuery<ROUTE>> {
	readonly route: ROUTE
	header (header: string, value: string): this
	headers (headers: Record<string, string>): this
	removeHeader (header: string): this
	noResponse (): this
	query: QUERY
	prep: (...parameters: Parameters<QUERY>) => ConfigurablePreparedEndpointQuery<ROUTE, QUERY>
	getPageSize?(): number | undefined
}

interface ConfigurablePreparedEndpointQuery<ROUTE extends keyof Paths, QUERY extends EndpointQuery<ROUTE>> extends PreparedEndpointQuery<ROUTE, QUERY> {
	getPageSize (): number | undefined
	setPageSize (size?: number): this
}

interface PreparedEndpointQuery<ROUTE extends keyof Paths, QUERY extends EndpointQuery<ROUTE>> extends Omit<Endpoint<ROUTE, QUERY>, 'query'> {
	query (
		data?: (
			Parameters<QUERY>[0] extends infer P ? P extends { body?: infer BODY, params?: infer PARAMS } ? {
				body?: Partial<BODY>
				params?: Partial<PARAMS>
			} : never : never
		),
		query?: Parameters<QUERY>[1] extends infer Q ? Partial<Q> : never,
	): ReturnType<QUERY>
}

function Endpoint<ROUTE extends keyof Paths> (route: ROUTE, method: Paths[ROUTE]['method'], headers?: Record<string, string>) {
	let pageSize: number | undefined
	const endpoint: ConfigurablePreparedEndpointQuery<ROUTE, any> = {
		route,
		header (header, value) {
			headers ??= {}
			headers[header] = value
			return endpoint
		},
		headers (h) {
			headers = { ...headers, ...h }
			return endpoint
		},
		removeHeader (header) {
			delete headers?.[header]
			return endpoint
		},
		getPageSize: () => pageSize,
		setPageSize: (size?: number) => {
			pageSize = size
			return endpoint
		},
		noResponse: () => endpoint.removeHeader('Accept'),
		query: query as Endpoint<ROUTE>['query'],
		prep: (...parameters) => {
			const endpoint = Endpoint(route, method, headers) as any as ConfigurablePreparedEndpointQuery<ROUTE, any>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.assign(endpoint, {
				query: (...p2: any[]) => {
					const newParameters: any[] = []
					const length = Math.max(parameters.length, p2.length)
					for (let i = 0; i < length; i++)
						newParameters.push(Objects.merge(parameters[i], p2[i]))

					const ownPageSize = pageSize
					pageSize = endpoint.getPageSize()

					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					const result = query(...newParameters)

					pageSize = ownPageSize
					return result
				},
			}) as any
		},
	}

	return endpoint as any as Endpoint<ROUTE>

	interface EndpointQueryData {
		body?: any
		params?: any
	}

	interface EndpointQuerySearchParams {
		page_size?: number
		page?: number
	}

	async function query (data?: EndpointQueryData, search?: EndpointQuerySearchParams) {
		const body = !data?.body ? undefined : JSON.stringify(data.body)
		const url = route.slice(1)
			.replaceAll(/\{([^}]+)\}/g, (match, paramName) =>
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				encodeURIComponent(String(data?.params?.[paramName] ?? '')))

		const params = Object.entries(search ?? {})
			.map(([param, value]) => [param, typeof value === 'string' ? value : JSON.stringify(value)])
			.collect(searchEntries => new URLSearchParams(searchEntries))
		if (pageSize)
			params.set('page_size', `${pageSize}`)

		const qs = params.size ? '?' + params.toString() : ''

		let error: ErrorResponse<any> | undefined
		const response = await fetch(`${Env.API_ORIGIN}${url}${qs}`, {

			method,
			headers: {
				...!Env.API_ORIGIN.includes('ngrok') ? undefined : { 'ngrok-skip-browser-warning': 'true' },
				'Content-Type': body ? 'application/json' : undefined,
				'Accept': 'application/json',
				...headers,
			} as HeadersInit,
			credentials: 'include',
			body,
			signal: AbortSignal.timeout(Time.seconds(5)),
		}).catch((e: Error): undefined => {
			if (e.name === 'AbortError') {
				error = Object.assign(new Error('Request timed out'), {
					code: 408,
					data: null,
					headers: new Headers(),
				})
				return
			}

			if (e.name === 'TypeError' && /invalid URL|Failed to construct/.test(e.message))
				throw e

			if (e.name === 'TypeError' || e.name === 'NetworkError') {
				error = Object.assign(new Error('Network connection failed'), {
					code: 503,
					data: null,
					headers: new Headers(),
				})
				return
			}

			if (!error)
				throw e
		})

		if (error || !response) // will always mean the same thing, but ts doesn't know that
			return error

		const code = response.status
		if (code !== 200) {
			error = Object.assign(new Error(response.statusText), { code, retry: () => query(data) }) as ErrorResponse<any>
			delete error.stack
		}

		const responseHeaders = { headers: response.headers }
		if (!response.body)
			return Object.assign(error ?? {}, responseHeaders)

		const responseType = response.headers.get('Content-Type')
		if (responseType === 'application/json') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const json = await response.json().catch(e => {
				const e2 = e instanceof Error ? e : new Error('Failed to parse JSON')
				Object.defineProperty(e2, 'code', { value: code, configurable: true, writable: true })
				Object.defineProperty(e2, 'retry', { value: () => query(data), configurable: true })
				error ??= e2 as ErrorResponse<any>
				delete error.stack
			})
			if (error)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Object.assign(error, json, responseHeaders)

			const paginated = json as PaginatedResponse<any>
			if (paginated.has_more) {
				Object.assign(json, {
					next: () => query(
						data,
						{
							...search,
							...[...params].toObject(),
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							page: +(params.get('page') ?? search?.page ?? json.page ?? 0) + 1,
						},
					),
					getPage: (page: number) => query(
						data,
						{ ...search, page },
					),
				})
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.assign(json, responseHeaders)
		}

		throw new Error(`Response type ${responseType} is not supported`)
	}
}

export default Endpoint

export type EndpointResponse<ENDPOINT extends Endpoint<any, any> | PreparedQueryOf<Endpoint<any, any>>> = Exclude<Awaited<ReturnType<ENDPOINT['query']>>, ErrorResponse<any> | void>
export type ResponseData<RESPONSE> = RESPONSE extends Response<infer DATA> ? DATA : never
export type EndpointReturn<PATH extends keyof Paths> = () => ReturnType<Endpoint<PATH>['query']>

export type PaginatedEndpointRoutes = keyof {
	[PATH in keyof Paths as (
		EndpointResponse<Endpoint<PATH>> extends infer RESPONSE ?
		RESPONSE extends PaginatedResponse<any> ?
		PATH
		: never
		: never
	)]: Endpoint<PATH>
}

export type PaginatedEndpoint = { [ROUTE in PaginatedEndpointRoutes]: Endpoint<ROUTE> } extends infer ENDPOINTS ? ENDPOINTS[keyof ENDPOINTS] : never

export type PreparedQueryOf<ENDPOINT extends Endpoint<any, any>> = ENDPOINT extends Endpoint<infer ROUTE, infer QUERY> ? PreparedEndpointQuery<ROUTE, QUERY> : never

export type PreparedPaginatedQueryReturning<R> = {
	[PATH in keyof Paths as (
		EndpointResponse<Endpoint<PATH>> extends infer RESPONSE ?
		RESPONSE extends PaginatedResponse<R> ?
		PATH
		: never
		: never
	)]: PreparedQueryOf<Endpoint<PATH>>
} extends infer O ? O[keyof O] : never
