import Component from "ui/Component"
import Arrays from "utility/Arrays"

declare module "ui/Component" {
	interface ComponentExtensions extends ViewTransitionComponentExtensions { }
}

interface ViewTransitionComponentExtensions {
	viewTransition (): this
	subviewTransition (name: string): this
}

namespace ViewTransition {

	const DATA_HAS_ID = "has-view-transition"
	const DATA_HAS_SUBVIEW_ID = "has-subview-transition"
	const DATA_ID = "view-transition-id"
	const VIEW_TRANSITION_CLASS_VIEW_PREFIX = "view-transition-"
	const VIEW_TRANSITION_CLASS_SUBVIEW = "subview-transition"
	const VIEW_TRANSITION_CLASS_COUNT = 40
	const PADDING = 100

	Component.extend(component => component.extend<ViewTransitionComponentExtensions>(component => ({
		viewTransition () {
			component.element.setAttribute(`data-${DATA_HAS_ID}`, "")
			return component
		},
		subviewTransition (name) {
			component.element.setAttribute(`data-${DATA_HAS_SUBVIEW_ID}`, name)
			component.element.setAttribute(`data-${DATA_ID}`, `${id++}`)
			return component
		},
	})))

	let id = 0

	let i = 0
	let queuedUnapply: number | undefined
	export function perform (type: "view", swap: () => any): ViewTransition
	export function perform (type: "subview", name: string, swap: () => any): ViewTransition
	export function perform (type: "view" | "subview", name?: (() => any) | string, swap?: () => any) {
		queuedUnapply = undefined

		if (typeof name === "function") {
			swap = name
			name = undefined
		}

		reapply(type as "subview", name!)
		const transition = document.startViewTransition(async () => {
			await swap!()
			reapply(type as "subview", name!)
		})

		const id = queuedUnapply = i++
		void transition.finished.then(() => {
			if (queuedUnapply !== id)
				// another view transition started, no unapply
				return

			unapply(type)
		})
		return transition
	}

	export function reapply (type: "view"): void
	export function reapply (type: "subview", name: string): void
	export function reapply (type: "view" | "subview", name?: string) {
		const components = getComponents(type, name).filter(isInView)
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

	export function unapply (type: "view" | "subview") {
		for (const component of getComponents(type)) {
			for (const prefix of [VIEW_TRANSITION_CLASS_VIEW_PREFIX])
				for (let i = 0; i < VIEW_TRANSITION_CLASS_COUNT; i++)
					component.classes.remove(`${prefix}${i}`)

			component.classes.remove(VIEW_TRANSITION_CLASS_SUBVIEW)
			component.element.style.removeProperty("view-transition-name")
		}
	}

	function isInView (component: Component): boolean {
		const rect = component.element.getBoundingClientRect()
		return true
			&& rect.bottom > -PADDING && rect.top < window.innerHeight + PADDING
			&& rect.right > -PADDING && rect.left < window.innerWidth + PADDING
	}

	function getComponents (type: "view" | "subview", name?: string) {
		return [...document.querySelectorAll(`[data-${type === "view" ? DATA_HAS_ID : DATA_HAS_SUBVIEW_ID}${name ? `="${name}"` : ""}]`)]
			.map(e => e.component)
			.filter(Arrays.filterNullish)
	}
}

export default ViewTransition

