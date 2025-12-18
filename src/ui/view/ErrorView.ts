import type { Quilt } from 'lang/en-nz'
import quilt from 'lang/en-nz'
import Component from 'ui/Component'
import Heading from 'ui/component/core/Heading'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

interface ErrorViewParams {
	code: number
	error?: Error
}

export default ViewDefinition({
	create: (params: ErrorViewParams) => {
		const view = View('error')

		if (params.code >= 500 && params.error)
			console.error(params.error)

		Heading()
			.text.use(quilt => quilt['view/error/title']({ CODE: params.code }))
			.appendTo(view.content)

		Component('meta')
			.setOwner(view)
			.attributes.set('name', 'robots')
			.attributes.set('content', 'noindex')
			.appendTo(document.head)

		const key = `view/error/description-${params.code}` as const
		if (key in quilt)
			Paragraph()
				.and(Placeholder)
				.text.use(key as Quilt.SimpleKey)
				.appendTo(view.content)
		else
			Paragraph()
				.and(Placeholder)
				.text.set(params.error?.message ?? (quilt => quilt['view/error/description-unknown']()))
				.appendTo(view.content)

		return view
	},
})
