import type { EndpointResponse, PaginatedEndpoint, PreparedQueryOf } from "endpoint/Endpoint"
import Component from "ui/Component"
import type Slot from "ui/component/core/Slot"

interface PaginatorExtensions {
	useEndpoint<ENDPOINT extends PaginatedEndpoint> (endpoint: PreparedQueryOf<ENDPOINT>, contentInitialiser: (slot: Slot, data: EndpointResponse<ENDPOINT>) => any): this
}

interface Paginator extends Component, PaginatorExtensions { }

const Paginator = Component.Builder((component): Paginator => {

	const header = Component()
		.style("paginator-header")

	const content = Component()
		.style("paginator-content")

	const footer = Component()
		.style("paginator-footer")

	return component
		.style("paginator")
		.append(header, content, footer)
		.extend<PaginatorExtensions>(component => ({
			useEndpoint (endpoint, initialiser) {

				return component
			},
		}))
})

export default Paginator
