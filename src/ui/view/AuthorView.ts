import EndpointAuthorGet from "endpoint/author/EndpointAuthorGet"
import EndpointWorkGetAllAuthor from "endpoint/work/EndpointWorkGetAllAuthor"
import Session from "model/Session"
import Author from "ui/component/Author"
import Button from "ui/component/core/Button"
import Paginator from "ui/component/core/Paginator"
import Slot from "ui/component/core/Slot"
import Work from "ui/component/Work"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"


interface AuthorViewParams {
	vanity: string
}

export default ViewDefinition({
	create: async (params: AuthorViewParams) => {
		const view = View("author")

		const author = await EndpointAuthorGet.query({ params })
		if (author instanceof Error)
			throw author

		Author(author.data)
			.setContainsHeading()
			.appendTo(view)

		const authorQuery = EndpointWorkGetAllAuthor.prep({
			params: {
				author: params.vanity,
			},
		})
		Paginator()
			.tweak(p => p.title.text.use("view/author/works/title"))
			.tweak(p => p.primaryActions.append(Slot()
				.if(Session.Auth.loggedIn, () => Button()
					.setIcon("plus")
					.ariaLabel.use("view/author/works/action/label/new")
					.event.subscribe("click", () => navigate.toURL("/work/new")))))
			.useEndpoint(authorQuery, (slot, data) => {
				for (const work of data.works)
					Work(work)
						.type("flush")
						.appendTo(slot)
			})
			.appendTo(view)

		return view
	},
})
