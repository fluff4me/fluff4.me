import type Component from "ui/Component"
import State from "utility/State"

namespace FocusListener {

	export const hasFocus = State<boolean>(false)
	export const focused = State<Element | undefined>(undefined)

	export function focusedComponent (): Component | undefined {
		return focused.value?.component
	}

	// interface QueuedFocusChange {
	// 	type: "focus" | "blur"
	// 	element: HTMLElement
	// }

	// let updatingFocusState = false
	// let cursor = 0
	// const queue: QueuedFocusChange[] = []
	export function focus (element: HTMLElement) {
		// if (updatingFocusState || exhaustingQueue) {
		// 	queue.splice(cursor, 0, { type: "focus", element })
		// 	cursor++
		// 	return
		// }

		focusInternal(element)
	}

	function focusInternal (element: HTMLElement) {
		if (document.querySelector(":focus-visible") === element)
			return

		element.focus()
	}

	export function blur (element: HTMLElement) {
		// if (updatingFocusState || exhaustingQueue) {
		// 	queue.splice(cursor, 0, { type: "blur", element })
		// 	cursor++
		// 	return
		// }

		blurInternal(element)
	}

	function blurInternal (element: HTMLElement) {
		if (document.querySelector(":focus-visible") !== element)
			return

		element.blur()
	}

	export function listen () {
		document.addEventListener("focusin", onFocusIn)
		document.addEventListener("focusout", onFocusOut)
	}

	function onFocusIn () {
		updateFocusState()
	}
	function onFocusOut (event: FocusEvent) {
		if (event.relatedTarget === null)
			updateFocusState()
	}

	// let exhaustingQueue = false
	function updateFocusState () {
		if (document.activeElement && document.activeElement !== document.body && location.hash && document.activeElement.id !== location.hash.slice(1))
			history.pushState(undefined, "", " ")

		const newFocused = document.querySelector(":focus-visible") ?? undefined
		if (newFocused === focused.value)
			return

		// updatingFocusState = true
		const lastFocusedComponent = focused.value?.component
		const focusedComponent = newFocused?.component

		const oldAncestors = !lastFocusedComponent ? undefined : [...lastFocusedComponent.getAncestorComponents()]
		const newAncestors = !focusedComponent ? undefined : [...focusedComponent.getAncestorComponents()]
		const lastFocusedContainsFocused = focused.value?.contains(newFocused ?? null)

		focused.value = newFocused
		hasFocus.value = !!newFocused

		if (lastFocusedComponent) {
			lastFocusedComponent.focused.value = false
			if (!lastFocusedContainsFocused)
				lastFocusedComponent.hasFocused.value = false
		}

		if (focusedComponent) {
			focusedComponent.focused.value = true
			focusedComponent.hasFocused.value = true
		}

		if (oldAncestors)
			for (const ancestor of oldAncestors)
				if (!newAncestors?.includes(ancestor))
					if (ancestor)
						ancestor.hasFocused.value = false

		if (newAncestors)
			for (const ancestor of newAncestors)
				if (ancestor)
					ancestor.hasFocused.value = true

		// updatingFocusState = false
		// if (exhaustingQueue)
		// 	return

		// exhaustingQueue = true
		// for (cursor = 0; cursor < queue.length; cursor++) {
		// 	const change = queue[cursor]
		// 	if (change.type === "blur")
		// 		blurInternal(change.element)
		// 	else if (change.type === "focus")
		// 		focusInternal(change.element)
		// }

		// queue.splice(0, Infinity)
		// cursor = 0
		// exhaustingQueue = false
	}

}

export default FocusListener
Object.assign(window, { FocusListener })
