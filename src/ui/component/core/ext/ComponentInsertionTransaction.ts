import type Component from 'ui/Component'
import type { ComponentInsertionDestination } from 'ui/Component'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import type { Mutable } from 'utility/Type'

interface ComponentInsertionTransaction extends ComponentInsertionDestination {
	readonly closed: State<boolean>
	readonly size: number
	abort (): void
	close (): void
}

function ComponentInsertionTransaction (component?: Component, onEnd?: (transaction: ComponentInsertionTransaction) => unknown): ComponentInsertionTransaction {
	let unuseComponentRemove: UnsubscribeState | undefined = component?.removed.useManual(removed => removed && onComponentRemove())

	const closed = State(false)
	let removed = false
	const result: Mutable<ComponentInsertionTransaction> = {
		isInsertionDestination: true,
		closed,
		get size () {
			return component?.element.children.length ?? 0
		},
		append (...contents) {
			if (closed.value)
				return result

			component?.append(...contents)
			return result
		},
		prepend (...contents) {
			if (closed.value)
				return result

			component?.prepend(...contents)
			return result
		},
		insert (direction, sibling, ...contents) {
			if (closed.value)
				return result

			component?.insert(direction, sibling, ...contents)
			return result
		},
		abort () {
			if (closed.value)
				return

			close()
		},
		close () {
			if (closed.value)
				return

			if (!removed)
				onEnd?.(result)

			close()
		},
	}

	return result

	function close () {
		closed.value = true
		unuseComponentRemove?.(); unuseComponentRemove = undefined
		component = undefined
	}

	function onComponentRemove () {
		unuseComponentRemove?.(); unuseComponentRemove = undefined
		removed = true
		result.close()
	}
}

export default ComponentInsertionTransaction
