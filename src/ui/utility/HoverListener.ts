import type Component from 'ui/Component'
import Mouse from 'ui/utility/Mouse'

namespace HoverListener {
	let lastHovered: Element[] = []

	export function allHovered (): readonly Element[] {
		return lastHovered
	}

	export function hovered (): Element | undefined {
		return lastHovered.at(-1)
	}

	export function* allHoveredComponents (): Generator<Component> {
		for (const element of lastHovered) {
			const component = element.component
			if (component)
				yield component
		}
	}

	export function hoveredComponent (): Component | undefined {
		return lastHovered.at(-1)?.component
	}

	export function listen () {
		Mouse.onMove(() => {
			const allHovered = [...document.querySelectorAll(':hover')]
			const hovered = allHovered[allHovered.length - 1]

			if (hovered.clientWidth === 0 || hovered.clientHeight === 0)
				allHovered.filterInPlace(element => element.computedStyleMap().get('display')?.toString() !== 'none')

			if (hovered === lastHovered[lastHovered.length - 1])
				return

			const newHovered = allHovered
			for (const element of lastHovered)
				if (element.component && !newHovered.includes(element))
					element.component.hovered.asMutable?.setValue(false)

			for (const element of newHovered)
				if (element.component && !lastHovered.includes(element))
					element.component.hovered.asMutable?.setValue(true)

			lastHovered = newHovered
		})
	}

}

export default HoverListener
Object.assign(window, { HoverListener })
