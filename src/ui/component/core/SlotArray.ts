import Component from 'ui/Component'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type { SlotInitialiserReturn } from 'ui/component/core/Slot'
import Slot from 'ui/component/core/Slot'
import type State from 'utility/State'
import type { UnsubscribeState } from 'utility/State'

interface SlotArrayInsertionTransaction extends ComponentInsertionTransaction {
	readonly index: State<number>
	readonly wrapper: SlotArray
	getSiblings (): Generator<Slot>
}

interface SlotArrayExtensions {
	/**
	 * Use a `State.Array<T>` to create a slot for each item in the array.
	 * 
	 * The initialiser will be called for all new/changed slots.
	 * 
	 * The initialiser will *not* be called for removed slots or when a slot's `index` changes.
	 * If you need to handle the `index` of a slot changing, use the provided `slot.index: State<number>`
	 */
	use<T> (array: State.Array<T>, initialiser: (slot: SlotArrayInsertionTransaction, value: T) => SlotInitialiserReturn): this
}

interface SlotArray extends Component, SlotArrayExtensions { }

const SlotArray = Component.Builder((component): SlotArray => {
	component.and(Slot)

	let unuseArray: UnsubscribeState | undefined
	return component.extend<SlotArrayExtensions>(slot => ({
		use (array, initialiser) {
			unuseArray?.()

			interface ItemSlot extends Slot {
				index: number
			}

			const children: ItemSlot[] = []
			unuseArray = array.useEach(slot, {
				onItem (item, state) {
					const newSlot: ItemSlot = Slot()
						.extend<{ index: number }>(() => ({ index: 0 }))

					const index = item.map(newSlot, item => item.index)
					index.use(newSlot, index => newSlot.index = index)

					// must be after so that `index` is set before `initialiser` is called
					const value = item.map(newSlot, item => item.value, false)

					newSlot.use(value, (transaction, value) => initialiser(
						Object.assign(transaction, {
							index,
							wrapper: slot,
							getSiblings () {
								return slot.getChildren(Slot)
							},
						}),
						value,
					))

					const nextChildIndex = children.findIndex(c => c.index > item.value.index)
					const nextChild = children[nextChildIndex]
					slot.insert('before', nextChild, newSlot)
					if (nextChildIndex === -1)
						children.push(newSlot)
					else
						children.splice(nextChildIndex, 0, newSlot)

					item.value.removed.match(slot, true, () => {
						newSlot.remove()
						children.filterInPlace(c => c !== newSlot)
					})
				},
				onMove (startIndex, endIndex, newStartIndex) {
					const toMove = children.splice(startIndex, endIndex - startIndex)
					const actualInsertionIndex = startIndex < newStartIndex
						? newStartIndex - (endIndex - startIndex) + 1 // account for spliced out indices
						: newStartIndex

					const highestIndex = toMove.map(c => c.index).splat(Math.max)
					const nextChild = children.find(c => c.index > highestIndex)

					children.splice(actualInsertionIndex, 0, ...toMove)

					for (const child of toMove)
						slot.insert('before', nextChild, child)
				},
				onMoveAt (indices, newStartIndex) {
					const toMove = indices.map(index => children[index])
					children.sort((a, b) => a.index - b.index)

					const highestIndex = toMove.map(c => c.index).splat(Math.max)
					const nextChild = children.find(c => c.index > highestIndex)

					for (const child of toMove)
						slot.insert('before', nextChild, child)
				},
			})

			return slot
		},
	}))
})

export default SlotArray
