import Block from 'ui/component/core/Block'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create () {
		const view = View('contact')

		Block()
			.tweak(block => block.title.text.use('document/contact/title'))
			.tweak(block => block.content.useMarkdownContent('document/contact'))
			.appendTo(view.content)

		return view
	},
})
