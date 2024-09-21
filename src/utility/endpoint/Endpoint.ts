import type { ErrorResponse, Paths } from "api.fluff4.me"
import Env from "utility/Env"

declare module "api.fluff4.me" {
	interface ErrorResponse extends Error {
	}
}

type EndpointQuery<BODY, RESPONSE> =
	(
		[keyof BODY] extends [never] ? {} : { body: BODY }
	) extends infer QUERY ?

	[keyof QUERY] extends [never]
	? { (): Promise<RESPONSE & { headers: Headers }> }
	: { (query: QUERY): Promise<RESPONSE & { headers: Headers }> }

	: never

interface EndpointQueryData {
	body?: any
}

interface Endpoint<ROUTE extends keyof Paths> {
	header (header: string, value: string): this
	headers (headers: Record<string, string>): this
	query: EndpointQuery<Paths[ROUTE]["body"], Paths[ROUTE]["response"]>
}

function Endpoint<ROUTE extends keyof Paths> (route: ROUTE, method: Paths[ROUTE]["method"]) {
	let headers: Record<string, string> | undefined
	const endpoint = {
		header (header, value) {
			headers ??= {}
			headers[header] = value
			return endpoint
		},
		headers (h) {
			headers = { ...headers, ...h }
			return endpoint
		},
		async query (query?: EndpointQueryData) {
			const body = !query?.body ? undefined : JSON.stringify(query.body)
			const response = await fetch(`${Env.API_ORIGIN}${route.slice(1)}`, {
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
		},
	} as Endpoint<ROUTE>

	return endpoint
}


export default Endpoint
