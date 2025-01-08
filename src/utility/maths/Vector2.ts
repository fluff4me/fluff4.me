import type { Mutable } from 'utility/Type'

interface Vector2 {
	readonly x: number
	readonly y: number
}

function Vector2 (): Vector2
function Vector2 (xy: number): Vector2
function Vector2 (x: number, y: number): Vector2
function Vector2 (x = 0, y?: number): Vector2 {
	if (y === undefined)
		y = x

	return { x, y }
}

namespace Vector2 {

	////////////////////////////////////
	//#region Constructors

	export const ZERO: Vector2 = { x: 0, y: 0 }
	export const ONE: Vector2 = { x: 1, y: 1 }

	export function mutable (): Mutable<Vector2>
	export function mutable (xy: number): Mutable<Vector2>
	export function mutable (x: number, y: number): Mutable<Vector2>
	export function mutable (x = 0, y?: number): Mutable<Vector2> {
		if (y === undefined)
			y = x

		return { x, y }
	}

	export function fromClient (clientSource: { clientX: number, clientY: number }): Vector2 {
		return { x: clientSource.clientX, y: clientSource.clientY }
	}

	//#endregion
	////////////////////////////////////

	export function equals (v1: Vector2, v2: Vector2): boolean {
		return v1.x === v2.x && v1.y === v2.y
	}

	export function distance (v1: Vector2, v2: Vector2) {
		return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2)
	}

	export function distanceWithin (within: number, v1: Vector2, v2: Vector2): boolean {
		return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2 < within ** 2
	}

	export function add (v1: Vector2, v2: Vector2): Vector2 {
		return { x: v1.x + v2.x, y: v1.y + v2.y }
	}

	export function addInPlace (v1: Mutable<Vector2>, v2: Vector2): Mutable<Vector2> {
		v1.x += v2.x
		v1.y += v2.y
		return v1
	}

	export function subtract (v1: Vector2, v2: Vector2): Vector2 {
		return { x: v1.x - v2.x, y: v1.y - v2.y }
	}

	export function subtractInPlace (v1: Mutable<Vector2>, v2: Vector2): Mutable<Vector2> {
		v1.x -= v2.x
		v1.y -= v2.y
		return v1
	}

	export function multiply (v: Vector2, scalar: number): Vector2 {
		return { x: v.x * scalar, y: v.y * scalar }
	}

	export function multiplyInPlace (v: Mutable<Vector2>, scalar: number): Mutable<Vector2> {
		v.x *= scalar
		v.y *= scalar
		return v
	}

	export function divide (v: Vector2, scalar: number): Vector2 {
		return { x: v.x / scalar, y: v.y / scalar }
	}

	export function divideInPlace (v: Mutable<Vector2>, scalar: number): Mutable<Vector2> {
		v.x /= scalar
		v.y /= scalar
		return v
	}

	export function modTruncate (v: Vector2, scalar: number): Vector2 {
		return { x: v.x % scalar, y: v.y % scalar }
	}

	export function modTruncateInPlace (v: Mutable<Vector2>, scalar: number): Mutable<Vector2> {
		v.x %= scalar
		v.y %= scalar
		return v
	}

	export function modFloor (v: Vector2, scalar: number): Vector2 {
		return {
			x: (v.x % scalar + scalar) % scalar,
			y: (v.y % scalar + scalar) % scalar,
		}
	}

	export function modFloorInPlace (v: Mutable<Vector2>, scalar: number): Mutable<Vector2> {
		v.x = (v.x % scalar + scalar) % scalar
		v.y = (v.y % scalar + scalar) % scalar
		return v
	}

	export function dot (v1: Vector2, v2: Vector2): number {
		return v1.x * v2.x + v1.y * v2.y
	}

	/** IE, distance from 0,0 */
	export function magnitude (v: Vector2): number {
		return Math.sqrt(v.x ** 2 + v.y ** 2)
	}

	export function normalise (v: Vector2): Vector2 {
		const magnitude = Vector2.magnitude(v)
		return Vector2.divide(v, magnitude)
	}

	export function normaliseInPlace (v: Mutable<Vector2>): Mutable<Vector2> {
		const magnitude = Vector2.magnitude(v)
		return Vector2.divideInPlace(v, magnitude)
	}

	export function angle (v1: Vector2, v2: Vector2): number {
		const dot = Vector2.dot(v1, v2)
		const lengths = Vector2.magnitude(v1) * Vector2.magnitude(v2)
		const cosTheta = Math.max(-1, Math.min(1, dot / lengths))
		return Math.acos(cosTheta)
	}

	export function rotate (v: Vector2, angle: number): Vector2 {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		return {
			x: v.x * cos - v.y * sin,
			y: v.x * sin + v.y * cos,
		}
	}

	export function rotateInPlace (v: Mutable<Vector2>, angle: number): Mutable<Vector2> {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = v.x
		v.x = x * cos - v.y * sin
		v.y = x * sin + v.y * cos
		return v
	}

	export function lerp (v1: Vector2, v2: Vector2, t: number): Vector2 {
		return {
			x: v1.x + (v2.x - v1.x) * t,
			y: v1.y + (v2.y - v1.y) * t,
		}
	}

	export function clamp (v: Vector2, min: Vector2, max: Vector2): Vector2 {
		return {
			x: Math.min(Math.max(v.x, min.x), max.x),
			y: Math.min(Math.max(v.y, min.y), max.y),
		}
	}

	export function clampInPlace (v: Mutable<Vector2>, min: Vector2, max: Vector2): Mutable<Vector2> {
		v.x = Math.min(Math.max(v.x, min.x), max.x)
		v.y = Math.min(Math.max(v.y, min.y), max.y)
		return v
	}

}

export default Vector2
