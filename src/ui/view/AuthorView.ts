import EndpointAuthorGet from "endpoint/author/EndpointAuthorGet"
import Author from "ui/component/Author"
import ActionHeading from "ui/component/core/ActionHeading"
import Button from "ui/component/core/Button"
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

		const row = ActionHeading()
			.tweak(h => h.heading.text.use("view/author/works/title"))
			.appendTo(view)

		Button()
			.text.use("view/author/works/action/new")
			.event.subscribe("click", () => navigate.toURL("/work/new"))
			.appendTo(row.right)

		return view
	},
})
