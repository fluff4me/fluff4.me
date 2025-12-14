import type { ErrorResponse, ManifestGlobalTags, Response, Tag, TagCategory } from 'api.fluff4.me'
import EndpointTagsManifest from 'endpoint/tags/EndpointTagsManifest'
import Manifest from 'model/Manifest'
import Arrays from 'utility/Arrays'
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
			const response = await EndpointTagsManifest.query()
			if (!response.data)
				return response as ErrorResponse<Response<TagsManifest>>

			const rawManifest = response.data
			for (const category of Object.values(rawManifest.categories))
				fillCategory(category)

			for (const tag of Object.values(rawManifest.tags))
				fillTag(tag)

			return response as Response<TagsManifest>
		},
	}),
	{
		resolve,
		toId,
		isId (value: unknown): value is TagId {
			if (typeof value !== 'string')
				return false

			if (!Tags.value?.tags)
				return false

			return value in Tags.value.tags
		},
		addTag (tag: Tag) {
			if (!Tags.value)
				return

			Tags.value.tags[`${tag.category}: ${tag.name}`] = fillTag(tag)
			Tags.emit()
		},
		removeTags (...tags: TagId[]) {
			if (!Tags.value)
				return

			for (const tag of tags) {
				delete Tags.value.tags[tag]
				delete Tags.value.relationships[tag]
			}

			Tags.emit()
		},
		recategoriseTags (category: string, ...tags: TagId[]) {
			if (!Tags.value)
				return

			if (!tags.length)
				return

			for (const oldId of tags) {
				const tag: TagsManifestTag = Tags.value.tags[oldId]
				if (!tag)
					continue

				const newTagId = Tags.toId(category, tag.name)
				Tags.value.tags[newTagId] = tag
				delete Tags.value.tags[oldId]
				Tags.value.relationships[newTagId] = Tags.value.relationships[oldId]
				delete Tags.value.relationships[oldId]
			}

			Tags.emit()
		},
		addCategory (category: TagCategory) {
			if (!Tags.value)
				return

			Tags.value.categories[category.name] = fillCategory(category)
			Tags.emit()
		},
		removeCategory (category: string) {
			if (!Tags.value)
				return

			delete Tags.value.categories[category]
			Tags.emit()
		},
		setAliases (tag: TagId, ...aliases: string[]) {
			if (!Tags.value)
				return

			const tagData = Tags.value.tags[tag]
			if (!tagData)
				return

			tagData.aliases = aliases
			Tags.emit()
		},
		addAliases (tag: TagId, ...aliases: string[]) {
			if (!Tags.value)
				return

			if (!aliases.length)
				return

			const tagData = Tags.value.tags[tag]
			if (!tagData)
				return

			(tagData.aliases ??= []).push(...aliases)
			Tags.emit()
		},
		addRelationships (from?: TagId | TagId[] | null, to?: TagId | TagId[] | null) {
			if (!Tags.value)
				return

			if (!from || !to)
				return

			from = Arrays.resolve(from)
			to = Arrays.resolve(to)
			for (const fromId of from) {
				const fromTag = Tags.value.tags[fromId]
				if (!fromTag)
					continue

				for (const toId of to) {
					const toTag = Tags.value.tags[toId]
					if (!toTag)
						continue

					(Tags.value.relationships[fromId] ??= []).push(toId)
				}
			}

			Tags.emit()
		},
		hasMature (workTags?: string[] | null): boolean {
			return !!workTags?.some(tagId => Tags.value?.tags[tagId as TagId]?.is_mature)
		},
	},
)

type Tags = typeof Tags

export default Tags

function fillTag (rawTag: Tag): TagsManifestTag {
	const tag = rawTag as TagsManifestTag
	tag.nameLowercase = tag.name.toLowerCase()
	tag.wordsLowercase = tag.nameLowercase.split(' ')
	tag.categoryLowercase = tag.category.toLowerCase()
	tag.categoryWordsLowercase = tag.categoryLowercase.split(' ')
	return tag
}

function fillCategory (rawCategory: TagCategory): TagsManifestCategory {
	const category = rawCategory as TagsManifestCategory
	category.nameLowercase = category.name.toLowerCase()
	category.wordsLowercase = category.nameLowercase.split(' ')
	return category
}

function toId (tag: Pick<Tag, 'category' | 'name'>): TagId
function toId (category: string, name: string): TagId
function toId (category: string | Pick<Tag, 'category' | 'name'>, name?: string): TagId {
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
			for (const [tagId, tag] of Object.entries(manifest.tags)) {
				if (tagId.toLowerCase() === tagString.toLowerCase()) {
					result.push(tag)
					continue
				}
			}
		}
	}
}
