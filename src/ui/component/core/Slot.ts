import Component, { ComponentInsertionDestination } from 'ui/Component'
import ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type { AbortPromiseOr } from 'utility/AbortPromise'
import AbortPromise from 'utility/AbortPromise'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface SlotComponentExtensions {
	hasContent (): boolean
}

declare module 'ui/Component' {
	interface ComponentExtensions extends SlotComponentExtensions { }
}

Component.extend(component => {
	component.extend<SlotComponentExtensions>(component => ({
		hasContent () {
			const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_TEXT)
			while (walker.nextNode())
				if (walker.currentNode.textContent?.trim())
					return true

			for (const child of component.getDescendants())
				if (!child.is(Slot))
					return true

			return false
		},
	}))
})

export type SlotCleanup = () => unknown
export type SlotInitialiser = (slot: ComponentInsertionTransaction) => SlotInitialiserReturn
export type SlotInitialiserReturn = AbortPromiseOr<SlotCleanup | Component | ComponentInsertionTransaction | undefined | null | false | 0 | '' | void>

interface SlotIfElseExtensions {
	elseIf (state: State<boolean>, initialiser: SlotInitialiser): this
	else (initialiser: SlotInitialiser): this
}

interface SlotExtensions {
	use<T> (state: T | State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): this
	if (state: State<boolean>, initialiser: SlotInitialiser): this & SlotIfElseExtensions
}

interface Slot extends Component, SlotExtensions { }

const Slot = Object.assign(
	Component.Builder((slot): Slot => {
		slot.style('slot')

		let unuse: UnsubscribeState | undefined
		let cleanup: SlotCleanup | undefined
		let abort: (() => unknown) | undefined
		let abortTransaction: (() => unknown) | undefined

		interface Elses {
			elseIfs: { state: State<boolean>, initialiser: SlotInitialiser }[]
			else?: SlotInitialiser
		}

		const elses = State<Elses>({ elseIfs: [] })
		let unuseElses: UnsubscribeState | undefined

		return slot
			.extend<SlotExtensions & SlotIfElseExtensions>(slot => ({
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
							slot.removeContents()
							slot.append(...component.element.children)
						})
						Object.assign(transaction, { closed: component.removed })
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
						unuseElses?.(); unuseElses = undefined

						if (!value) {
							let unuseElsesList: UnsubscribeState | undefined
							const unuseElsesContainer = elses.useManual(elses => {
								unuseElsesList = State.MapManual(elses.elseIfs.map(({ state }) => state), (...elses) => elses.indexOf(true))
									.useManual(elseToUse => {
										const initialiser = elseToUse === -1 ? elses.else : elses.elseIfs[elseToUse].initialiser
										if (!initialiser) {
											slot.removeContents()
											return
										}

										handleSlotInitialiser(initialiser)
									})
							})

							unuseElses = () => {
								unuseElsesList?.()
								unuseElsesContainer()
							}

							return
						}

						handleSlotInitialiser(initialiser)
					})

					return slot
				},
				elseIf (state, initialiser) {
					elses.value.elseIfs.push({ state, initialiser })
					elses.emit()
					return slot
				},
				else (initialiser) {
					elses.value.else = initialiser
					elses.emit()
					return slot
				},
			}))
			.tweak(slot => slot.removed.awaitManual(true, () => cleanup?.()))

		function handleSlotInitialiser (initialiser: SlotInitialiser) {
			const component = Component()
			const transaction = ComponentInsertionTransaction(component, () => {
				slot.removeContents()
				slot.append(...component.element.children)
			})
			Object.assign(transaction, { closed: component.removed })
			abortTransaction = transaction.abort

			handleSlotInitialiserReturn(transaction, initialiser(transaction))
		}

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

			if (ComponentInsertionDestination.is(result)) {
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
