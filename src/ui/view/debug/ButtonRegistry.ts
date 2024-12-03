/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Session from "model/Session"
import Env from "utility/Env"

export interface IButtonImplementation<ARGS extends any[]> {
	name: string
	execute (...args: ARGS): any
}

export const BUTTON_REGISTRY = {
	createAuthor: {
		name: "Create Author",
		async execute (name: string, vanity: string, description?: string, pronouns?: string) {
			const response = await fetch(`${Env.API_ORIGIN}author/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
				},
				body: JSON.stringify({
					name: name,
					vanity: vanity,
					description: description,
					pronouns: pronouns,
				}),
			}).then(response => response.json())
			console.log(response)
			await Session.refresh()
		},
	},

	updateAuthor: {
		name: "Update Author",
		async execute (name?: string, description?: string, vanity?: string, support_link?: string, support_message?: string) {
			await fetch(`${Env.API_ORIGIN}author/update`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name,
					description: description,
					vanity: vanity,
					support_link: support_link,
					support_message: support_message,
				}),
			})
		},
	},

	deleteAuthor: {
		name: "Delete Author",
		async execute () {
			await fetch(`${Env.API_ORIGIN}author/delete`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	viewAuthor: {
		name: "View Author",
		async execute (label: string, vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}author/${vanity}/get`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	clearSession: {
		name: "Clear Session",
		async execute () {
			await fetch(`${Env.API_ORIGIN}session/reset`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
				},
			})

			await Session.refresh()
		},
	},

	createWork: {
		name: "Create Work",
		async execute (name: string, synopsis: string, description: string, vanity: string, status?: string, visibility?: string, globalTags?: string[], customTags?: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}work/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name,
					synopsis: synopsis,
					description: description,
					vanity: vanity,
					status: status,
					visibility: visibility,
					global_tags: globalTags,
					custom_tags: customTags,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	updateWork: {
		name: "Update Work",
		async execute (author: string, url: string, name?: string, description?: string, vanity?: string, status?: string, visibility?: string) {
			await fetch(`${Env.API_ORIGIN}work/${author}/${url}/update`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name,
					description: description,
					vanity: vanity,
					status: status,
					visibility: visibility,
				}),
			})
		},
	},

	deleteWork: {
		name: "Delete Work",
		async execute (author: string, url: string) {
			await fetch(`${Env.API_ORIGIN}work/${author}/${url}/delete`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	viewWork: {
		name: "View Work",
		async execute (label: string, author: string, url: string) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${url}/get`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	getAllWorksByAuthor: {
		name: "View All Works By Author",
		async execute (label: string, author: string) {
			const response = await fetch(`${Env.API_ORIGIN}works/${author}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	createChapter: {
		name: "Create Chapter",
		async execute (author: string, work_url: string, name: string, body: string, visibility?: string, is_numbered?: boolean, notesBefore?: string, notesAfter?: string, globalTags?: string[], customTags?: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${work_url}/chapter/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name,
					body: body,
					visibility: visibility,
					is_numbered: is_numbered,
					notes_before: notesBefore,
					notes_after: notesAfter,
					global_tags: globalTags,
					custom_tags: customTags,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	updateChapter: {
		name: "Update Chapter",
		async execute (author: string, work_url: string, index: number, name?: string, body?: string, visibility?: string, is_numbered?: boolean, notesBefore?: string, notesAfter?: string, globalTags?: string[], customTags?: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/update`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					body,
					visibility,
					is_numbered,
					notes_before: notesBefore,
					notes_after: notesAfter,
					global_tags: globalTags,
					custom_tags: customTags,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	deleteChapter: {
		name: "Delete Chapter",
		async execute (author: string, work_url: string, index: number) {
			await fetch(`${Env.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/delete`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	viewChapter: {
		name: "View Chapter",
		async execute (label: string, author: string, work_url: string, index: number) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/get`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	viewChapterPaginated: {
		name: "View Chapter Paginated",
		async execute (label: string, author: string, work_url: string, index: number) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${work_url}/chapters/individual?page=${index}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	getAllChapters: {
		name: "Get All Chapters",
		async execute (author: string, vanity: string, page: number = 0) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${vanity}/chapters/list?page=${page}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	follow: {
		name: "Follow",
		async execute (type: string, vanity: string) {
			await fetch(`${Env.API_ORIGIN}follow/${type}/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	followWork: {
		name: "Follow",
		async execute (author_vanity: string, work_vanity: string) {
			await fetch(`${Env.API_ORIGIN}follow/work/${author_vanity}/${work_vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	unfollow: {
		name: "Unfollow",
		async execute (type: string, vanity: string) {
			await fetch(`${Env.API_ORIGIN}unfollow/${type}/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	unfollowWork: {
		name: "Unfollow",
		async execute (author_vanity: string, work_vanity: string) {
			await fetch(`${Env.API_ORIGIN}unfollow/work/${author_vanity}/${work_vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	getFollow: {
		name: "Get Follow",
		async execute (type: string, vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}follows/${type}/${vanity}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	getFollowWork: {
		name: "Get Follow",
		async execute (author_vanity: string, work_vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}follows/work/${author_vanity}/${work_vanity}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	getAllFollows: {
		name: "Get All Follows",
		async execute (type: string, page: number = 0) {
			const response = await fetch(`${Env.API_ORIGIN}following/${type}?page=${page}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	getAllFollowsMerged: {
		name: "Get All Follows Merged",
		async execute (page: number = 0) {
			const response = await fetch(`${Env.API_ORIGIN}following?page=${page}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	ignore: {
		name: "Ignore",
		async execute (type: string, vanity: string) {
			await fetch(`${Env.API_ORIGIN}ignore/${type}/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	ignoreWork: {
		name: "Ignore",
		async execute (author_vanity: string, work_vanity: string) {
			await fetch(`${Env.API_ORIGIN}ignore/work/${author_vanity}/${work_vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	unignore: {
		name: "Unignore",
		async execute (type: string, vanity: string) {
			await fetch(`${Env.API_ORIGIN}unignore/${type}/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	unignoreWork: {
		name: "Unignore",
		async execute (author_vanity: string, work_vanity: string) {
			await fetch(`${Env.API_ORIGIN}unignore/work/${author_vanity}/${work_vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
		},
	},

	getIgnore: {
		name: "Get Ignore",
		async execute (type: string, vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}ignores/${type}/${vanity}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	getIgnoreWork: {
		name: "Get Ignore",
		async execute (author_vanity: string, work_vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}ignores/work/${author_vanity}/${work_vanity}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	getAllIgnores: {
		name: "Get All Ignores",
		async execute (type: string, page: number = 0) {
			const response = await fetch(`${Env.API_ORIGIN}ignoring/${type}?page=${page}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	getAllIgnoresMerged: {
		name: "Get All Ignores Merged",
		async execute (page: number = 0) {
			const response = await fetch(`${Env.API_ORIGIN}ignoring?page=${page}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	privilegeGetAllAuthor: {
		name: "Get All Author Privileges",
		async execute (label: string, vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}privilege/get/${vanity}`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	privilegeGrantAuthor: {
		name: "Grant Privileges to Author",
		async execute (vanity: string, ...privileges: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}privilege/grant/author/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					privileges,
				}),
			}).then(response => response.json())
			console.log("granted privileges", response)
		},
	},

	privilegeRevokeAuthor: {
		name: "Revoke Privileges from Author",
		async execute (vanity: string, ...privileges: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}privilege/revoke/author/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					privileges,
				}),
			}).then(response => response.json())
			console.log("revoked privileges", response)
		},
	},

	createRole: {
		name: "Create Role",
		async execute (roleName: string, visibilty: string, roleBelow?: string) {
			const response = await fetch(`${Env.API_ORIGIN}role/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: roleName,
					below: roleBelow,
					description: "idk some test stuff",
					visibilty: visibilty,
				}),
			}).then(response => response.json())
			console.log("created role", response)
		},
	},

	deleteRole: {
		name: "Delete Role",
		async execute (vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}role/delete/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log("deleted role", response)
		},
	},

	editRole: {
		name: "Edit Role",
		async execute (vanity: string, name?: string, description?: string) {
			const response = await fetch(`${Env.API_ORIGIN}role/update/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name,
					description: description,
				}),
			}).then(response => response.json())
			console.log("edited role", response)
		},
	},

	grantRoleToAuthor: {
		name: "Grant Role to Author",
		async execute (roleVanity: string, authorVanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}role/grant/${roleVanity}/${authorVanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log("granted role", response)
		},
	},

	revokeRoleFromAuthor: {
		name: "Revoke Role from Author",
		async execute (roleVanity: string, authorVanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}role/revoke/${roleVanity}/${authorVanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log("granted role", response)
		},
	},

	privilegeGrantRole: {
		name: "Grant Privileges to Role",
		async execute (vanity: string, ...privileges: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}privilege/grant/role/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					privileges,
				}),
			}).then(response => response.json())
			console.log("granted privileges to role", response)
		},
	},

	privilegeRevokeRole: {
		name: "Revoke Privileges from Role",
		async execute (vanity: string, ...privileges: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}privilege/revoke/role/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					privileges,
				}),
			}).then(response => response.json())
			console.log("revoked privileges from role", response)
		},
	},

	roleListAll: {
		name: "List all roles",
		async execute (label: string) {
			const response = await fetch(`${Env.API_ORIGIN}role/get`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	roleReorder: {
		name: "Reorder roles",
		async execute (...roles: string[]) {
			const response = await fetch(`${Env.API_ORIGIN}role/reorder`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roles,
				}),
			}).then(response => response.json())
			console.log("reordered roles", response)
		},
	},

	createCommentChapter: {
		name: "Create Comment Chapter",
		async execute (author: string, vanity: string, index: string, body: string, parent_id?: string) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${vanity}/chapter/${index}/comment/add`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					body,
					parent_id,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	updateCommentChapter: {
		name: "Update Comment Chapter",
		async execute (id: string, comment_body: string) {
			const response = await fetch(`${Env.API_ORIGIN}comment/update/chapter`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					comment_id: id,
					body: comment_body,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	deleteCommentChapter: {
		name: "Delete Comment Chapter",
		async execute (id: string) {
			await fetch(`${Env.API_ORIGIN}comment/remove/chapter`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					comment_id: id,
				}),
			})
		},
	},

	getComment: {
		name: "Get Comment",
		async execute (id: string, label?: string) {
			const response = await fetch(`${Env.API_ORIGIN}comment/get`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					comment_id: id,
				}),
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	getAllComments: {
		name: "Get All Comments",
		async execute (author: string, vanity: string, index: string) {
			const response = await fetch(`${Env.API_ORIGIN}work/${author}/${vanity}/chapter/${index}/comments`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(response)
		},
	},

	patreonGetTiers: {
		name: "Get Tiers",
		async execute (label?: string) {
			const response = await fetch(`${Env.API_ORIGIN}patreon/campaign/tiers/get`, {
				credentials: "include",
			}).then(response => response.json())
			console.log(label, response)
		},
	},

	patreonSetThresholds: {
		name: "Set Chapter Thresholds",
		async execute (author_vanity: string, work_vanity: string, visibility: string, chapters: string[], tier_id?: string) {
			const response = await fetch(`${Env.API_ORIGIN}patreon/campaign/tiers/set/${author_vanity}/${work_vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					visibility: visibility,
					chapters: chapters,
					tier_id: tier_id,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagCreateCategory: {
		name: "Tag Create Category",
		async execute (categoryName: string, categoryDescription: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/create/category`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: categoryName,
					description: categoryDescription,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagCreateGlobal: {
		name: "Tag Create Global",
		async execute (tagName: string, tagDescription: string, tagCategory: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/create/global`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: tagName,
					description: tagDescription,
					category: tagCategory,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagPromoteCustom: {
		name: "Tag Promote Custom",
		async execute (tagName: string, newDescription: string, newCategory: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/promote/${tagName}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					description: newDescription,
					category: newCategory,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagDemoteGlobal: {
		name: "Tag Demote Global",
		async execute (tagName: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/demote/${tagName}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagUpdateCategory: {
		name: "Tag Update Category",
		async execute (vanity: string, categoryName?: string, categoryDescription?: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/update/category/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: categoryName,
					description: categoryDescription,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagUpdateGlobal: {
		name: "Tag Update Global",
		async execute (vanity: string, tagName?: string, tagDescription?: string, tagCategory?: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/update/global/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: tagName,
					description: tagDescription,
					category: tagCategory,
				}),
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagRemoveCategory: {
		name: "Tag Remove Category",
		async execute (vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/remove/category/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagRemoveGlobal: {
		name: "Tag Remove Global",
		async execute (vanity: string) {
			const response = await fetch(`${Env.API_ORIGIN}tag/remove/global/${vanity}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	tagGetManifest: {
		name: "Tag Get Manifest",
		async execute () {
			const response = await fetch(`${Env.API_ORIGIN}manifest/tags`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	manifestFormLengthGet: {
		name: "Form Length Manifest",
		async execute () {
			const response = await fetch(`${Env.API_ORIGIN}manifest/form/lengths`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	notificationsGet: {
		name: "Get Notifications",
		async execute () {
			const response = await fetch(`${Env.API_ORIGIN}notifications/get/all`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	notificationsGetUnread: {
		name: "Get Unread Notifications",
		async execute () {
			const response = await fetch(`${Env.API_ORIGIN}notifications/get/unread`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then(response => response.json())
			console.log(response)
		},
	},

	notificationsMark: {
		name: "Mark Notifications Read/Unread",
		async execute (state: "read" | "unread", notifications: string[]) {
			await fetch(`${Env.API_ORIGIN}notifications/mark/${state}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					notification_ids: notifications,
				}),
			})
		},
	},

} satisfies Record<string, IButtonImplementation<any[]>>
