import { EventManager } from "utility/EventManager"

export interface ILocalStorage {
	databases: IDBDatabaseInfo[]
}

export type IStoreEvents =
	& { [KEY in keyof ILocalStorage as `set${Capitalize<KEY>}`]: { value: ILocalStorage[KEY]; oldValue: ILocalStorage[KEY] } }
	& { [KEY in keyof ILocalStorage as `delete${Capitalize<KEY>}`]: { oldValue: ILocalStorage[KEY] } }

let storage: Partial<ILocalStorage> | undefined

export default class Store {

	public static readonly event = EventManager.make<IStoreEvents>()

	public static get items () {
		return storage ??= new Proxy({}, {
			has (_, key) {
				return Store.has(key as string)
			},
			get (_, key) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Store.get(key as string)
			},
			set (_, key, value) {
				return Store.set(key as string, value)
			},
			deleteProperty (_, key) {
				return Store.delete(key as string)
			},
		}) as any as Partial<ILocalStorage>
	}

	public static get full () {
		const result: any = {}
		for (const [key, value] of Object.entries(localStorage))
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			result[key] = JSON.parse(value)
		return result
	}

	public static has (key: string) {
		return localStorage.getItem(key) !== null
	}

	public static get<T> (key: string): T | null {
		const value = localStorage.getItem(key)
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return value === null ? null : JSON.parse(value)
		} catch {
			localStorage.removeItem(key)
			return null
		}
	}

	public static set (key: string, value: any) {
		const oldValue = Store.get(key)
		if (value === undefined)
			localStorage.removeItem(key)
		else
			localStorage.setItem(key, JSON.stringify(value))
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		Store.event.emit(`set${key[0].toUpperCase()}${key.slice(1)}` as keyof IStoreEvents, { value, oldValue })
		return true
	}

	public static delete (key: string) {
		const oldValue = Store.get(key)
		localStorage.removeItem(key)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		Store.event.emit(`delete${key[0].toUpperCase()}${key.slice(1)}` as keyof IStoreEvents, { oldValue })
		return true
	}
}

Object.assign(window, { Store })
