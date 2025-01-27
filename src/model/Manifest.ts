import type { ErrorResponse, Response } from 'api.fluff4.me'
import State from 'utility/State'
import Time from 'utility/Time'

interface ManifestDefinition<T> {
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

	const state = State<T | undefined>(undefined)

	const result: Manifest<T> = Object.assign(
		state,
		{
			isFresh (manifest?: T): manifest is T {
				return !!manifest && Date.now() - (manifestTime ?? 0) < Time.minutes(5)
			},
			async getManifest (force?: boolean) {
				// don't re-request the tag manifest if it was requested less than 5 minutes ago
				if (!force && result.isFresh(result.value))
					return state.value!

				return promise ??= (async () => {
					try {
						const response = await definition.get()
						if (response instanceof Error)
							throw response
						state.value = response.data
					}
					catch (err) {
						if (definition.orElse)
							state.value = definition.orElse()
						else
							throw err
					}

					manifestTime = Date.now()
					promise = undefined
					return state.value
				})()
			},
		},
	)
	return result
}

export default Manifest
