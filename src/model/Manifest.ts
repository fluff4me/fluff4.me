import type { ErrorResponse, Response } from 'api.fluff4.me'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Time from 'utility/Time'

interface ManifestDefinition<T> {
	valid: number
	refresh?: true
	cacheId?: string
	get (): Promise<Response<T> | ErrorResponse<Response<T>>>
	orElse?(): T
}

interface Manifest<T> extends State<T | undefined> {
	getManifest (force?: boolean): Promise<T>
	isFresh (manifest?: T): manifest is T
}

function Manifest<T> (definition: ManifestDefinition<T>): Manifest<T> {
	let manifestTime: number | undefined
	let promise: Promise<T> | undefined

	let unuseState: UnsubscribeState | undefined = undefined
	const state = State<T | undefined>(undefined, false)
	tryLoad()
	const result: Manifest<T> = Object.assign(
		state,
		{
			isFresh (manifest?: T): manifest is T {
				return !!manifest && Date.now() - (manifestTime ?? 0) < definition.valid
			},
			async getManifest (force?: boolean) {
				// don't re-request the tag manifest if it was requested less than 5 minutes ago
				if (!force && result.isFresh(state.value))
					return state.value

				return promise ??= (async () => {
					try {
						const response = await definition.get()
						if (response instanceof Error)
							throw response
						state.value = response.data
						manifestTime = Date.now()
						setupSaveWatcher()
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

	let lastAttempt = 0
	if (definition.refresh)
		setInterval(() => {
			if (result.isFresh(state.value))
				return

			if (Date.now() - lastAttempt < Time.seconds(30))
				return

			lastAttempt = Date.now()
			void result.getManifest(true)
		}, 100)

	return result

	function setupSaveWatcher () {
		if (!definition.cacheId)
			return

		unuseState?.()
		unuseState = state.useManual(data =>
			localStorage.setItem(`manifest:${definition.cacheId}`,
				JSON.stringify({ time: Date.now(), data })
			))
	}

	function tryLoad () {
		if (!definition.cacheId)
			return undefined

		const data = localStorage.getItem(`manifest:${definition.cacheId}`)
		if (!data)
			return undefined

		try {
			const result = JSON.parse(data) as { time: number, data: T }
			if (!result || !('time' in result) || !('data' in result))
				return undefined

			manifestTime = +result.time || 0
			state.value = result.data
		}
		catch (err) {
			console.log(err)
			return undefined
		}

		setupSaveWatcher()
	}
}

export default Manifest
