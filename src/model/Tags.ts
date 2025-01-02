import type { Tag } from "api.fluff4.me"
import EndpointTagManifest from "endpoint/tag/EndpointTagManifest"
import Manifest from "model/Manifest"

export type TagId = `${string}: ${string}`

const Tags = Object.assign(
	Manifest({
		get () {
			return EndpointTagManifest.query()
		},
	}),
	{ resolve },
)

export default Tags

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

	let manifest = await Tags.getManifest()
	resolveTags()
	if (result.length !== tags.length && !Tags.isFresh()) {
		manifest = await Tags.getManifest(true)
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
