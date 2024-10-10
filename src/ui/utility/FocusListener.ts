import type Component from "ui/Component"
import State from "utility/State"

namespace FocusListener {
	let lastFocused: Element | undefined

	export const hasFocus = State<boolean>(false)

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

		const lastFocusedComponent = lastFocused?.component
		if (lastFocusedComponent?.focused.listening)
			lastFocusedComponent.focused.value = false

		const oldAncestors = !lastFocusedComponent ? undefined : [...lastFocusedComponent.getAncestorComponents()]

		const focusedComponent = focused?.component
		if (focusedComponent?.focused.listening)
			focusedComponent.focused.value = true

		const newAncestors = !focusedComponent ? undefined : [...focusedComponent.getAncestorComponents()]

		if (oldAncestors)
			for (const ancestor of oldAncestors)
				if (!newAncestors?.includes(ancestor))
					if (ancestor.hasFocused.listening)
						ancestor.hasFocused.value = false

		if (newAncestors)
			for (const ancestor of newAncestors)
				if (ancestor.hasFocused.listening)
					ancestor.hasFocused.value = true

		lastFocused = focused
		hasFocus.value = !!focused
	}

}

export default FocusListener
Object.assign(window, { FocusListener })
