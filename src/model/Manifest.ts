import type { ErrorResponse, Response } from "api.fluff4.me"
import Time from "utility/Time"

interface ManifestDefinition<T> {
	get (): Promise<Response<T> | ErrorResponse<Response<T>>>
}

interface Manifest<T> {
	manifest: T | undefined
	getManifest (force?: boolean): Promise<T>
	isFresh (manifest?: T): manifest is T
}

function Manifest<T> (definition: ManifestDefinition<T>): Manifest<T> {
	let manifestTime: number | undefined
	let promise: Promise<T> | undefined

	const result: Manifest<T> = {
		manifest: undefined,
		isFresh (manifest?: T): manifest is T {
			return !!manifest && Date.now() - (manifestTime ?? 0) < Time.minutes(5)
		},
		async getManifest (force?: boolean) {
			// don't re-request the tag manifest if it was requested less than 5 minutes ago
			if (!force && result.isFresh(result.manifest))
				return result.manifest

			return promise ??= (async () => {
				const response = await definition.get()
				if (response instanceof Error)
					throw response

				result.manifest = response.data
				manifestTime = Date.now()
				promise = undefined
				return result.manifest
			})()
		},
	}
	return result
}

export default Manifest
