import type Vector2 from 'utility/maths/Vector2'
import State from 'utility/State'
import type { Mutable } from 'utility/Type'

namespace Mouse {

	const pos: Mutable<Vector2> = { x: 0, y: 0 }
	export const state: State<Vector2> = State(pos)

	export type MouseMoveHandler = (mouse: Vector2) => unknown
	const handlers = new Set<MouseMoveHandler>()
	export function onMove (handler: MouseMoveHandler) {
		handlers.add(handler)
	}
	export function offMove (handler: MouseMoveHandler) {
		handlers.delete(handler)
	}

	export function listen () {
		document.addEventListener('mousemove', event => {
			if (pos.x === event.clientX && pos.y === event.clientY)
				return

			pos.x = event.clientX
			pos.y = event.clientY
			state.emit()

			for (const handler of handlers)
				handler(pos)
		})
	}
}

export default Mouse
