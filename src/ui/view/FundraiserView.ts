import SiteStatus from 'model/SiteStatus'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Slot from 'ui/component/core/Slot'
import FundraiserBar from 'ui/component/FundraiserBar'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create () {
		const view = View('fundraiser')

		Block()
			.tweak(block => block.title.text.use('fundraiser/title'))
			.tweak(block => block.content
				.append(Slot().use(SiteStatus, (slot, status) => {
					const fundraiser = status?.fundraisers[0]
					if (!fundraiser)
						return

					return FundraiserBar(fundraiser)
				}))
				.append(Component().useMarkdownContent('fundraiser/description'))
			)
			.appendTo(view.content)

		return view
	},
})
