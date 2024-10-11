import Component from "ui/Component"
import Arrays from "utility/Arrays"

namespace ViewTransition {

	const ATTRIBUTE = "has-view-transition"
	const VIEW_TRANSITION_CLASS_PREFIX = "view-transition-"
	const VIEW_TRANSITION_CLASS_COUNT = 40
	const PADDING = 100

	export const Has = Component.Builder(component => {
		component.element.setAttribute(`data-${ATTRIBUTE}`, "")
		return component
	})

	export function reapply () {
		const components = getComponents()
		for (const component of components)
			for (let i = 0; i < VIEW_TRANSITION_CLASS_COUNT; i++)
				component.classes.remove(`${VIEW_TRANSITION_CLASS_PREFIX}${i}`)

		let i = 0
		for (const component of components)
			if (isInView(component))
				component.classes.add(`${VIEW_TRANSITION_CLASS_PREFIX}${i++}`)
	}

	function isInView (component: Component): boolean {
		const rect = component.element.getBoundingClientRect()
		return true
			&& rect.bottom > -PADDING && rect.top < window.innerHeight + PADDING
			&& rect.right > -PADDING && rect.left < window.innerWidth + PADDING
	}

	function getComponents () {
		return [...document.querySelectorAll(`[data-${ATTRIBUTE}]`)]
			.map(e => e.component)
			.filter(Arrays.filterNullish)
	}
}

export default ViewTransition

