import type { ErrorResponse, Paths } from "api.fluff4.me"
import Env from "utility/Env"
import type { Empty } from "utility/Type"

declare module "api.fluff4.me" {
	interface Response<T> {
		headers: Headers
	}

	interface ErrorResponse extends Error {
		headers: Headers
	}
}

type ExtractData<PATH extends string[]> = PATH extends infer PATH2 ? { [INDEX in keyof PATH2 as PATH2[INDEX] extends `{${infer VAR_NAME}}` ? VAR_NAME : never]: string } : never
type SplitPath<PATH extends string> = PATH extends `${infer X}/${infer Y}` ? [X, ...SplitPath<Y>] : [PATH]

type EndpointQuery<ROUTE extends keyof Paths, BODY, RESPONSE> =
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

interface EndpointQueryData {
	body?: any
	params?: any
}

interface Endpoint<ROUTE extends keyof Paths> {
	header (header: string, value: string): this
	headers (headers: Record<string, string>): this
	acceptJSON (): this
	query: EndpointQuery<ROUTE, Paths[ROUTE]["body"], Paths[ROUTE]["response"]>
}

function Endpoint<ROUTE extends keyof Paths> (route: ROUTE, method: Paths[ROUTE]["method"]) {
	let headers: Record<string, string> | undefined
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
		acceptJSON: () => endpoint.header("Accept", "application/json"),
		query: (async (query?: EndpointQueryData) => {
			const body = !query?.body ? undefined : JSON.stringify(query.body)
			const url = route.slice(1)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				.replaceAll(/\{([^}]+)\}/g, (match, paramName) => query?.params?.[paramName])
			const response = await fetch(`${Env.API_ORIGIN}${url}`, {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				method,
				headers: {
					"Content-Type": body ? "application/json" : undefined,
					...headers,
				} as HeadersInit,
				credentials: "include",
				body,
			})

			let error: ErrorResponse | undefined

			const code = response.status
			if (code !== 200) {
				error = Object.assign(new Error(response.statusText), { code }) as ErrorResponse
				delete error.stack
			}

			const responseHeaders = { headers: response.headers }
			if (!response.body)
				return Object.assign(error ?? {}, responseHeaders)

			const responseType = response.headers.get("Content-Type")
			if (responseType === "application/json") {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const json = await response.json()
				if (error)
					return Object.assign(error, json, responseHeaders)

				return Object.assign(json, responseHeaders)
			}

			throw new Error(`Response type ${responseType} is not supported`)
		}) as Endpoint<ROUTE>["query"],
	}

	return endpoint
}


export default Endpoint
