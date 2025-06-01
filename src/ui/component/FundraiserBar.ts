import type { Fundraiser } from 'api.fluff4.me'
import Component from 'ui/Component'

export default Component.Builder((component, fundraiser: Fundraiser) => {
	const FundraiserAmount = (amount: number) => Component()
		.style('view-type-fundraiser-progress-bar-amount')
		.text.use(quilt => quilt['fundraiser/amount'](amount.toLocaleString(navigator.language)))

	return component
		.style('view-type-fundraiser-progress-bar')
		.style.setVariable('progress', fundraiser.funds_raised / fundraiser.thresholds[0])
		.append(Component()
			.style('view-type-fundraiser-progress-bar-background')
			.append(Component().style('view-type-fundraiser-progress-bar-progress'))
		)
		.append(FundraiserAmount(fundraiser.funds_raised))
		.append(FundraiserAmount(fundraiser.thresholds[0]))
})
