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

		const paginator = Paginator()
			.tweak(p => p.title.text.use("view/author/works/title"))
			.tweak(p => p.primaryActions.append(Slot()
				.if(Session.Auth.loggedIn, () => Button()
					.setIcon("plus")
					.ariaLabel.use("view/author/works/action/label/new")
					.event.subscribe("click", () => navigate.toURL("/work/new")))))
			.appendTo(view)
		const authorQuery = EndpointWorkGetAllAuthor.prep({
			params: {
				author: params.vanity,
			},
		})
		await paginator.useEndpoint(authorQuery, async (slot, data) => {
			for (const workData of data.works) {
				const work = await Work(workData)
				work.type("flush")
					.appendTo(slot)
			}
		})

		return view
	},
})
