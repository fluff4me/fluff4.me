export type Supplier<T, ARGS extends any[] = []> = (...args: ARGS) => T
export type SupplierOr<T, ARGS extends any[] = []> = T | ((...args: ARGS) => T)
export type PromiseOr<T> = T | Promise<T>
export type AnyFunction<R = any> = (...args: any[]) => R
export type Mutable<T> = { -readonly [P in keyof T]: T[P] }
export type PartialMutable<T> = { -readonly [P in keyof T]?: T[P] }
export type Nullish = null | undefined
export type Falsy = false | '' | 0 | 0n | Nullish
export type PartialRecord<K extends keyof any, T> = { [P in K]?: T }
export type Empty = Record<string, never>
export type MakePartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>

declare global {
	interface ScreenOrientation {
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ScreenOrientation/lock) */
		lock?(orientation: OrientationLockType): Promise<void>
	}
	type OrientationLockType = 'any' | 'landscape' | 'landscape-primary' | 'landscape-secondary' | 'natural' | 'portrait' | 'portrait-primary' | 'portrait-secondary'
}

namespace Type {

	interface TypeMap {
		string: string
		number: number
		boolean: boolean
		object: object
		function: AnyFunction
		bigint: bigint
		undefined: undefined
		symbol: symbol
	}

	export function as<T extends keyof TypeMap> (type: T, value: unknown): TypeMap[T] | undefined {
		return typeof value === type ? value as TypeMap[T] : undefined
	}

	export function not<T extends keyof TypeMap, R> (type: T, value: R): R | undefined {
		return typeof value === type ? undefined : value
	}

	export function assert<T> (): void { }
}

export default Type
