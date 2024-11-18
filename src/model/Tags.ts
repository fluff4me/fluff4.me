import type { ManifestGlobalTags, Tag } from "api.fluff4.me"
import EndpointTagManifest from "endpoint/tag/EndpointTagManifest"
import Time from "utility/Time"

namespace Tags {

	let manifestTime: number | undefined
	export let manifest: ManifestGlobalTags | undefined
	let promise: Promise<ManifestGlobalTags> | undefined

	function manifestIsFresh (manifest?: ManifestGlobalTags): manifest is ManifestGlobalTags {
		return !!manifest && Date.now() - (manifestTime ?? 0) < Time.minutes(5)
	}

	export async function getManifest (force = false) {
		// don't re-request the tag manifest if it was requested less than 5 minutes ago
		if (!force && manifestIsFresh(manifest))
			return manifest

		return promise ??= (async () => {
			const response = await EndpointTagManifest.query()
			if (response instanceof Error)
				throw response

			manifest = response.data
			manifestTime = Date.now()
			promise = undefined
			return manifest
		})()
	}

	export async function resolve (tag: string): Promise<Tag | undefined>
	export async function resolve (category: string, name: string): Promise<Tag | undefined>
	export async function resolve (tags?: string[] | null): Promise<Tag[]>
	export async function resolve (tags?: string[] | null | string, name?: string) {
		if (!tags?.length)
			return []

		if (Array.isArray(tags))
			return resolveInternal(tags)

		const tag = name ? `${tags}: ${name}` : tags
		const [result] = await resolveInternal([tag])
		return result as Tag | undefined
	}


	async function resolveInternal (tags: string[]) {
		const result: Tag[] = []

		let manifest = await getManifest()
		resolveTags()
		if (result.length !== tags.length && !manifestIsFresh()) {
			manifest = await getManifest(true)
			resolveTags()
		}

		return result

		function resolveTags () {
			result.splice(0, Infinity)
			for (const tagString of tags) {
				const tag = manifest.tags[tagString]
				if (!tag)
					continue

				result.push(tag)
			}
		}
	}
}

export default Tags
