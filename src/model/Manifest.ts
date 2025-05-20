import type { ErrorResponse, Response } from 'api.fluff4.me'
import Session from 'model/Session'
import PageListener from 'ui/utility/PageListener'
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
	const hasSaveWatcher = false

	let lastTime: number | undefined
	let unuseState: UnsubscribeState | undefined = undefined
	const state = State<T | undefined>(undefined, false)
	let currentlyAssigning = false
	manifestStore()
	const result: Manifest<T> = Object.assign(
		state,
		{
			isFresh (manifest?: T): manifest is T {
				return !!manifest
					&& (false
						|| Date.now() - (manifestTime() ?? 0) < definition.valid
						// pretend like manifests are still valid when the page is hidden
						|| !PageListener.visible.value
					)
			},
			async getManifest (force?: boolean) {
				// don't re-request the tag manifest if it was requested less than 5 minutes ago
				if (currentlyAssigning || (!force && result.isFresh(state.value)))
					return state.value!

				if (definition.requiresAuthor && !Session.Auth.loggedIn.value)
					return undefined!

				return promise ??= (async () => {
					try {
						const response = await definition.get()
						if (response instanceof Error)
							throw response
						lastTime = Date.now()
						state.value = response.data
						ensureSaveWatcher()
					}
					catch (err) {
						if (definition.orElse) {
							lastTime = Date.now()
							state.value = definition.orElse()
						}
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
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
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

			const newTime = +result.time || 0
			if (lastTime === newTime)
				return {
					time: lastTime,
					data: state.value,
				}

			currentlyAssigning = true
			lastTime = newTime
			state.value = result.data

			return {
				time: newTime,
				data: state.value,
			}
		}
		catch (err) {
			console.log(err)
			return undefined
		}
		finally {
			currentlyAssigning = false
			ensureSaveWatcher()
		}
	}

	function ensureSaveWatcher () {
		if (!definition.cacheId || hasSaveWatcher)
			return

		unuseState?.()
		unuseState = state.useManual(data => {
			if (currentlyAssigning)
				return

			localStorage.setItem(`manifest:${definition.cacheId}`,
				JSON.stringify({ time: lastTime, data })
			)
		})
	}
}

export default Manifest
