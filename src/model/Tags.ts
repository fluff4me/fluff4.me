import type { ErrorResponse, ManifestGlobalTags, Response, Tag, TagCategory } from 'api.fluff4.me'
import EndpointTagManifest from 'endpoint/tag/EndpointTagManifest'
import Manifest from 'model/Manifest'
import Time from 'utility/Time'

export type TagId = `${string}: ${string}`

export interface TagsManifestCategory extends TagCategory {
	nameLowercase: string
	wordsLowercase: string[]
}

export interface TagsManifestTag extends Tag {
	categoryLowercase: string
	categoryWordsLowercase: string[]
	nameLowercase: string
	wordsLowercase: string[]
}

export interface TagsManifest extends ManifestGlobalTags {
	categories: Record<string, TagsManifestCategory>
	tags: Record<TagId, TagsManifestTag>
}

const Tags = Object.assign(
	Manifest({
		cacheId: 'tags',
		valid: Time.minutes(5),
		async get () {
			const response = await EndpointTagManifest.query()
			if (!response.data)
				return response as ErrorResponse<Response<TagsManifest>>

			const rawManifest = response.data
			for (const rawCategory of Object.values(rawManifest.categories)) {
				const category = rawCategory as TagsManifestCategory
				category.nameLowercase = category.name.toLowerCase()
				category.wordsLowercase = category.nameLowercase.split(' ')
			}

			for (const tag of Object.values(rawManifest.tags))
				fillTag(tag)

			return response as Response<TagsManifest>
		},
	}),
	{
		resolve,
		toId,
		addTag (tag: Tag) {
			if (!Tags.value)
				return

			Tags.value.tags[`${tag.category}: ${tag.name}`] = fillTag(tag)
			Tags.emit()
		},
		removeTags (...tags: TagId[]) {
			if (!Tags.value)
				return

			for (const tag of tags)
				delete Tags.value.tags[tag]

			Tags.emit()
		},
	},
)

export default Tags

function fillTag (rawTag: Tag): TagsManifestTag {
	const tag = rawTag as TagsManifestTag
	tag.nameLowercase = tag.name.toLowerCase()
	tag.wordsLowercase = tag.nameLowercase.split(' ')
	tag.categoryLowercase = tag.category.toLowerCase()
	tag.categoryWordsLowercase = tag.categoryLowercase.split(' ')
	return tag
}

function toId (tag: Tag): string
function toId (category: string, name: string): string
function toId (category: string | Tag, name?: string): string {
	return typeof category === 'string'
		? `${category}: ${name}`
		: `${category.category}: ${category.name}`
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
			const tag = manifest.tags[tagString as TagId]
			if (!tag)
				continue

			result.push(tag)
		}
	}
}
