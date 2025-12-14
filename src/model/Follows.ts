import type { FollowsManifest, WorkReference } from 'api.fluff4.me'
import EndpointFollowsAuthor$idFollow from 'endpoint/follows/author/$id/EndpointFollowsAuthor$idFollow'
import EndpointFollowsAuthor$idIgnore from 'endpoint/follows/author/$id/EndpointFollowsAuthor$idIgnore'
import EndpointFollowsAuthor$idUnfollow from 'endpoint/follows/author/$id/EndpointFollowsAuthor$idUnfollow'
import EndpointFollowsAuthor$idUnignore from 'endpoint/follows/author/$id/EndpointFollowsAuthor$idUnignore'
import EndpointFollowsAuthor$idWorkCommentsIgnore from 'endpoint/follows/author/$id/work-comments/EndpointFollowsAuthor$idWorkCommentsIgnore'
import EndpointFollowsAuthor$idWorkCommentsUnignore from 'endpoint/follows/author/$id/work-comments/EndpointFollowsAuthor$idWorkCommentsUnignore'
import EndpointFollowsAll from 'endpoint/follows/EndpointFollowsAll'
import EndpointFollowsTagCategory$idFollow from 'endpoint/follows/tag-category/$id/EndpointFollowsTagCategory$idFollow'
import EndpointFollowsTagCategory$idIgnore from 'endpoint/follows/tag-category/$id/EndpointFollowsTagCategory$idIgnore'
import EndpointFollowsTagCategory$idUnfollow from 'endpoint/follows/tag-category/$id/EndpointFollowsTagCategory$idUnfollow'
import EndpointFollowsTagCategory$idUnignore from 'endpoint/follows/tag-category/$id/EndpointFollowsTagCategory$idUnignore'
import EndpointFollowsTag$idFollow from 'endpoint/follows/tag/$id/EndpointFollowsTag$idFollow'
import EndpointFollowsTag$idIgnore from 'endpoint/follows/tag/$id/EndpointFollowsTag$idIgnore'
import EndpointFollowsTag$idUnfollow from 'endpoint/follows/tag/$id/EndpointFollowsTag$idUnfollow'
import EndpointFollowsTag$idUnignore from 'endpoint/follows/tag/$id/EndpointFollowsTag$idUnignore'
import EndpointFollowsWork$authorVanity$workVanityFollow from 'endpoint/follows/work/$author_vanity/$work_vanity/EndpointFollowsWork$authorVanity$workVanityFollow'
import EndpointFollowsWork$authorVanity$workVanityIgnore from 'endpoint/follows/work/$author_vanity/$work_vanity/EndpointFollowsWork$authorVanity$workVanityIgnore'
import EndpointFollowsWork$authorVanity$workVanityUnfollow from 'endpoint/follows/work/$author_vanity/$work_vanity/EndpointFollowsWork$authorVanity$workVanityUnfollow'
import EndpointFollowsWork$authorVanity$workVanityUnignore from 'endpoint/follows/work/$author_vanity/$work_vanity/EndpointFollowsWork$authorVanity$workVanityUnignore'
import Manifest from 'model/Manifest'
import Works from 'model/Works'
import State from 'utility/State'
import Time from 'utility/Time'

const manifest = Manifest<{ [KEY in keyof FollowsManifest]: Partial<FollowsManifest[KEY]> }>({
	valid: Time.minutes(5),
	refresh: true,
	cacheId: 'follows',
	requiresAuthor: true,
	get () {
		return EndpointFollowsAll.query()
	},
	orElse () {
		return {
			following: {
				work: [],
				author: [],
				tag: [],
				category: [],
			},
			ignoring: {
				work: [],
				author: [],
				tag: [],
				category: [],
			},
		}
	},
})

const changingState = State(false)
const Util = {

	changingState,

	getTotalFollowing () {
		return 0
			+ (manifest.value?.following.author?.length ?? 0)
			+ (manifest.value?.following.work?.length ?? 0)
			+ (manifest.value?.following.tag?.length ?? 0)
			+ (manifest.value?.following['tag-category']?.length ?? 0)
	},
	getTotalIgnoring () {
		return 0
			+ (manifest.value?.ignoring.author?.length ?? 0)
			+ (manifest.value?.ignoring.work?.length ?? 0)
			+ (manifest.value?.ignoring.tag?.length ?? 0)
			+ (manifest.value?.ignoring['tag-category']?.length ?? 0)
	},

	////////////////////////////////////
	//#region Authors
	followingAuthor (vanity: string) {
		return !!manifest.value?.following.author?.some(follow => follow.author === vanity)
	},
	ignoringAuthor (vanity: string) {
		return !!manifest.value?.ignoring.author?.some(ignore => ignore.author === vanity)
	},
	ignoringAuthorWorkComments (vanity: string) {
		const follow = manifest.value?.following.author?.find(follow => follow.author === vanity)
		return !!follow?.ignoring_work_comments
	},
	async toggleFollowingAuthor (vanity: string) {
		if (Util.followingAuthor(vanity))
			await Util.unfollowAuthor(vanity)
		else
			await Util.followAuthor(vanity)
	},
	async followAuthor (vanity: string) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (Util.followingAuthor(vanity))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsAuthor$idFollow.query({ params: { id: vanity } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring.author?.filterInPlace(ignore => ignore.author !== vanity)
		manifest.value.following.author?.push({
			author: vanity,
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unfollowAuthor (vanity: string) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (!Util.followingAuthor(vanity))
			return // not following

		changingState.value = true
		const response = await EndpointFollowsAuthor$idUnfollow.query({ params: { id: vanity } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following.author?.filterInPlace(follow => follow.author !== vanity)
		manifest.emit()
	},
	async toggleIgnoringAuthor (vanity: string) {
		if (Util.ignoringAuthor(vanity))
			await Util.unignoreAuthor(vanity)
		else
			await Util.ignoreAuthor(vanity)
	},
	async ignoreAuthor (vanity: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (Util.ignoringAuthor(vanity))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsAuthor$idIgnore.query({ params: { id: vanity } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following.author?.filterInPlace(ignore => ignore.author !== vanity)
		manifest.value.ignoring.author?.push({
			author: vanity,
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unignoreAuthor (vanity: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (!Util.ignoringAuthor(vanity))
			return // not ignoring

		changingState.value = true
		const response = await EndpointFollowsAuthor$idUnignore.query({ params: { id: vanity } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring.author?.filterInPlace(follow => follow.author !== vanity)
		manifest.emit()
	},
	async toggleIgnoringAuthorWorkComments (vanity: string) {
		if (Util.ignoringAuthorWorkComments(vanity))
			await Util.unignoreAuthorWorkComments(vanity)
		else
			await Util.ignoreAuthorWorkComments(vanity)
	},
	async ignoreAuthorWorkComments (vanity: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (Util.ignoringAuthorWorkComments(vanity))
			return // already ignoring

		changingState.value = true
		const response = await EndpointFollowsAuthor$idWorkCommentsIgnore.query({ params: { id: vanity } })
		changingState.value = false
		if (toast.handleError(response))
			return

		const follow = manifest.value?.following.author?.find(authorFollow => authorFollow.author === vanity)
		if (follow)
			follow.ignoring_work_comments = true

		manifest.emit()
	},
	async unignoreAuthorWorkComments (vanity: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (!Util.ignoringAuthorWorkComments(vanity))
			return // not ignoring

		changingState.value = true
		const response = await EndpointFollowsAuthor$idWorkCommentsUnignore.query({ params: { id: vanity } })
		changingState.value = false
		if (toast.handleError(response))
			return

		const follow = manifest.value?.following.author?.find(authorFollow => authorFollow.author === vanity)
		if (follow)
			follow.ignoring_work_comments = undefined

		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Works
	followingWork (work: WorkReference) {
		return !!manifest.value?.following.work?.some(follow => Works.equals(follow.work, work))
	},
	ignoringWork (work: WorkReference) {
		return !!manifest.value?.ignoring.work?.some(ignore => Works.equals(ignore.work, work))
	},
	async toggleFollowingWork (work: WorkReference) {
		if (Util.followingWork(work))
			await Util.unfollowWork(work)
		else
			await Util.followWork(work)
	},
	async followWork (work: WorkReference) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (Util.followingWork(work))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsWork$authorVanity$workVanityFollow.query({ params: Works.reference(work) })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring.work?.filterInPlace(w => !Works.equals(w.work, work))
		manifest.value.following.work?.push({
			work: Works.reference(work),
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unfollowWork (work: WorkReference) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (!Util.followingWork(work))
			return // not following

		changingState.value = true
		const response = await EndpointFollowsWork$authorVanity$workVanityUnfollow.query({ params: Works.reference(work) })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following.work?.filterInPlace(w => !Works.equals(w.work, work))
		manifest.emit()
	},
	async toggleIgnoringWork (work: WorkReference) {
		if (Util.ignoringWork(work))
			await Util.unignoreWork(work)
		else
			await Util.ignoreWork(work)
	},
	async ignoreWork (work: WorkReference) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (Util.ignoringWork(work))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsWork$authorVanity$workVanityIgnore.query({ params: Works.reference(work) })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following.work?.filterInPlace(w => !Works.equals(w.work, work))
		manifest.value.ignoring.work?.push({
			work: Works.reference(work),
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unignoreWork (work: WorkReference) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (!Util.ignoringWork(work))
			return // not ignoring

		changingState.value = true
		const response = await EndpointFollowsWork$authorVanity$workVanityUnignore.query({ params: Works.reference(work) })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring.work?.filterInPlace(w => !Works.equals(w.work, work))
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Tags
	followingTag (tag: string) {
		return !!manifest.value?.following.tag?.some(follow => follow.tag === tag)
	},
	ignoringTag (tag: string) {
		return !!manifest.value?.ignoring.tag?.some(ignore => ignore.tag === tag)
	},
	async toggleFollowingTag (tag: string) {
		if (Util.followingTag(tag))
			await Util.unfollowTag(tag)
		else
			await Util.followTag(tag)
	},
	async followTag (tag: string) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (Util.followingTag(tag))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsTag$idFollow.query({ params: { id: tag } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring.tag?.filterInPlace(ignore => ignore.tag !== tag)
		manifest.value.following.tag?.push({
			tag,
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unfollowTag (tag: string) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (!Util.followingTag(tag))
			return // not following

		changingState.value = true
		const response = await EndpointFollowsTag$idUnfollow.query({ params: { id: tag } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following.tag?.filterInPlace(follow => follow.tag !== tag)
		manifest.emit()
	},
	async toggleIgnoringTag (tag: string) {
		if (Util.ignoringTag(tag))
			await Util.unignoreTag(tag)
		else
			await Util.ignoreTag(tag)
	},
	async ignoreTag (tag: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (Util.ignoringTag(tag))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsTag$idIgnore.query({ params: { id: tag } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following.tag?.filterInPlace(ignore => ignore.tag !== tag)
		manifest.value.ignoring.tag?.push({
			tag,
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unignoreTag (tag: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (!Util.ignoringTag(tag))
			return // not ignoring

		changingState.value = true
		const response = await EndpointFollowsTag$idUnignore.query({ params: { id: tag } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring.tag?.filterInPlace(follow => follow.tag !== tag)
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Categories
	followingCategory (category: string) {
		return manifest.value?.following['tag-category']?.some(follow => follow.tag_category === category)
	},
	ignoringCategory (category: string) {
		return manifest.value?.ignoring['tag-category']?.some(ignore => ignore.tag_category === category)
	},
	async toggleFollowingCategory (category: string) {
		if (Util.followingCategory(category))
			await Util.unfollowCategory(category)
		else
			await Util.followCategory(category)
	},
	async followCategory (category: string) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (Util.followingCategory(category))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsTagCategory$idFollow.query({ params: { id: category } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring['tag-category']?.filterInPlace(ignore => ignore.tag_category !== category)
		manifest.value.following['tag-category']?.push({
			tag_category: category,
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unfollowCategory (category: string) {
		if (!manifest.value) {
			console.warn('Cannot modify follows state, not loaded yet')
			return
		}

		if (!Util.followingCategory(category))
			return // not following

		changingState.value = true
		const response = await EndpointFollowsTagCategory$idUnfollow.query({ params: { id: category } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following['tag-category']?.filterInPlace(follow => follow.tag_category !== category)
		manifest.emit()
	},
	async toggleIgnoringCategory (category: string) {
		if (Util.ignoringCategory(category))
			await Util.unignoreCategory(category)
		else
			await Util.ignoreCategory(category)
	},
	async ignoreCategory (category: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (Util.ignoringCategory(category))
			return // already following

		changingState.value = true
		const response = await EndpointFollowsTagCategory$idIgnore.query({ params: { id: category } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.following['tag-category']?.filterInPlace(ignore => ignore.tag_category !== category)
		manifest.value.ignoring['tag-category']?.push({
			tag_category: category,
			updated: new Date().toISOString(),
		})
		manifest.emit()
	},
	async unignoreCategory (category: string) {
		if (!manifest.value) {
			console.warn('Cannot modify ignores state, not loaded yet')
			return
		}

		if (!Util.ignoringCategory(category))
			return // not ignoring

		changingState.value = true
		const response = await EndpointFollowsTagCategory$idUnignore.query({ params: { id: category } })
		changingState.value = false
		if (toast.handleError(response))
			return

		manifest.value.ignoring['tag-category']?.filterInPlace(follow => follow.tag_category !== category)
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

}

export default Object.assign(
	manifest,
	Util,
)
