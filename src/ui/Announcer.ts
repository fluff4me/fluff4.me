import Component from "ui/Component"
import type { Quilt } from "ui/utility/TextManipulator"

namespace Announcer {

	const assertive = Component()
		.attributes.set("aria-live", "assertive")
		.style.setProperty("opacity", "0")
		.style.setProperty("user-select", "none")
		.style.setProperty("pointer-events", "none")
		.style.setProperty("position", "fixed")
		.appendTo(document.body)

	const polite = Component()
		.attributes.set("aria-live", "polite")
		.style.setProperty("opacity", "0")
		.style.setProperty("user-select", "none")
		.style.setProperty("pointer-events", "none")
		.style.setProperty("position", "fixed")
		.appendTo(document.body)

	export interface Announcer {
		(keyOrHandler: Quilt.SimpleKey | Quilt.Handler): void
	}

	export function interrupt (id: string, announcer: (announce: Announcer) => any) {
		announceInternal(assertive, id, announcer)
	}

	export function announce (id: string, announcer: (announce: Announcer) => any) {
		announceInternal(polite, id, announcer)
	}

	function announceInternal (within: Component, id: string, announcer: (announce: Announcer) => any) {
		const components: Component[] = []
		announcer(keyOrHandler => {
			components.push(Component("p")
				.attributes.set("data-id", id)
				.text.use(keyOrHandler))
		})

		const current = getAnnouncementElements(within, id)
		if (current.length) {
			const currentText = current.map(el => el.textContent).join("\n")
			const newText = components.map(component => component.element.textContent).join("\n")
			if (newText === currentText)
				return

			for (const element of current)
				element.remove()
		}

		for (const component of components)
			component.appendTo(within)
	}

	function getAnnouncementElements (within: Component, id: string): HTMLElement[] {
		return [
			...within.element.querySelectorAll(`[data-id="${id}"]`),
		] as HTMLElement[]
	}
}

export default Announcer
