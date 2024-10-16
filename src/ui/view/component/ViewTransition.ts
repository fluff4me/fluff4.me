import Component from "ui/Component"
import Arrays from "utility/Arrays"

namespace ViewTransition {

	const DATA_HAS_ID = "has-view-transition"
	const DATA_HAS_SUBVIEW_ID = "has-subview-transition"
	const DATA_ID = "view-transition-id"
	const VIEW_TRANSITION_CLASS_VIEW_PREFIX = "view-transition-"
	const VIEW_TRANSITION_CLASS_SUBVIEW = "subview-transition"
	const VIEW_TRANSITION_CLASS_COUNT = 40
	const PADDING = 100

	let id = 0
	export const Has = Component.Builder(component => {
		component.element.setAttribute(`data-${DATA_HAS_ID}`, "")
		component.and(HasSubview)
		return component
	})

	export const HasSubview = Component.Builder(component => {
		component.element.setAttribute(`data-${DATA_HAS_SUBVIEW_ID}`, "")
		component.element.setAttribute(`data-${DATA_ID}`, `${id++}`)
		return component
	})

	export function perform (type: "view" | "subview", swap: () => any) {
		reapply(type)
		return document.startViewTransition(async () => {
			await swap()
			reapply(type)
		})
	}

	export function reapply (type: "view" | "subview") {
		let components = getComponents(type)
		for (const component of components) {
			for (const prefix of [VIEW_TRANSITION_CLASS_VIEW_PREFIX])
				for (let i = 0; i < VIEW_TRANSITION_CLASS_COUNT; i++)
					component.classes.remove(`${prefix}${i}`)

			component.classes.remove(VIEW_TRANSITION_CLASS_SUBVIEW)
			component.element.style.removeProperty("view-transition-name")
		}

		components = components.filter(isInView)
		let i = 0
		if (type === "view")
			for (const component of components)
				component.classes.add(`${VIEW_TRANSITION_CLASS_VIEW_PREFIX}${i++}`)
		else
			for (const component of components) {
				component.classes.add(VIEW_TRANSITION_CLASS_SUBVIEW)
				const id = +component.element.getAttribute(`data-${DATA_ID}`)! || 0
				component.element.style.viewTransitionName = `${VIEW_TRANSITION_CLASS_SUBVIEW}-${id}`
			}
	}

	function isInView (component: Component): boolean {
		const rect = component.element.getBoundingClientRect()
		return true
			&& rect.bottom > -PADDING && rect.top < window.innerHeight + PADDING
			&& rect.right > -PADDING && rect.left < window.innerWidth + PADDING
	}

	function getComponents (type: "view" | "subview") {
		return [...document.querySelectorAll(`[data-${type === "view" ? DATA_HAS_ID : DATA_HAS_SUBVIEW_ID}]`)]
			.map(e => e.component)
			.filter(Arrays.filterNullish)
	}
}

export default ViewTransition

