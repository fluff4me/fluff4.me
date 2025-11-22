import type { ComponentInsertionDestination } from 'ui/Component'
import Component from 'ui/Component'
import Slot from 'ui/component/core/Slot'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface DynamicDestination<ID extends string = never> extends ComponentInsertionDestination {
	addDestination<NEW_ID extends string> (id: NEW_ID, destination: ComponentInsertionDestination): DynamicDestination<ID | NEW_ID>
	setStrategy (strategy: State<ID | undefined>): this
}

function DynamicDestination (owner: State.Owner): DynamicDestination {
	const intermediaries = new Map<string, Slot>()
	const storage = Component().setOwner(owner)
	const strategy = State<string | undefined>(undefined)
	const slot = Slot().setOwner(owner)

	strategy.subscribeManual(id => {
		const intermediary = id ? intermediaries.get(id) : undefined
		const destination = intermediary ?? storage
		try {
			if ('moveBefore' in destination.element) {
				(destination.element.moveBefore as Element['insertBefore'])(slot.element, null)
				return
			}
		}
		catch { }

		destination.element.insertBefore(slot.element, null)
	})

	let unuseStrategy: UnsubscribeState | undefined
	const man: DynamicDestination = {
		isInsertionDestination: true,
		append (...contents) {
			slot.append(...contents)
			return man
		},
		prepend (...contents) {
			slot.prepend(...contents)
			return man
		},
		insert (direction, sibling, ...contents) {
			slot.insert(direction, sibling, ...contents)
			return man
		},
		addDestination (id, destination) {
			intermediaries.set(id, Slot().setOwner(owner).appendTo(destination))
			return man
		},
		setStrategy (newStrategy) {
			const subOwner = State.Owner.create()
			unuseStrategy?.(); unuseStrategy = subOwner.remove
			strategy.bind(subOwner, newStrategy)
			return man
		},
	}

	return man
}

export default DynamicDestination
