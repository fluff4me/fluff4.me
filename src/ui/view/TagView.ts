import Tags from "model/Tags"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"
import Errors from "utility/Errors"

interface TagViewParams {
	category: string
	name: string
}

const fromURLRegex = /(-|^)(.)/g
const fromURL = (name: string) => name.replaceAll(fromURLRegex, (_, dash: string, char: string) => `${dash ? " " : ""}${char.toUpperCase()}`)
export default ViewDefinition({
	create: async (params: TagViewParams) => {
		const view = View("tag")

		const tag = await Tags.resolve(fromURL(params.category), fromURL(params.name))
		if (!tag)
			throw Errors.NotFound()

		return view
	},
})
