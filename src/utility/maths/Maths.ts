namespace Maths {
	export function isIncrementing (nums: number[]) {
		for (let i = 1; i < nums.length; i++)
			if (nums[i] !== nums[i - 1] + 1)
				return false

		return true
	}

	export function sum (...nums: number[]) {
		let result = 0
		for (const num of nums)
			result += num
		return result
	}

	export function average (...nums: number[]) {
		let result = 0
		for (const num of nums)
			result += num
		return result / nums.length
	}

	export function bits<FLAG_TYPE extends number> (number: FLAG_TYPE) {
		const result = new BitsSet<FLAG_TYPE>()
		for (let i = 52; i >= 0; i--) {
			const v = 1 << i
			if (number & v) result.add(v as FLAG_TYPE)
		}
		return result
	}

	export class BitsSet<FLAG_TYPE extends number> extends Set<FLAG_TYPE> {

		public everyIn (type?: FLAG_TYPE) {
			const t = type ?? 0
			for (const bit of this)
				if (!(t & bit))
					return false

			return true
		}

		public someIn (type?: FLAG_TYPE) {
			const t = type ?? 0
			for (const bit of this)
				if (t & bit)
					return true

			return false
		}

		public every (predicate: (type: FLAG_TYPE) => unknown) {
			for (const bit of this)
				if (!predicate(bit))
					return false

			return true
		}

		public some (predicate: (type: FLAG_TYPE) => unknown) {
			for (const bit of this)
				if (predicate(bit))
					return true

			return false
		}

	}

	export function bitsn<FLAG_TYPE extends bigint> (flag: FLAG_TYPE) {
		const result = new BitsSetN<FLAG_TYPE>()
		for (let i = 52n; i >= 0n; i--) {
			const v = 1n << i
			if (flag & v) result.add(v as FLAG_TYPE)
		}
		return result
	}

	export class BitsSetN<FLAG_TYPE extends bigint> extends Set<FLAG_TYPE> {

		public everyIn (type?: FLAG_TYPE) {
			const t = type ?? 0n
			for (const bit of this)
				if (!(t & bit))
					return false

			return true
		}

		public someIn (type?: FLAG_TYPE) {
			const t = type ?? 0n
			for (const bit of this)
				if (t & bit)
					return true

			return false
		}

		public every (predicate: (type: FLAG_TYPE) => unknown) {
			for (const bit of this)
				if (!predicate(bit))
					return false

			return true
		}

		public some (predicate: (type: FLAG_TYPE) => unknown) {
			for (const bit of this)
				if (predicate(bit))
					return true

			return false
		}

	}

	export function lerp (from: number, to: number, t: number): number {
		return (1 - t) * from + t * to
	}

	export function unlerp (from: number, to: number, value: number): number {
		const reverse = from > to
		if (reverse) {
			const temp = to
			to = from
			from = temp
		}

		const result = value <= from ? 0
			: value >= to ? 1
				: (value - from) / (to - from)

		return reverse ? 1 - result : result
	}

	export function parseIntOrUndefined (value: string): number | undefined {
		const result = parseFloat(value)
		return isNaN(result) || !Number.isInteger(result) ? undefined : result
	}

	export function clamp1 (value: number): number {
		return value < 0 ? 0 : value > 1 ? 1 : value
	}
}

export default Maths
