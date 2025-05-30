import Strings from 'utility/string/Strings'
import type { PromiseOr } from 'utility/Type'

export function mutable<T extends object> (object: T): { -readonly [P in keyof T]: T[P] } {
	return object as never
}

namespace Objects {
	export const EMPTY = {}

	export type Key<O extends object> = `${keyof O & (string | number)}`

	export function keys<O extends object> (object: O): Key<O>[] {
		return Object.keys(object) as Key<O>[]
	}

	export function values<O extends object> (object: O): O[keyof O][] {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return Object.values(object)
	}

	export function entries<O extends object> (object: O): { [K in keyof O]: [K, O[K]] }[keyof O][] {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return Object.entries(object) as any
	}

	export function inherit<T extends { prototype: any }> (obj: any, inherits: T): T['prototype'] {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
		Object.setPrototypeOf(obj, (inherits as any).prototype)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return obj as T['prototype']
	}

	export function filterNullish<T> (object: T): { [KEY in keyof T as undefined extends T[KEY] ? never : null extends T[KEY] ? never : KEY]: T[KEY] } {
		return filter(object, p => p[1] !== null && p[1] !== undefined)
	}

	export function filter<T, R extends [keyof T, any]> (object: T, filter: (pair: { [K in keyof T]: [K, T[K]] }[keyof T]) => pair is R): { [P in R as P[0]]: P[1] }
	export function filter<T> (object: T, filter: (pair: { [K in keyof T]: [K, T[K]] }[keyof T]) => unknown): T
	export function filter<T, R extends [PropertyKeySafe, any]> (object: T, filter: (pair: { [K in keyof T]: [K, T[K]] }[keyof T]) => R) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return Object.fromEntries(Object.entries(object as any).filter(filter as any))
	}

	export type PropertyKeySafe = string | number
	export function map<T, R extends [PropertyKeySafe, any]> (object: T, mapper: (pair: { [K in keyof T]: [K, T[K]] }[keyof T]) => R) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion
		return Object.fromEntries(Object.entries(object as any).map(mapper as any) as any[]) as { [KEY in R[0]]: R[1] }
	}

	export async function mapAsync<T, R extends [PropertyKeySafe, any]> (object: T, mapper: (pair: { [K in keyof T]: [K, T[K]] }[keyof T]) => Promise<R>) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return Object.fromEntries(await Promise.all(Object.entries(object as any).map(mapper as any)) as any) as { [KEY in R[0]]: R[1] }
	}

	export function followPath (obj: any, keys: (string | number)[]) {
		for (const key of keys)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
			obj = obj?.[key]

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return obj
	}

	interface JITGet<T> {
		(): PromiseOr<T>
		compute: () => PromiseOr<T>
	}

	export function applyJIT<T extends object, K extends keyof T> (obj: T, key: K, compute: () => PromiseOr<T[K]>) {
		const get = (() => {
			const promise = compute()
			delete obj[key]
			obj[key] = promise as T[K]

			if (promise instanceof Promise)
				void promise.then(value => obj[key] = value)

			return promise
		}) as JITGet<T[K]>

		get.compute = compute

		Object.defineProperty(obj, key, {
			configurable: true,
			get,
		})
	}

	export function copyJIT<T extends object, K extends keyof T> (target: T, from: T, key: K) {
		const descriptor = Object.getOwnPropertyDescriptor(from, key)
		if (!descriptor)
			return

		if ('value' in descriptor) {
			target[key] = from[key]
			return
		}

		const compute = (descriptor.get as JITGet<T[K]> | undefined)?.compute
		if (!compute)
			return

		applyJIT(target, key, compute)
	}

	export const assign: (typeof Object)['assign'] = function (target: any, ...sources: any[]) {
		for (const source of sources) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			for (const key of Object.keys(source)) {
				const descriptor = Object.getOwnPropertyDescriptor(target, key)
				if (!descriptor || descriptor.writable) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
					target[key] = source[key]
				}
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return target
	}

	export function merge<A, B> (a: A, b: B): A & B {
		if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || Array.isArray(a) || Array.isArray(b))
			return (b === undefined ? a : b) as A & B

		const result: any = {}

		for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
			result[key] = merge((a as any)[key], (b as any)[key])

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return result
	}

	export function stringify (object: any, space?: string): string {
		return stringifyInternal(object, space)
	}

	const SYMBOL_STRINGIFY_DISABLED = Symbol('STRINGIFY_DISABLED')
	export namespace stringify {
		export function disable<T> (object: T): T {
			Object.defineProperty(object, SYMBOL_STRINGIFY_DISABLED, { value: true })
			return object
		}
		disable(window)
		disable(document)
	}

	function stringifyInternal (object: any, space: string | undefined, encountered: any[] = []): string {
		if (object === undefined)
			throw new Error('Cannot stringify undefined')

		if (object === null || typeof object !== 'object')
			return JSON.stringify(object)

		if (encountered.includes(object))
			return '[Circular]'

		encountered.push(object)

		if (Array.isArray(object)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const filtered = object.map(item => typeof item === 'object' && !!item && (item[SYMBOL_STRINGIFY_DISABLED] || item instanceof Node)
				? '[Omitted]'
				: typeof item === 'function'
					? '[Function]'
					: typeof item === 'symbol'
						? item.description ?? '[Symbol]'
						: stringifyInternal(item, space, encountered)
			)
			if (!space)
				return `[${filtered.join(',')}]`

			return `[\n${Strings.indent(filtered.join(',\n'), space)}\n]`
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const entries = getAllEntries(object)
			.filter(([, value]) => true
				&& value !== undefined
				&& typeof value !== 'function'
				&& typeof value !== 'symbol'
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				&& !(typeof value === 'object' && !!value && (value[SYMBOL_STRINGIFY_DISABLED] || value instanceof Node))
			)
			.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))

		if (!space)
			return `{${entries.map(([key, value]) => `${JSON.stringify(key)}:${stringifyInternal(value, space, encountered)}`).join(',')}}`

		return `{\n${Strings.indent(entries.map(([key, value]) => `${JSON.stringify(key)}: ${stringifyInternal(value, space, encountered)}`).join(',\n'))}\n}`
	}

	// get entries — for normal objects, just Object.entries; for ones with custom prototypes, recursively include all prototype properties
	function getAllEntries (object: object) {
		if (Object.getPrototypeOf(object) === Object.prototype)
			return Object.entries(object)

		const resultObject: Record<string, any> = {}
		let current: any = object
		while (current && current !== Object.prototype) {
			for (const key of Object.getOwnPropertyNames(current)) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					resultObject[key] ??= (object as any)[key]
				}
				catch { }
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			current = Object.getPrototypeOf(current)
		}

		return Object.entries(resultObject)
	}
}

export default Objects
