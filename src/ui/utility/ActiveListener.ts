import type Component from 'ui/Component'

namespace ActiveListener {
	let lastActive: Element[] = []

	export function allActive (): readonly Element[] {
		return lastActive
	}

	export function active (): Element | undefined {
		return lastActive.at(-1)
	}

	export function* allActiveComponents (): Generator<Component> {
		for (const element of lastActive) {
			const component = element.component
			if (component)
				yield component
		}
	}

	export function activeComponent (): Component | undefined {
		return lastActive.at(-1)?.component
	}

	export function listen () {
		document.addEventListener('mousedown', updateActive)
		document.addEventListener('mouseup', updateActive)

		function updateActive () {
			const allActive = document.querySelectorAll(':active')
			const active = allActive[allActive.length - 1]
			if (active === lastActive[lastActive.length - 1])
				return

			const newActive = [...allActive]
			for (const element of lastActive)
				if (element.component && !newActive.includes(element))
					element.component.active.value = false

			for (const element of newActive)
				if (element.component && !lastActive.includes(element))
					element.component.active.value = true

			lastActive = newActive
		}
	}

}

export default ActiveListener
Object.assign(window, { ActiveListener })
