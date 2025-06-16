namespace Enums {
	export function type<T extends string> () {
		return {
			values<ENUM extends T[]> (...values: ENUM): [ENUM[number]] extends [T] ? [T] extends [ENUM[number]] ? ENUM : never : never {
				return values.distinctInPlace() as never
			},
		}
	}
}

export default Enums
