import type Endpoint from "endpoint/Endpoint"
import type { EndpointResponse, PaginatedEndpoint, PaginatedEndpointRoutes as PaginatedEndpointRoute, PreparedQueryOf, ResponseData } from "endpoint/Endpoint"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Button from "ui/component/core/Button"
import Slot from "ui/component/core/Slot"

interface PaginatorExtensions {
	useEndpoint<ROUTE extends PaginatedEndpointRoute> (endpoint: PreparedQueryOf<Endpoint<ROUTE>>, contentInitialiser: (slot: Slot, response: ResponseData<EndpointResponse<Endpoint<ROUTE>>>) => any): Promise<void>
}

interface Paginator extends Block, PaginatorExtensions { }

type PageInitialiser = (slot: Slot, response: ResponseData<EndpointResponse<PaginatedEndpoint>>) => any

interface PaginatorUsing {
	mainPage: EndpointResponse<PaginatedEndpoint>
	pageCount: number
	initialiser: PageInitialiser
}

const Paginator = Component.Builder((component): Paginator => {
	const block = component.and(Block)

	block.header
		.style("paginator-header")

	const content = block.content
		.style("paginator-content")

	block.footer
		.style("paginator-footer", "paginator-footer--hidden")

	block.footer.left.style("paginator-footer-left")
	block.footer.right.style("paginator-footer-right")

	const buttonFirst = Button()
		.style("paginator-button", "paginator-button-first")
		.event.subscribe("click", () => showPage(0))
		.appendTo(block.footer.left)

	const buttonPrev = Button()
		.style("paginator-button", "paginator-button-prev")
		.event.subscribe("click", () => showPage(Math.max(cursor - 1, 0)))
		.appendTo(block.footer.left)

	const buttonNext = Button()
		.style("paginator-button", "paginator-button-next")
		.event.subscribe("click", () => showPage(Math.min(cursor + 1, pages.length - 1)))
		.appendTo(block.footer.right)

	const buttonLast = Button()
		.style("paginator-button", "paginator-button-last")
		.event.subscribe("click", () => showPage(pages.length - 1))
		.appendTo(block.footer.right)

	let pageContent: EndpointResponse<PaginatedEndpoint>[] = []
	let pages: Slot[] = []
	let cursor = 0

	let using: PaginatorUsing | undefined
	return block
		.style("paginator")
		.extend<PaginatorExtensions>(component => ({
			async useEndpoint (endpoint, initialiser) {
				content.removeContents()
				block.footer.style("paginator-footer--hidden")

				cursor = 0
				pageContent = []
				pages = []

				const mainPage = Page()
					.style("paginator-page--initial-load")
					.style.remove("paginator-page--hidden")
				pages.push(mainPage)

				let response: EndpointResponse<PaginatedEndpoint>
				while (true) {
					const result = await endpoint.query()
					if (result instanceof Error) {
						mainPage.removeContents()
						await new Promise<void>(resolve => mainPage.append(RetryDialog(resolve)))
						continue
					}

					response = result as EndpointResponse<PaginatedEndpoint>
					break
				}

				using = { mainPage: response, initialiser: initialiser as PageInitialiser, pageCount: response.page_count }

				pageContent[0] = response
				using.initialiser(pages[0], response.data)

				if (response.page_count > 1)
					block.footer.style.remove("paginator-footer--hidden")

				while (pages.length < response.page_count)
					pages.push(Page())

				buttonFirst.style("paginator-button--disabled")
				buttonPrev.style("paginator-button--disabled")
				buttonNext.style.toggle(response.page_count <= 1, "paginator-button--disabled")
				buttonLast.style.toggle(response.page_count <= 1, "paginator-button--disabled")
			},
		}))

	function Page () {
		return Slot()
			.style("paginator-page", "paginator-page--hidden")
			.appendTo(content)
	}

	function RetryDialog (retry: () => any) {
		return Component()
			.style("paginator-error")
			.append(Component()
				.style("paginator-error-text")
				.text.use("component/paginator/error"))
			.append(Button()
				.type("primary")
				.text.use("component/paginator/error/retry")
				.event.subscribe("click", () => retry()))
	}

	async function showPage (number: number) {
		if (cursor === number || !using)
			return

		const oldNumber = cursor
		cursor = number

		if (cursor !== number)
			return

		pages[0].style.remove("paginator-page--initial-load")

		const direction = Math.sign(number - oldNumber)

		pages[oldNumber]
			.style("paginator-page--hidden")
			.style.setVariable("page-direction", direction)

		const page = pages[cursor]
			.style.setVariable("page-direction", direction)

		buttonFirst.style.toggle(cursor <= 0, "paginator-button--disabled")
		buttonPrev.style.toggle(cursor <= 0, "paginator-button--disabled")
		buttonNext.style.toggle(cursor >= using.pageCount - 1, "paginator-button--disabled")
		buttonLast.style.toggle(cursor >= using.pageCount - 1, "paginator-button--disabled")

		if (pageContent[cursor]) {
			page.style.remove("paginator-page--hidden")
			scrollIntoView(direction)
			return
		}

		let response: EndpointResponse<PaginatedEndpoint>
		while (true) {
			page.removeContents()
			const result = await using?.mainPage.getPage(cursor)
			if (cursor !== number)
				return

			page.style.remove("paginator-page--hidden")

			if (result instanceof Error) {
				await new Promise<void>(resolve => {
					RetryDialog(resolve).appendTo(page)
					block.header.element.scrollIntoView()
				})
				if (cursor !== number)
					return

				continue
			}

			response = result as EndpointResponse<PaginatedEndpoint>
			break
		}

		pageContent[cursor] = response
		using?.initialiser(page, response.data)
		scrollIntoView(direction)
	}

	function scrollIntoView (direction: number) {
		const scrollTarget = direction > 0 ? block.element : pages[cursor].element.lastElementChild
		scrollTarget?.scrollIntoView()
	}
})

export default Paginator
