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
	? { (): Promise<RESPONSE> }
	: { (query: QUERY): Promise<RESPONSE> }

	: never

interface EndpointQueryData {
	body?: any
}

interface Endpoint<ROUTE extends keyof Paths> {
	query: EndpointQuery<Paths[ROUTE]["body"], Paths[ROUTE]["response"]>
}

function Endpoint<ROUTE extends keyof Paths> (route: ROUTE, method: Paths[ROUTE]["method"]) {
	return {
		async query (query?: EndpointQueryData) {
			const body = !query?.body ? undefined : JSON.stringify(query.body)
			const response = await fetch(`${Env.API_ORIGIN}${route.slice(1)}`, {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				method,
				headers: {
					"Content-Type": body ? "application/json" : undefined,
				} as HeadersInit,
				body,
			})

			let error: ErrorResponse | undefined

			const code = response.status
			if (code !== 200) {
				error = Object.assign(new Error(response.statusText), { code }) as ErrorResponse
				delete error.stack
			}

			if (!response.body)
				return error

			const responseType = response.headers.get("Content-Type")
			if (responseType === "application/json") {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const json = await response.json()
				if (error)
					return Object.assign(error, json)

				return json
			}

			throw new Error(`Response type ${responseType} is not supported`)
		},
	} as Endpoint<ROUTE>
}


export default Endpoint
