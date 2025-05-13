import Block from 'ui/component/core/Block'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import AboutViewRoadmap from 'ui/view/about/AboutViewRoadmap'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

interface AboutViewParams {
	tab?: string
}

export default ViewDefinition({
	create ({ tab }: AboutViewParams | undefined = {}) {
		const view = View('about')

		const tabinator = Tabinator().appendTo(view.content)

		Tab()
			.text.use('view/about/main/tab')
			.tweak(tab => tab.content.append(Block()
				.tweak(block => block.content.text.set('This page will be filled in soon!'))
			))
			.addTo(tabinator)

		Tab('roadmap')
			.text.use('view/about/roadmap/tab')
			.tweak(tab => tab.content.append(AboutViewRoadmap()))
			.addTo(tabinator)

		Tab('supporters')
			.text.use('view/about/supporters/tab')
			.tweak(tab => tab.content.append(Block()
				.tweak(block => block.content.text.set('This page will be filled in soon!'))
			))
			.addTo(tabinator)

		tabinator.bindURL(tab, tab => tab ? `/about/${tab}` : '/about')
		tabinator.bindViewTitle()

		return view
	},
})
