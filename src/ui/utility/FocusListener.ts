import type Component from 'ui/Component'
import State from 'utility/State'

namespace FocusListener {

	export const hasFocus = State<boolean>(false)
	export const focused = State<Element | undefined>(undefined)
	export const focusedLast = State<Element | undefined>(undefined)

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

	let focusedThisTick = 0
	let focusTimeout: number | undefined
	function focusInternal (element: HTMLElement) {
		if (document.querySelector(':focus-visible') === element)
			return

		if (focusedThisTick > 100)
			return

		focusedThisTick++
		element.focus()
		window.clearTimeout(focusTimeout)
		window.setTimeout(() => focusedThisTick = 0)
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
		if (document.querySelector(':focus-visible') !== element)
			return

		element.blur()
	}

	export function listen () {
		document.addEventListener('focusin', onFocusIn)
		document.addEventListener('focusout', onFocusOut)
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
			history.pushState(undefined, '', ' ')

		const newFocused = document.querySelector(':focus-visible') ?? undefined
		if (newFocused === focused.value)
			return

		// updatingFocusState = true
		const lastLastFocusedComponent = focusedLast.value?.component
		if (lastLastFocusedComponent) {
			lastLastFocusedComponent.hadFocusedLast.asMutable?.setValue(false)
			for (const ancestor of lastLastFocusedComponent.getAncestorComponents())
				ancestor.hadFocusedLast.asMutable?.setValue(false)
		}

		const lastFocusedComponent = focused.value?.component
		const focusedComponent = newFocused?.component

		const oldAncestors = !lastFocusedComponent ? undefined : [...lastFocusedComponent.getAncestorComponents()]
		const newAncestors = !focusedComponent ? undefined : [...focusedComponent.getAncestorComponents()]
		const lastFocusedContainsFocused = focused.value?.contains(newFocused ?? null)

		focusedLast.value = focused.value
		focused.value = newFocused
		hasFocus.value = !!newFocused

		if (lastFocusedComponent) {
			if (!lastFocusedContainsFocused) {
				if (!focusedComponent)
					// setting "had focused" must happen before clearing "has focused"
					// just in case anything is listening for hasFocused || hadFocusedLast
					lastFocusedComponent.hadFocusedLast.asMutable?.setValue(true)

				lastFocusedComponent.hasFocused.asMutable?.setValue(false)
			}

			lastFocusedComponent.focused.asMutable?.setValue(false)
		}

		if (focusedComponent) {
			focusedComponent.focused.asMutable?.setValue(true)
			focusedComponent.hasFocused.asMutable?.setValue(true)
		}

		if (oldAncestors)
			for (const ancestor of oldAncestors)
				if (!newAncestors?.includes(ancestor))
					if (ancestor) {
						if (!focusedComponent)
							// setting "had focused" must happen before clearing "has focused"
							// just in case anything is listening for hasFocused || hadFocusedLast
							ancestor.hadFocusedLast.asMutable?.setValue(true)

						ancestor.hasFocused.asMutable?.setValue(false)
					}

		if (newAncestors)
			for (const ancestor of newAncestors)
				if (ancestor)
					ancestor.hasFocused.asMutable?.setValue(true)

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
