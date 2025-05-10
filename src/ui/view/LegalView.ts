import Block from 'ui/component/core/Block'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

interface LegalViewParams {
	tab?: string
}

export default ViewDefinition({
	create ({ tab }: LegalViewParams | undefined = {}) {
		const view = View('legal')

		const tabinator = Tabinator().appendTo(view.content)

		Tab('terms')
			.text.use('view/legal/terms-of-service/tab')
			.tweak(tab => tab.content.append(Block()
				.tweak(block => block.title.text.use('document/legal/terms-of-service/title'))
				.tweak(block => block.content.useMarkdownContent('document/legal/terms-of-service/v0'))
			))
			.addTo(tabinator)

		Tab('privacy')
			.text.use('view/legal/privacy-policy/tab')
			.tweak(tab => tab.content.append(Block()
				.tweak(block => block.title.text.use('document/legal/privacy-policy/title'))
				.tweak(block => block.content.useMarkdownContent('document/legal/privacy-policy/v0'))
			))
			.addTo(tabinator)

		tabinator.bindURL(tab, tab => tab ? `/legal/${tab}` : '/legal')

		return view
	},
})
