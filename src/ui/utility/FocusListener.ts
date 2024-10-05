import type Component from "ui/Component"

namespace FocusListener {
	let lastFocused: Element | undefined

	export function focused (): Element | undefined {
		return lastFocused
	}

	export function focusedComponent (): Component | undefined {
		return lastFocused?.component
	}

	export function listen () {
		document.addEventListener("focusin", updateFocusState)
		document.addEventListener("focusout", updateFocusState)
	}

	function updateFocusState () {
		const focused = document.querySelector(":focus-visible") ?? undefined
		if (focused === lastFocused)
			return

		if (lastFocused?.component?.focused.listening)
			lastFocused.component.focused.value = false

		if (focused?.component?.focused.listening)
			focused.component.focused.value = true

		lastFocused = focused
	}

}

export default FocusListener
Object.assign(window, { FocusListener })
