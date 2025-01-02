import Tags from "model/Tags"
import View from "ui/view/shared/component/View"
import ViewDefinition from "ui/view/shared/component/ViewDefinition"
import Errors from "utility/Errors"

interface TagViewGlobalParams {
	category: string
	name: string
	custom_name?: never
}

interface TagViewCustomParams {
	category?: never
	name?: never
	custom_name: string
}

type TagViewParams = TagViewGlobalParams | TagViewCustomParams

const fromURLRegex = /(-|^)(.)/g
const fromURL = (name: string) => name.replaceAll(fromURLRegex, (_, dash: string, char: string) => `${dash ? " " : ""}${char.toUpperCase()}`)
export default ViewDefinition({
	create: async (params: TagViewParams) => {
		const view = View("tag")

		const tag = params.custom_name ?? await Tags.resolve(fromURL(params.category), fromURL(params.name))
		if (!tag)
			throw Errors.NotFound()

		return view
	},
})
