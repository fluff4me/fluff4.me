import Component from 'ui/Component'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface GradientTextExtensions {
	useGradient (gradient?: StateOr<readonly number[] | null | undefined>): this
}

interface GradientText extends Component, GradientTextExtensions { }

export default Component.Extension((component, variable?: string, angle = 'to right'): GradientText => {
	let unuseGradient: UnsubscribeState | undefined
	return component.extend<GradientTextExtensions>(component => ({
		useGradient (gradient) {
			unuseGradient?.()
			unuseGradient = State.get(gradient).use(component, stops => component
				.style.toggle(!!stops?.length && !variable, 'gradient-text')
				.style.setProperty(variable ? `--${variable}` : 'background-image', !stops?.length ? undefined
					: `linear-gradient(${angle} in oklch, ${(stops
						.map(colour => `#${colour.toString(16).padStart(6, '0')}`)
						.map(colour => `light-dark(
							oklch(from ${colour} min(0.5, L) C H),
							oklch(from ${colour} max(0.75, L) C H)
						)`)
						.map((colour, index) => {
							if (index === 0)
								return `${colour} var(--gradient-offset-start, 0%)`

							if (index === stops.length - 1)
								return `${colour} calc(100% - var(--gradient-offset-end, 0%))`

							return colour
						})
						.join(', ')
					)})`)
			)
			return component
		},
	}))
})
