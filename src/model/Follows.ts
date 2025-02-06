import type { Follow, FollowsManifest, WorkReference } from 'api.fluff4.me'
import EndpointFollowAdd from 'endpoint/follow/EndpointFollowAdd'
import EndpointFollowAddWork from 'endpoint/follow/EndpointFollowAddWork'
import EndpointFollowGetManifest from 'endpoint/follow/EndpointFollowGetManifest'
import EndpointFollowRemove from 'endpoint/follow/EndpointFollowRemove'
import EndpointFollowRemoveWork from 'endpoint/follow/EndpointFollowRemoveWork'
import EndpointIgnoreAdd from 'endpoint/follow/EndpointIgnoreAdd'
import EndpointIgnoreAddWork from 'endpoint/follow/EndpointIgnoreAddWork'
import EndpointIgnoreRemove from 'endpoint/follow/EndpointIgnoreRemove'
import EndpointIgnoreRemoveWork from 'endpoint/follow/EndpointIgnoreRemoveWork'
import Manifest from 'model/Manifest'
import Works from 'model/Works'
import Time from 'utility/Time'

const manifest = Manifest<FollowsManifest>({
	valid: Time.minutes(5),
	refresh: true,
	cacheId: 'follows',
	requiresAuthor: true,
	get () {
		return EndpointFollowGetManifest.query()
	},
	orElse () {
		const empy: Follow[] = []
		return {
			following: new Proxy({} as FollowsManifest['following'], {
				get (target, p, receiver) {
					return empy
				},
			}),
			ignoring: new Proxy({} as FollowsManifest['ignoring'], {
				get (target, p, receiver) {
					return empy
				},
			}),
		}
	},
})

const Util = {

	getTotalFollowing () {
		return 0
			+ (manifest.value?.following.author.length ?? 0)
			+ (manifest.value?.following.work.length ?? 0)
			+ (manifest.value?.following.tag.length ?? 0)
			+ (manifest.value?.following.category.length ?? 0)
	},
	getTotalIgnoring () {
		return 0
			+ (manifest.value?.ignoring.author.length ?? 0)
			+ (manifest.value?.ignoring.work.length ?? 0)
			+ (manifest.value?.ignoring.tag.length ?? 0)
			+ (manifest.value?.ignoring.category.length ?? 0)
	},

	////////////////////////////////////
	//#region Authors
	followingAuthor (vanity: string) {
		return manifest.value?.following.author.some(follow => follow.author === vanity)
	},
	ignoringAuthor (vanity: string) {
		return manifest.value?.ignoring.author.some(ignore => ignore.author === vanity)
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

		const response = await EndpointFollowAdd.Author.query({ params: { vanity } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.author.filterInPlace(ignore => ignore.author !== vanity)
		manifest.value.following.author.push({
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

		const response = await EndpointFollowRemove.Author.query({ params: { vanity } })
		if (toast.handleError(response))
			return

		manifest.value.following.author.filterInPlace(follow => follow.author !== vanity)
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

		const response = await EndpointIgnoreAdd.Author.query({ params: { vanity } })
		if (toast.handleError(response))
			return

		manifest.value.following.author.filterInPlace(ignore => ignore.author !== vanity)
		manifest.value.ignoring.author.push({
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

		const response = await EndpointIgnoreRemove.Author.query({ params: { vanity } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.author.filterInPlace(follow => follow.author !== vanity)
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Works
	followingWork (work: WorkReference) {
		return manifest.value?.following.work.some(follow => Works.equals(follow.work, work))
	},
	ignoringWork (work: WorkReference) {
		return manifest.value?.ignoring.work.some(ignore => Works.equals(ignore.work, work))
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

		const response = await EndpointFollowAddWork.query({ params: { author: work.author, vanity: work.vanity } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.work.filterInPlace(w => !Works.equals(w.work, work))
		manifest.value.following.work.push({
			work,
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

		const response = await EndpointFollowRemoveWork.query({ params: { author: work.author, vanity: work.vanity } })
		if (toast.handleError(response))
			return

		manifest.value.following.work.filterInPlace(w => !Works.equals(w.work, work))
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

		const response = await EndpointIgnoreAddWork.query({ params: { author: work.author, vanity: work.vanity } })
		if (toast.handleError(response))
			return

		manifest.value.following.work.filterInPlace(w => !Works.equals(w.work, work))
		manifest.value.ignoring.work.push({
			work,
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

		const response = await EndpointIgnoreRemoveWork.query({ params: { author: work.author, vanity: work.vanity } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.work.filterInPlace(w => !Works.equals(w.work, work))
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Tags
	followingTag (tag: string) {
		return manifest.value?.following.tag.some(follow => follow.tag === tag)
	},
	ignoringTag (tag: string) {
		return manifest.value?.ignoring.tag.some(ignore => ignore.tag === tag)
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

		const response = await EndpointFollowAdd.Tag.query({ params: { vanity: tag } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.tag.filterInPlace(ignore => ignore.tag !== tag)
		manifest.value.following.tag.push({
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

		const response = await EndpointFollowRemove.Tag.query({ params: { vanity: tag } })
		if (toast.handleError(response))
			return

		manifest.value.following.tag.filterInPlace(follow => follow.tag !== tag)
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

		const response = await EndpointIgnoreAdd.Tag.query({ params: { vanity: tag } })
		if (toast.handleError(response))
			return

		manifest.value.following.tag.filterInPlace(ignore => ignore.tag !== tag)
		manifest.value.ignoring.tag.push({
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

		const response = await EndpointIgnoreRemove.Tag.query({ params: { vanity: tag } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.tag.filterInPlace(follow => follow.tag !== tag)
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Categories
	followingCategory (category: string) {
		return manifest.value?.following.category.some(follow => follow.tag_category === category)
	},
	ignoringCategory (category: string) {
		return manifest.value?.ignoring.tag.some(ignore => ignore.tag_category === category)
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

		const response = await EndpointFollowAdd.Category.query({ params: { vanity: category } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.category.filterInPlace(ignore => ignore.tag_category !== category)
		manifest.value.following.category.push({
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

		const response = await EndpointFollowRemove.Category.query({ params: { vanity: category } })
		if (toast.handleError(response))
			return

		manifest.value.following.category.filterInPlace(follow => follow.tag_category !== category)
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

		const response = await EndpointIgnoreAdd.Category.query({ params: { vanity: category } })
		if (toast.handleError(response))
			return

		manifest.value.following.category.filterInPlace(ignore => ignore.tag_category !== category)
		manifest.value.ignoring.category.push({
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

		const response = await EndpointIgnoreRemove.Category.query({ params: { vanity: category } })
		if (toast.handleError(response))
			return

		manifest.value.ignoring.category.filterInPlace(follow => follow.tag_category !== category)
		manifest.emit()
	},
	//#endregion
	////////////////////////////////////

}

export default Object.assign(
	manifest,
	Util,
)
