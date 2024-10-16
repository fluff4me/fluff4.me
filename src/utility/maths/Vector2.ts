interface Vector2 {
	x: number
	y: number
}

namespace Vector2 {
	export function ZERO (): Vector2 {
		return { x: 0, y: 0 }
	}

	export function distance (v1: Vector2, v2: Vector2) {
		return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2)
	}

	export function distanceWithin (v1: Vector2, v2: Vector2, within: number) {
		return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2 < within ** 2
	}
}

export default Vector2
