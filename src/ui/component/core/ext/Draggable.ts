import Component from 'ui/Component'
import Vector2 from 'utility/maths/Vector2'
import State from 'utility/State'

enum DragState {
	None,
	Starting,
	Delayed,
	Dragging,
}

interface DraggableExtensions {
	readonly state: State.Readonly<DragState>
	readonly dragging: State.Readonly<boolean>
	setStickyDistance (stickyDistance?: number): this
	setDelay (delay?: number): this
	stopDragging (): this
}

interface Draggable extends Component, DraggableExtensions { }

export interface DraggableDefinition {
	stickyDistance?: State<number | undefined>
	delay?: State<number | undefined>
	onMoveStart?(draggable: Draggable, position: Vector2): false | void
	onMove?(draggable: Draggable, offset: Vector2, position: Vector2): false | void
	onMoveEnd?(draggable: Draggable, offset: Vector2, position: Vector2): void
}

type DragEvent = (MouseEvent & Partial<TouchEvent>) | (TouchEvent & Partial<MouseEvent>)

const isDraggingAnyDraggable = State(false)

const Draggable = Object.assign(
	Component.Extension((component, definition: DraggableDefinition = {}): Draggable => {
		component.style('draggable')

		const state = State(DragState.None)

		const overrideStickyDistance = State<number | undefined>(undefined)
		const overrideDelay = State<number | undefined>(undefined)

		const stickyDistance = State.MapManual([overrideStickyDistance, definition.stickyDistance], (override, base) => override ?? base ?? 0)
		const delay = State.MapManual([overrideDelay, definition.delay], (override, base) => override ?? base ?? 0)
		let mouseStartPosition: Vector2 | undefined
		// let startTime: number | undefined
		let delayTimeout: number | undefined

		component.onRemoveManual(stopDragging)

		component.event.subscribe(['mousedown', 'touchstart'], dragStart)

		const draggable = component.extend<DraggableExtensions>(component => ({
			state,
			dragging: state.mapManual(value => value === DragState.Dragging),
			setStickyDistance (value) {
				overrideStickyDistance.value = value
				return component
			},
			setDelay (value) {
				overrideDelay.value = value
				return component
			},
			stopDragging,
		}))

		return draggable

		function dragStart (event: DragEvent) {
			const position = getMousePosition(event)
			if (!position)
				return

			event.preventDefault()

			isDraggingAnyDraggable.value = true
			mouseStartPosition = position
			state.value = DragState.Starting
			// startTime = Date.now()

			if (event.type === 'touchstart') {
				window.addEventListener('touchmove', dragMove, { passive: true })
				window.addEventListener('touchend', dragEnd, { passive: true })
			}
			else {
				window.addEventListener('mousemove', dragMove, { passive: true })
				window.addEventListener('mouseup', dragEnd, { passive: true })
			}

			if (delay) {
				state.value = DragState.Delayed
				delayTimeout = window.setTimeout(() => {
					if (state.value === DragState.Delayed) {
						const result = definition.onMoveStart?.(draggable, position)
						if (result === false) {
							dragEnd()
							return
						}

						state.value = DragState.Dragging
						draggable.style('draggable-dragging')
						dragMove(event)
					}
				}, delay.value)
			}
		}

		function dragMove (event: DragEvent) {
			if (state.value === DragState.Delayed)
				return

			const position = getMousePosition(event)
			if (!position)
				return

			const offset = Vector2.subtract(position, mouseStartPosition!)

			const stickyDistanceValue = stickyDistance.value
			if (state.value === DragState.Starting && (stickyDistanceValue < 5 || !Vector2.distanceWithin(stickyDistanceValue, offset, Vector2.ZERO))) {
				const result = definition.onMoveStart?.(draggable, position)
				if (result === false) {
					dragEnd()
					return
				}

				state.value = DragState.Dragging
				draggable.style('draggable-dragging')
			}

			if (state.value !== DragState.Dragging)
				return

			const result = definition.onMove?.(draggable, offset, position)
			if (result === false) {
				dragEnd()
				return
			}

			return offset
		}

		function dragEnd (event?: DragEvent) {
			removeListeners()

			if (state.value === DragState.Dragging && event) {
				const position = getMousePosition(event)
				const offset = position ? dragMove(event) : undefined
				definition.onMoveEnd?.(draggable, offset ?? Vector2.ZERO, position ?? mouseStartPosition!)
			}

			stopDragging()
		}

		function removeListeners () {
			window.clearTimeout(delayTimeout)
			window.removeEventListener('touchmove', dragMove)
			window.removeEventListener('mousemove', dragMove)
			window.removeEventListener('touchend', dragEnd)
			window.removeEventListener('mouseup', dragEnd)
		}

		function stopDragging () {
			removeListeners()

			isDraggingAnyDraggable.value = false
			state.value = DragState.None
			mouseStartPosition = undefined
			// startTime = undefined
			draggable.style.remove('draggable-dragging')

			return draggable
		}

		function getMousePosition (event: DragEvent) {
			const touch = event.touches?.[0]
			if (event.button !== 0 && !touch) {
				return undefined
			}

			return Vector2.fromClient(touch ?? event as MouseEvent)
		}
	}),
	{
		isDragging: isDraggingAnyDraggable,
	},
)

export default Draggable
