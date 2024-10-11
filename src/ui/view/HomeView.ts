import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

export default ViewDefinition({
	create: () => {
		const view = View("home")
		return view
	},
})
