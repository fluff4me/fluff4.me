import Component from 'ui/Component'

export default Component.Builder((component, amount: number, goal: number, mode: 'total' | 'monthly') => {
	const FundraiserAmount = (amount: number) => Component()
		.style('view-type-fundraiser-progress-bar-amount')
		.text.use(quilt => quilt[`fundraiser/amount-${mode}`](amount.toLocaleString(navigator.language)))

	return component
		.style('view-type-fundraiser-progress-bar')
		.style.setVariable('fundraiser-progress', Math.min(1, amount / goal))
		.append(Component()
			.style('view-type-fundraiser-progress-bar-background')
			.append(Component().style('view-type-fundraiser-progress-bar-progress'))
		)
		.append(FundraiserAmount(Math.round(amount / 100)))
		.append(FundraiserAmount(Math.round(goal / 100)))
})
