import Component from 'ui/Component'
import ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type { AbortPromiseOr } from 'utility/AbortPromise'
import AbortPromise from 'utility/AbortPromise'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

export type SlotCleanup = () => unknown
export type SlotInitialiserReturn = AbortPromiseOr<SlotCleanup | Component | undefined | null | false | 0 | '' | void>

interface SlotExtensions {
	use<T> (state: T | State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): this
	if (state: State<boolean>, initialiser: (slot: ComponentInsertionTransaction) => SlotInitialiserReturn): this
}

interface Slot extends Component, SlotExtensions { }

const Slot = Object.assign(
	Component.Builder((slot): Slot => {
		slot.style('slot')

		let unuse: UnsubscribeState | undefined
		let cleanup: SlotCleanup | undefined
		let abort: (() => unknown) | undefined
		let abortTransaction: (() => unknown) | undefined
		return slot
			.extend<SlotExtensions>(slot => ({
				use: (state, initialiser) => {
					state = State.get(state)

					unuse?.(); unuse = undefined
					abort?.(); abort = undefined
					abortTransaction?.(); abortTransaction = undefined

					unuse = state.use(slot, value => {
						abort?.(); abort = undefined
						cleanup?.(); cleanup = undefined
						abortTransaction?.(); abortTransaction = undefined

						const component = Component()
						const transaction = ComponentInsertionTransaction(component, () => {
							if (!transaction.size)
								return

							slot.removeContents()
							slot.append(...component.element.children)
						})
						abortTransaction = transaction.abort

						handleSlotInitialiserReturn(transaction, initialiser(transaction, value))
					})

					return slot
				},
				if: (state, initialiser) => {
					unuse?.(); unuse = undefined
					abort?.(); abort = undefined
					abortTransaction?.(); abortTransaction = undefined

					state.use(slot, value => {
						abort?.(); abort = undefined
						cleanup?.(); cleanup = undefined
						abortTransaction?.(); abortTransaction = undefined

						if (!value) {
							slot.removeContents()
							return
						}

						const component = Component()
						const transaction = ComponentInsertionTransaction(component, () => {
							slot.removeContents()
							slot.append(...component.element.children)
						})
						abortTransaction = transaction.abort

						handleSlotInitialiserReturn(transaction, initialiser(transaction))
					})

					return slot
				},
			}))
			.event.subscribe('remove', () => cleanup?.())

		function handleSlotInitialiserReturn (transaction: ComponentInsertionTransaction, result: SlotInitialiserReturn) {
			if (!(result instanceof AbortPromise))
				return handleSlotInitialiserReturnNonPromise(transaction, result || undefined)

			abort = result.abort
			result.then(result => handleSlotInitialiserReturnNonPromise(transaction, result || undefined))
				.catch(err => console.error('Slot initialiser promise rejection:', err))
		}

		function handleSlotInitialiserReturnNonPromise (transaction: ComponentInsertionTransaction, result: Exclude<SlotInitialiserReturn, Promise<any> | void> | undefined) {
			result ||= undefined

			if (result === slot)
				result = undefined

			transaction.close()
			abortTransaction = undefined

			if (Component.is(result)) {
				result.appendTo(slot)
				cleanup = undefined
				return
			}

			cleanup = result
		}
	}),
	{
		using: <T> (value: T | State<T>, initialiser: (transaction: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn) =>
			Slot().use(State.get(value), initialiser),
	}
)

export default Slot
