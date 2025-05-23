import Component from 'ui/Component'
import type { DraggableDefinition } from 'ui/component/core/ext/Draggable'
import Draggable from 'ui/component/core/ext/Draggable'
import { NonNullish } from 'utility/Arrays'
import Vector2 from 'utility/maths/Vector2'
import State from 'utility/State'

interface SortableExtensions<ID extends string | number> {
	readonly sorting: State<boolean>
	readonly order: State<ID[]>
	setSortDelay (delay?: number): this
	setStickyDistance (distance?: number): this
	cancel (): this
}

interface Sortable<ID extends string | number> extends Component, SortableExtensions<ID> { }

namespace Sortable {
	export type BuilderOf<ID extends string | number> = Component.Extension<[SortableDefinition<ID>], Sortable<ID>>
}

export interface SortableDefinition<ID extends string | number> {
	getID (component: Draggable): ID | undefined
	sortDelay?: number
	stickyDistance?: number
	onOrderChange?(order: ID[]): void
}

export function SortableDefinition<ID extends string | number> (definition: SortableDefinition<ID>) {
	return definition
}

const isSortingAnySortable = State(false)

const Sortable = Object.assign(
	Component.Extension(<const ID extends string | number> (component: Component, definition: SortableDefinition<ID>): Sortable<ID> => {
		const sorting = State(false)

		const sortDelay = State(definition.sortDelay ?? 0)
		const stickyDistance = State(definition.stickyDistance ?? 0)

		const order = State<ID[]>([])
		let sortingDraggable: Draggable | undefined
		let slot: Component | undefined

		const draggableDefinition: DraggableDefinition = {
			stickyDistance, delay: sortDelay,
			onMoveStart, onMove, onMoveEnd,
		}
		for (const child of component.getChildren()) child
			.and(Draggable, draggableDefinition)
			.style('sortable-item')

		updateOrder()
		component.receiveChildrenInsertEvents()
		component.event.subscribe('childrenInsert', (event, nodes) => {
			for (const node of nodes)
				if (node !== slot?.element)
					node.component
						?.and(Draggable, draggableDefinition)
						.style('sortable-item')

			updateOrder()
		})

		const sortable = component.extend<SortableExtensions<ID>>(component => ({
			sorting,
			order,
			setSortDelay (delay) {
				sortDelay.value = delay ?? definition.sortDelay ?? 0
				return component
			},
			setStickyDistance (distance) {
				stickyDistance.value = distance ?? definition.stickyDistance ?? 0
				return component
			},
			cancel: () => {
				reset(false)
				return component
			},
		}))

		if (definition.onOrderChange)
			order.subscribeManual(definition.onOrderChange)

		return sortable

		function getDraggables () {
			return [...component.getChildren()]
				.map(child => child.as(Draggable))
				.filter(NonNullish)
		}

		function updateOrder () {
			order.value = getDraggables()
				.map(definition.getID)
				.filter(NonNullish)
		}

		function reset (shouldCommit = true) {
			if (!sorting.value)
				return

			sorting.value = false
			isSortingAnySortable.value = false

			const draggable = sortingDraggable
			sortingDraggable = undefined

			draggable?.style.remove('sortable-item-sorting')
				.style.removeProperties('position', 'left', 'top')

			draggable?.stopDragging()

			slot?.remove()
			slot = undefined

			if (shouldCommit)
				updateOrder()
		}

		function onMoveStart (draggable: Draggable, position: Vector2): false | void {
			const id = definition.getID(draggable)
			if (id === undefined) {
				console.warn('Failed to begin sorting, draggable without ID')
				return false
			}

			draggable.style('sortable-item-sorting')
				.style.setProperty('position', 'fixed')
				.style.setProperty('z-index', 999999999)
			sortingDraggable = draggable
			isSortingAnySortable.value = true
			onMove(draggable, Vector2.ZERO, position)
			sorting.value = true
		}

		function onMove (draggable: Draggable, offset: Vector2, position: Vector2) {
			const rect = draggable.rect.value
			draggable.style.setProperty('left', `${position.x - rect.width / 2}px`)
			draggable.style.setProperty('top', `${position.y - rect.height / 2}px`)
			sort(draggable, position)
		}

		function onMoveEnd (draggable: Draggable, offset: Vector2, position: Vector2) {
			draggable.insertTo(sortable, 'after', slot)
			reset()
		}

		function sort (draggable: Draggable, position: Vector2) {
			slot ??= Component()
				.style('sortable-slot')
				.tweak(slot => {
					const rect = draggable.rect.value
					slot.style.setProperty('width', `${rect.width}px`)
					slot.style.setProperty('height', `${rect.height}px`)
				})

			const rect = sortable.rect.value
			const draggables = getDraggables().filter(d => d !== draggable)
			const positionInSortable = Vector2.subtract(position, rect.position)
			const previousItem = findPreviousItem(draggable, positionInSortable, draggables)

			const toMarkDirty = new Set(slot.getNextSiblings())

			if (!previousItem)
				slot.prependTo(sortable)
			else
				slot.insertTo(sortable, 'after', previousItem)

			for (const sibling of slot.getNextSiblings())
				toMarkDirty.add(sibling)

			for (const sibling of toMarkDirty)
				sibling.rect.markDirty()
		}

		function findPreviousItem (sorting: Draggable, position: Vector2, draggables: Draggable[]) {
			const { left: thisLeft, top: thisTop } = sortable.rect.value

			let lastTop: number | undefined
			for (let i = 0; i < draggables.length; i++) {
				const child = draggables[i]
				if (child === sorting) {
					continue
				}

				let { left, top, width, height } = child.rect.value
				// adjust child position by the position of the host in the document
				left -= thisLeft - width / 2
				top -= thisTop

				// if this is the first item
				if (i === (draggables[0] === sorting ? 1 : 0)) {
					if (position.y < top) {
						// if we're higher than the first item, sort to the start
						return undefined
					}

					if (position.x < left && position.y < top + height) {
						// if we're left of the first item, and we're not below the first item, sort to the start
						return undefined
					}
				}

				// if we're on a different row
				if (lastTop !== undefined && lastTop !== top) {
					// if the new row's top is past the hovered position's y, sort to the end of the previous row
					if (position.y < top) {
						return draggables[i - 1]
					}

					// if the position is within this row vertically, but before any item, sort at the start of this row
					if (position.y >= top && position.y < top + height && position.x < left) {
						return draggables[i - 1]
					}
				}

				lastTop = top

				// if we're hovering inside an item's box
				if (position.x >= left && position.x < left + width && position.y >= top && position.y < top + height) {
					return child
				}
			}

			// we weren't inside anything, and we didn't get put at the start, so we must be after everything instead
			return draggables.at(-1)
		}
	}),
	{
		isSorting: isSortingAnySortable,
	},
)

export default Sortable
