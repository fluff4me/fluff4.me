import quilt from "lang/en-nz"
import Heading from "ui/component/Heading"
import Paragraph from "ui/component/Paragraph"
import type { SimpleQuiltKey } from "ui/utility/TextManipulator"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

interface ErrorViewParams {
	code: number
}

export default ViewDefinition({
	create: (params: ErrorViewParams) => {
		const view = View("error")

		Heading()
			.text.use(quilt => quilt["view/error/title"]({ CODE: params.code }))
			.appendTo(view)

		const key = `view/error/description-${params.code}` as const
		if (key in quilt)
			Paragraph()
				.text.use(key as SimpleQuiltKey)
				.appendTo(view)

		return view
	},
})
