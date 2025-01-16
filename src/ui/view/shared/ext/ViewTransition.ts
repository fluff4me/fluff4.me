import Component from 'ui/Component'
import { NonNullish } from 'utility/Arrays'

declare module 'ui/Component' {
	interface ComponentExtensions extends ViewTransitionComponentExtensions { }
}

interface ViewTransitionComponentExtensions {
	viewTransition (name?: string): this
	subviewTransition (name?: string): this
}

namespace ViewTransition {

	const DATA_VIEW_TRANSITION_NAME = 'data-view-transition-name'
	const DATA_SUBVIEW_TRANSITION_NAME = 'data-subview-transition-name'
	const DATA_ID = 'data-view-transition-id'
	const VIEW_TRANSITION_CLASS_VIEW = 'view-transition'
	const VIEW_TRANSITION_CLASS_SUBVIEW = 'subview-transition'
	const VIEW_TRANSITION_CLASS_DELAY = 'view-transition-delay'
	const PADDING = 100

	Component.extend(component => component.extend<ViewTransitionComponentExtensions>(component => ({
		viewTransition (name) {
			if (name) {
				name = name.replace(/[^a-z0-9-]+/g, '-').toLowerCase()
				component.attributes.set(DATA_VIEW_TRANSITION_NAME, name)
				component.attributes.compute(DATA_ID, () => `${id++}`)
			}
			else {
				component.attributes.remove(DATA_VIEW_TRANSITION_NAME)
				component.attributes.remove(DATA_ID)
			}
			return component
		},
		subviewTransition (name) {
			if (name) {
				name = name.replace(/[^a-z0-9-]+/g, '-').toLowerCase()
				component.attributes.set(DATA_SUBVIEW_TRANSITION_NAME, name)
				component.attributes.compute(DATA_ID, () => `${id++}`)
			}
			else {
				component.attributes.remove(DATA_SUBVIEW_TRANSITION_NAME)
				component.attributes.remove(DATA_ID)
			}
			return component
		},
	})))

	let id = 0

	let i = 0
	let queuedUnapply: number | undefined
	export function perform (type: 'view', swap: () => unknown): ViewTransition
	export function perform (type: 'subview', name: string, swap: () => unknown): ViewTransition
	export function perform (type: 'view' | 'subview', name?: (() => unknown) | string, swap?: () => unknown) {
		queuedUnapply = undefined

		if (typeof name === 'function') {
			swap = name
			name = undefined
		}

		reapply(type as 'subview', name!)
		const transition = document.startViewTransition(async () => {
			await swap!()
			reapply(type as 'subview', name!)
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

	export function reapply (type: 'view'): void
	export function reapply (type: 'subview', name: string): void
	export function reapply (type: 'view' | 'subview', name?: string) {
		const components = getComponents(type, name).filter(isInView)
		let i = 0
		if (type === 'view')
			for (const component of components) {
				component.classes.add(VIEW_TRANSITION_CLASS_VIEW)
				const name = component.attributes.get(DATA_VIEW_TRANSITION_NAME)
				component.style.setVariable('view-transition-delay', `${VIEW_TRANSITION_CLASS_DELAY}-${i}`)
				component.style.setProperty('view-transition-name', `${VIEW_TRANSITION_CLASS_VIEW}-${name}-${i++}`)
			}
		else
			for (const component of components) {
				component.classes.add(VIEW_TRANSITION_CLASS_SUBVIEW)
				const name = component.attributes.get(DATA_SUBVIEW_TRANSITION_NAME)
				const id = +component.attributes.get(DATA_ID)! || 0
				component.style.setProperty('view-transition-name', `${VIEW_TRANSITION_CLASS_SUBVIEW}-${name}-${id}`)
				component.style.setVariable('view-transition-delay', `${VIEW_TRANSITION_CLASS_DELAY}-${i++}`)
			}
	}

	export function unapply (type: 'view' | 'subview') {
		for (const component of getComponents(type)) {
			component.classes.remove(VIEW_TRANSITION_CLASS_VIEW)
			component.classes.remove(VIEW_TRANSITION_CLASS_SUBVIEW)
			component.style.removeProperties('view-transition-name')
			component.style.removeVariables('view-transition-delay')
		}
	}

	function isInView (component: Component): boolean {
		const rect = component.element.getBoundingClientRect()
		return true
			&& rect.bottom > -PADDING && rect.top < window.innerHeight + PADDING
			&& rect.right > -PADDING && rect.left < window.innerWidth + PADDING
	}

	function getComponents (type: 'view' | 'subview', name?: string) {
		return [...document.querySelectorAll(`[${type === 'view' ? DATA_VIEW_TRANSITION_NAME : DATA_SUBVIEW_TRANSITION_NAME}${name ? `="${name}"` : ''}]`)]
			.map(e => e.component)
			.filter(NonNullish)
	}
}

export default ViewTransition
