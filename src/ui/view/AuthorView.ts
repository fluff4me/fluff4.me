import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

interface AuthorViewParams {
	vanity: string
}

export default ViewDefinition({
	create: (params: AuthorViewParams) => {
		const view = View("author")
		return view
	},
})
