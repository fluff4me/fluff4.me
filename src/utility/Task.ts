import Async from 'utility/Async'
import Time from 'utility/Time'

declare const scheduler: { yield (): Promise<void>, postTask<T> (task: () => Promise<T>, options?: unknown): Promise<T> } | undefined

const DEFAULT_INTERVAL = Time.seconds(1) / 144

export default class Task {

	public static async yield (instantIfUnsupported = false): Promise<void> {
		if (typeof scheduler !== 'undefined' && typeof scheduler.yield === 'function')
			return scheduler.yield()

		if (!instantIfUnsupported)
			await Async.sleep(1)
	}

	public static post<T> (callback: () => Promise<T>, priority: 'user-blocking' | 'user-visible' | 'background'): Promise<T> {
		if (typeof scheduler === 'undefined' || typeof scheduler.postTask !== 'function')
			return callback()

		return scheduler.postTask(callback, { priority })
	}

	private lastYieldEnd = Date.now()
	public constructor (private readonly interval = DEFAULT_INTERVAL) {
	}

	public reset (): void {
		this.lastYieldEnd = Date.now()
	}

	public async yield (instantIfUnsupported = false): Promise<void> {
		if (Date.now() - this.lastYieldEnd > this.interval) {
			await Task.yield(instantIfUnsupported)
			this.lastYieldEnd = Date.now()
		}
	}

}
