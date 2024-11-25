import type { ErrorResponse, PaginatedResponse, Paths, Response } from "api.fluff4.me"
import Env from "utility/Env"
import Objects from "utility/Objects"
import Time from "utility/Time"
import type { Empty } from "utility/Type"

declare module "api.fluff4.me" {
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
	Paths[ROUTE]["body"] extends infer BODY ?

	Exclude<Paths[ROUTE]["response"], ErrorResponse<any>> extends infer RESPONSE ?
	(RESPONSE | ErrorResponse<RESPONSE>) extends infer RESPONSE ?

	(
		& ([keyof BODY] extends [never] ? {} : { body: BODY })
		& (
			ExtractData<SplitPath<ROUTE>> extends infer PARAMS ?
			PARAMS extends Empty ? {}
			: { params: PARAMS }
			: never
		)
	) extends infer QUERY ?

	[keyof QUERY] extends [never]
	? { (): Promise<RESPONSE> }
	: { (query: QUERY): Promise<RESPONSE> }

	: never
	: never
	: never
	: never

interface EndpointQueryData {
	body?: any
	params?: any
	query?: any
}

interface Endpoint<ROUTE extends keyof Paths, QUERY extends EndpointQuery<ROUTE> = EndpointQuery<ROUTE>> {
	header (header: string, value: string): this
	headers (headers: Record<string, string>): this
	removeHeader (header: string): this
	noResponse (): this
	query: QUERY
	prep: (...parameters: Parameters<QUERY>) => PreparedEndpointQuery<ROUTE, QUERY>
}

interface PreparedEndpointQuery<ROUTE extends keyof Paths, QUERY extends EndpointQuery<ROUTE>> extends Omit<Endpoint<ROUTE, QUERY>, "query"> {
	query (...overrides: any[]): ReturnType<QUERY>
}

export type PreparedQueryOf<ENDPOINT extends Endpoint<any, any>> = ENDPOINT extends Endpoint<infer ROUTE, infer QUERY> ? PreparedEndpointQuery<ROUTE, QUERY> : never

function Endpoint<ROUTE extends keyof Paths> (route: ROUTE, method: Paths[ROUTE]["method"], headers?: Record<string, string>) {
	const endpoint: Endpoint<ROUTE> = {
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
		noResponse: () => endpoint.removeHeader("Accept"),
		query: query as Endpoint<ROUTE>["query"],
		prep: (...parameters) => {
			return Object.assign(Endpoint(route, method, headers), {
				query: (...p2: any[]) => {
					const newParameters: any[] = []
					const length = Math.max(parameters.length, p2.length)
					for (let i = 0; i < length; i++)
						newParameters.push(Objects.merge(parameters[i], p2[i]))
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					return query(...newParameters)
				},
			}) as any
		},
	}

	return endpoint

	async function query (data?: EndpointQueryData) {
		const body = !data?.body ? undefined : JSON.stringify(data.body)
		const url = route.slice(1)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			.replaceAll(/\{([^}]+)\}/g, (match, paramName) => data?.params?.[paramName])
		const qs = data?.query ? "?" + new URLSearchParams(data.query as Record<string, string>).toString() : ""

		let error: ErrorResponse<any> | undefined
		const response = await fetch(`${Env.API_ORIGIN}${url}${qs}`, {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			method,
			headers: {
				"Content-Type": body ? "application/json" : undefined,
				"Accept": "application/json",
				...headers,
			} as HeadersInit,
			credentials: "include",
			body,
			signal: AbortSignal.timeout(Time.seconds(5)),
		}).catch((e: Error): undefined => {
			if (e.name === "AbortError") {
				error = Object.assign(new Error("Request timed out"), {
					code: 408,
					data: null,
					headers: new Headers(),
				})
				return
			}

			if (e.name === "TypeError" && /invalid URL|Failed to construct/.test(e.message))
				throw e

			if (e.name === "TypeError" || e.name === "NetworkError") {
				error = Object.assign(new Error("Network connection failed"), {
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

		const responseType = response.headers.get("Content-Type")
		if (responseType === "application/json") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const json = await response.json().catch(e => {
				error ??= Object.assign(e instanceof Error ? e : new Error("Failed to parse JSON"), { code, retry: () => query(data) }) as ErrorResponse<any>
				delete error.stack
			})
			if (error)
				return Object.assign(error, json, responseHeaders)

			const paginated = json as PaginatedResponse<any>
			if (paginated.has_more) {
				Object.assign(json, {
					next: () => query({
						...data,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
						query: { ...data?.query, page: (data?.query?.page ?? 0) + 1 },
					}),
					getPage: (page: number) => query({
						...data,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						query: { ...data?.query, page },
					}),
				})
			}

			return Object.assign(json, responseHeaders)
		}

		throw new Error(`Response type ${responseType} is not supported`)
	}
}

export default Endpoint

export type EndpointResponse<ENDPOINT extends Endpoint<any, any>> = Exclude<Awaited<ReturnType<ENDPOINT["query"]>>, ErrorResponse<any> | void>
export type ResponseData<RESPONSE> = RESPONSE extends Response<infer DATA> ? DATA : never

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
