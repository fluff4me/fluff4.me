import type { ErrorResponse } from "api.fluff4.me"
import type Endpoint from "endpoint/Endpoint"
import type { EndpointResponse, PaginatedEndpoint, PaginatedEndpointRoutes as PaginatedEndpointRoute, PreparedQueryOf, ResponseData } from "endpoint/Endpoint"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Button from "ui/component/core/Button"
import Slot from "ui/component/core/Slot"

interface PaginatorExtensions {
	useEndpoint<ROUTE extends PaginatedEndpointRoute> (endpoint: PreparedQueryOf<Endpoint<ROUTE>>, contentInitialiser: (slot: Slot, response: ResponseData<EndpointResponse<Endpoint<ROUTE>>>) => any): this
}

interface Paginator extends Block, PaginatorExtensions { }

type NextFunction = () => Promise<EndpointResponse<PaginatedEndpoint> | ErrorResponse<EndpointResponse<PaginatedEndpoint>>>
type PageInitialiser = (slot: Slot, response: ResponseData<EndpointResponse<PaginatedEndpoint>>) => any

interface PaginatorEndpointState {
	next: NextFunction
	initialiser: PageInitialiser
}

const Paginator = Component.Builder((component): Paginator => {
	const block = component.and(Block)

	block.header
		.style("paginator-header")

	const content = block.content
		.style("paginator-content")

	block.footer
		.style("paginator-footer")

	let state: PaginatorEndpointState | undefined
	return block
		.style("paginator")
		.extend<PaginatorExtensions>(component => ({
			useEndpoint (endpoint, initialiser) {
				state = { next: endpoint.query as NextFunction, initialiser: initialiser as PageInitialiser }
				void loadNext()
				return component
			},
		}))

	async function loadNext (page?: Slot) {
		page?.removeContents()

		if (!state)
			return

		const usedState = state
		const response = await state.next()
		if (state !== usedState)
			return

		page ??= Slot()
			.style("paginator-page")
			.appendTo(content)

		if (response instanceof Error) {
			console.error(response)

			Component()
				.style("paginator-error")
				.append(Component()
					.style("paginator-error-text")
					.text.use("component/paginator/error"))
				.append(Button()
					.type("primary")
					.text.use("component/paginator/error/retry")
					.event.subscribe("click", () => loadNext(page)))
				.appendTo(page)

			return
		}

		usedState.initialiser(page, response.data)

		if (response.next)
			state.next = response.next as NextFunction
		else
			state = undefined
	}
})

export default Paginator
