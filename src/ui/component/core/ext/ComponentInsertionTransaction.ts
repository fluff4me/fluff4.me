import type Component from "ui/Component"
import type { ComponentInsertionDestination } from "ui/Component"
import type { Mutable } from "utility/Type"

interface ComponentInsertionTransaction extends ComponentInsertionDestination {
	readonly closed: boolean
	readonly size: number
	abort (): void
	close (): void
}

function ComponentInsertionTransaction (component?: Component, onEnd?: (transaction: ComponentInsertionTransaction) => any): ComponentInsertionTransaction {
	component?.event.subscribe("remove", onComponentRemove)

	let removed = false
	const result: Mutable<ComponentInsertionTransaction> = {
		isInsertionDestination: true,
		closed: false,
		get size () {
			return component?.element.children.length ?? 0
		},
		append (...contents) {
			if (result.closed)
				return result

			component?.append(...contents)
			return result
		},
		prepend (...contents) {
			if (result.closed)
				return result

			component?.prepend(...contents)
			return result
		},
		insert (direction, sibling, ...contents) {
			if (result.closed)
				return result

			component?.insert(direction, sibling, ...contents)
			return result
		},
		abort () {
			if (result.closed)
				return

			close()
		},
		close () {
			if (result.closed)
				return

			if (!removed)
				onEnd?.(result)

			close()
		},
	}

	return result

	function close () {
		result.closed = true
		component?.event.unsubscribe("remove", onComponentRemove)
		component = undefined
	}

	function onComponentRemove () {
		removed = true
		result.close()
	}
}

export default ComponentInsertionTransaction
