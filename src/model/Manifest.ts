import type { ErrorResponse, Response } from 'api.fluff4.me'
import Session from 'model/Session'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Time from 'utility/Time'

interface ManifestDefinition<T> {
	valid: number
	refresh?: true
	cacheId?: string
	requiresAuthor?: true
	get (): Promise<Response<T> | ErrorResponse<Response<T>>>
	orElse?(): T
}

interface Manifest<T> extends State<T | undefined> {
	getManifest (force?: boolean): Promise<T>
	isFresh (manifest?: T): manifest is T
}

function Manifest<T> (definition: ManifestDefinition<T>): Manifest<T> {
	let promise: Promise<T> | undefined
	let hasSaveWatcher = false

	let unuseState: UnsubscribeState | undefined = undefined
	const state = State<T | undefined>(undefined, false)
	const result: Manifest<T> = Object.assign(
		state,
		{
			isFresh (manifest?: T): manifest is T {
				return !!manifest && Date.now() - (manifestTime() ?? 0) < definition.valid
			},
			async getManifest (force?: boolean) {
				// don't re-request the tag manifest if it was requested less than 5 minutes ago
				if (!force && result.isFresh(state.value))
					return state.value

				if (definition.requiresAuthor && !Session.Auth.loggedIn.value)
					return undefined!

				return promise ??= (async () => {
					try {
						const response = await definition.get()
						if (response instanceof Error)
							throw response
						state.value = response.data
						ensureSaveWatcher()
					}
					catch (err) {
						if (definition.orElse)
							state.value = definition.orElse()
						else
							throw err
					}

					promise = undefined
					return state.value
				})()
			},
		},
	)

	if (definition.refresh)
		setInterval(async () => {
			if (result.isFresh(state.value))
				return

			const key = `manifest:last-fetch-attempt:${definition.cacheId}`
			const lastFetchAttempt = +localStorage.getItem(key)! || 0
			if (Date.now() - lastFetchAttempt < Time.seconds(60))
				return

			localStorage.setItem(key, `${Date.now()}`)
			await result.getManifest(true)
			localStorage.setItem(key, `${Date.now()}`)
		}, 100)

	return result

	function manifestTime () {
		return manifestStore()?.time
	}

	function manifestStore () {
		if (!definition.cacheId)
			return undefined

		const data = localStorage.getItem(`manifest:${definition.cacheId}`)
		if (!data)
			return undefined

		try {
			const result = JSON.parse(data) as { time: number, data: T }
			if (!result || !('time' in result) || !('data' in result))
				return undefined

			const manifestTime = +result.time || 0
			state.value = result.data

			return {
				time: manifestTime,
				data: state.value,
			}
		}
		catch (err) {
			console.log(err)
			return undefined
		}
		finally {
			ensureSaveWatcher()
		}
	}

	function ensureSaveWatcher () {
		if (!definition.cacheId || hasSaveWatcher)
			return

		unuseState?.()
		unuseState = state.useManual(data =>
			localStorage.setItem(`manifest:${definition.cacheId}`,
				JSON.stringify({ time: Date.now(), data })
			))
	}

}

export default Manifest
