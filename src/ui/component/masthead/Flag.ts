import Component from 'ui/Component'
import Arrays from 'utility/Arrays'

interface FlagExtensions {
	wave (reason: string, enabled: boolean): void
}

interface Flag extends Component, FlagExtensions { }

const Flag = Component.Builder((component): Flag => {
	const stripes = Arrays.range(5)
		.map(i => Component()
			.style('flag-stripe', `flag-stripe-${FLAG_STRIPE_COLOURS[i]}`, `flag-stripe-${i + 1 as 1}`))

	let endWhen = Infinity
	const activeReasons = new Set()
	function add (reason: string) {
		if (!activeReasons.size) {
			endWhen = Infinity
			for (const stripe of stripes) {
				stripe.style.remove('flag-stripe--animate-end-0', 'flag-stripe--animate-end-1')
				stripe.style('flag-stripe--animate')
			}
		}

		activeReasons.add(reason)
	}
	function remove (reason: string) {
		activeReasons.delete(reason)
	}
	function toggle (reason: string, enabled: boolean) {
		if (enabled) add(reason)
		else remove(reason)
	}

	component.hoveredOrFocused.subscribe(component, enabled => toggle('focus', enabled))

	for (const stripe of stripes) {
		const first = stripe === stripes[0]
		let iteration = 0
		stripe.event.subscribe('animationstart', () => iteration = 0)
		stripe.event.subscribe('animationiteration', () => {
			iteration++

			if (first && !activeReasons.size)
				endWhen = iteration

			if (iteration >= endWhen) {
				stripe.style.remove('flag-stripe--animate')
				stripe.style(`flag-stripe--animate-end-${(iteration % 2) as 0 | 1}`)
			}
		})
	}

	return component
		.style('flag')
		.append(...stripes)
		.extend<FlagExtensions>(flag => ({
			wave: toggle,
		}))
})

export default Flag

const FLAG_STRIPE_COLOURS = [
	'blue' as const,
	'pink' as const,
	'white' as const,
	'pink' as const,
	'blue' as const,
]
