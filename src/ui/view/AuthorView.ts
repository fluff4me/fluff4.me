import EndpointAuthorGet from "endpoint/author/EndpointAuthorGet"
import Author from "ui/component/Author"
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
			.appendTo(view)

		return view
	},
})
