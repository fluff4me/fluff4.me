import Component from 'ui/Component'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface GradientTextExtensions {
	useGradient (gradient?: StateOr<number[] | undefined>): this
}

interface GradientText extends Component, GradientTextExtensions { }

export default Component.Extension((component): GradientText => {
	let unuseGradient: UnsubscribeState | undefined
	return component.extend<GradientTextExtensions>(component => ({
		useGradient (gradient) {
			unuseGradient?.()
			unuseGradient = State.get(gradient).use(component, stops => component
				.style.toggle(!!stops?.length, 'gradient-text')
				.style.setProperty('background-image', !stops?.length ? undefined
					: `linear-gradient(to right, ${(stops
						.map(colour => `#${colour.toString(16).padStart(6, '0')}`)
						.map(colour => `light-dark(
							oklch(from ${colour} min(0.5, L) C H),
							oklch(from ${colour} max(0.75, L) C H)
						)`)
						.join(', ')
					)})`)
			)
			return component
		},
	}))
})
