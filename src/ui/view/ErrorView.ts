import type { Quilt } from "lang/en-nz"
import quilt from "lang/en-nz"
import Heading from "ui/component/core/Heading"
import Paragraph from "ui/component/core/Paragraph"
import View from "ui/view/shared/component/View"
import ViewDefinition from "ui/view/shared/component/ViewDefinition"

interface ErrorViewParams {
	code: number
	error?: Error
}

export default ViewDefinition({
	create: (params: ErrorViewParams) => {
		const view = View("error")

		if (params.code === 500 && params.error)
			console.error(params.error)

		Heading()
			.text.use(quilt => quilt["view/error/title"]({ CODE: params.code }))
			.appendTo(view)

		const key = `view/error/description-${params.code}` as const
		if (key in quilt)
			Paragraph()
				.text.use(key as Quilt.SimpleKey)
				.appendTo(view)

		return view
	},
})
