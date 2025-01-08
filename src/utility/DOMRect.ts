import Define from 'utility/Define'
import Vector2 from 'utility/maths/Vector2'

declare global {
	interface DOMRect {
		readonly position: Vector2
		readonly centre: Vector2
		readonly centreX: number
		readonly centreY: number
		expand (amount: number): DOMRect
		contract (amount: number): DOMRect
		intersects (pos: Vector2): boolean
		intersects (rect: DOMRect): boolean
	}
}

export default function () {
	Define.magic(DOMRect.prototype, 'centreX', {
		get () {
			return this.left + this.width / 2
		},
	})

	Define.magic(DOMRect.prototype, 'centreY', {
		get () {
			return this.top + this.height / 2
		},
	})

	Define.magic(DOMRect.prototype, 'centre', {
		get () {
			return Vector2(
				this.left + this.width / 2,
				this.top + this.height / 2,
			)
		},
	})

	Define.magic(DOMRect.prototype, 'position', {
		get () {
			return Vector2(this.left, this.top)
		},
	})

	Define(DOMRect.prototype, 'expand', function (this: DOMRect, amount: number) {
		return new DOMRect(
			this.x - amount, this.y - amount,
			this.width + amount * 2, this.height + amount * 2,
		)
	})

	Define(DOMRect.prototype, 'contract', function (this: DOMRect, amount: number) {
		return new DOMRect(
			Math.min(this.x + amount, this.centreX), Math.min(this.y - amount, this.centreY),
			Math.max(0, this.width - amount * 2), Math.max(0, this.height - amount * 2),
		)
	})

	Define(DOMRect.prototype, 'intersects', function (this: DOMRect, target: DOMRect | Vector2) {
		if ('width' in target)
			return true
				&& this.left >= target.right
				&& this.right <= target.left
				&& this.top >= target.bottom
				&& this.bottom <= target.top

		return true
			&& this.left <= target.x && this.right >= target.x
			&& this.top <= target.y && this.bottom >= target.y
	})
}
