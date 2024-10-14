/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import type { AuthServices } from "api.fluff4.me"
import EndpointAuthServices from "endpoint/auth/EndpointAuthServices"
import Session from "model/Session"
import Component from "ui/Component"
import Button from "ui/component/Button"
import { BUTTON_REGISTRY, type IButtonImplementation } from "ui/view/debug/ButtonRegistry"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"
import Env from "utility/Env"
import Objects from "utility/Objects"
import popup from "utility/Popup"

const Block = Component.Builder(component => component
	.style("debug-block"))

export default ViewDefinition({
	async create () {
		const view = View("debug")

		const createButton = <ARGS extends any[]> (implementation: IButtonImplementation<ARGS>, ...args: ARGS) => {
			return Button()
				.text.set(implementation.name)
				.event.subscribe("click", async () => {
					try {
						await implementation.execute(...args)
					} catch (err) {
						const error = err as Error
						console.warn(`Button ${implementation.name} failed to execute:`, error)
					}
				})
		}

		const oauthDiv = Block().appendTo(view)

		const OAuthServices = await EndpointAuthServices.query()

		for (const service of Objects.values(OAuthServices.data ?? {} as Partial<AuthServices>)) {
			if (!service) continue

			Button()
				.text.set(`OAuth ${service.name}`)
				.event.subscribe("click", async () => {
					await popup(`OAuth ${service.name}`, service.url_begin, 600, 900)
						.then(() => true).catch(err => { console.warn(err); return false })
					await Session.refresh()
				})
				.appendTo(oauthDiv)

			Button()
				.text.set(`UnOAuth ${service.name}`)
				.event.subscribe("click", async () => {

					const id = Session.Auth.get(service.id)?.id
					if (id === undefined)
						return
					await fetch(`${Env.API_ORIGIN}auth/remove`, {
						method: "POST",
						credentials: "include",
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ id }),
					})
				})
				.appendTo(oauthDiv)
		}

		// document.body.append(createButton(BUTTON_REGISTRY.createAuthor, "test author 1", "hi-im-an-author"));
		oauthDiv.append(createButton(BUTTON_REGISTRY.clearSession))

		const profileButtons = Block().appendTo(view)

		profileButtons.append(createButton({
			name: "Create Profile 1",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("prolific author", "somanystories")
				await BUTTON_REGISTRY.createWork.execute("a debut work", "pretty decent", "debut", "Complete", "Public")
				await BUTTON_REGISTRY.createChapter.execute("somanystories", "debut", "chapter 1", "woo look it's prolific author's first story!", "Public")
				await BUTTON_REGISTRY.createWork.execute("sequel to debut", "wow they wrote a sequel", "sequel", "Ongoing", "Public")
				await BUTTON_REGISTRY.createChapter.execute("somanystories", "sequel", "the chapters", "pretend there's a story here", "Public")
				await BUTTON_REGISTRY.createWork.execute("work in progress", "private test", "wip", "Ongoing", "Private")
				await BUTTON_REGISTRY.createChapter.execute("somanystories", "wip", "draft", "it's a rough draft", "Private")
			},
		}))

		profileButtons.append(createButton({
			name: "View Profile 1",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("author with many stories", "somanystories")
			},
		}))

		profileButtons.append(createButton({
			name: "Create Profile 2",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("single story author", "justonestory")
				await BUTTON_REGISTRY.createWork.execute("one big work", "it's long", "bigstory", "Ongoing", "Public")
				await BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story", "start of a long story", "Public")
				await BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 2", "middle of a long story", "Public")
				await BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 3", "aaaa", "Public")
				await BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 4", "aaaaaaa", "Public")
				await BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 5", "aaaaaaaaaaaaaaaaaaa", "Public")
				await BUTTON_REGISTRY.viewWork.execute("big story five chapters", "justonestory", "bigstory")
				// await BUTTON_REGISTRY.follow.execute("work", "debut");

			},
		}))

		profileButtons.append(createButton({
			name: "View Profile 2",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("justonestory author", "justonestory")
			},
		}))

		profileButtons.append(createButton({
			name: "Create Profile 3",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("prolific follower", "ifollowpeople")
				await BUTTON_REGISTRY.createWork.execute("invalid status", "a test", "uwu", "ShouldNotValidate", "ShouldNotBeValidated")
				// await BUTTON_REGISTRY.follow.execute("author", "somanystories");
				// await BUTTON_REGISTRY.follow.execute("author", "justonestory");
				// await BUTTON_REGISTRY.follow.execute("work", "debut");
				// await BUTTON_REGISTRY.follow.execute("work", "sequel");
				// await BUTTON_REGISTRY.follow.execute("work", "wip");
				// await BUTTON_REGISTRY.follow.execute("work", "bigstory");
			},
		}))

		profileButtons.append(createButton({
			name: "View Profile 3",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("ifollowpeople author", "ifollowpeople")
			},
		}))

		const testButtons = Block().appendTo(view)

		testButtons.append(createButton({
			name: "Test New Following",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("new follows", "thefollower")
				await BUTTON_REGISTRY.createWork.execute("wow a work", "test pls ignore", "wowawork", "Ongoing", "Public")
				await BUTTON_REGISTRY.follow.execute("author", "thefollower")
				await BUTTON_REGISTRY.followWork.execute("thefollower", "wowawork")
				await BUTTON_REGISTRY.getFollow.execute("author", "thefollower")
				await BUTTON_REGISTRY.getAllFollows.execute("work")
				await BUTTON_REGISTRY.getAllFollowsMerged.execute()
				await BUTTON_REGISTRY.unignoreWork.execute("thefollower", "wowawork")
				// await BUTTON_REGISTRY.unfollow.execute("work", "wowawork");
				await BUTTON_REGISTRY.getFollowWork.execute("thefollower", "wowawork")
			},
		}))

		// testButtons.append(createButton({
		// 	name: "Test Following Private Works",
		// 	async execute () {
		// 		await BUTTON_REGISTRY.createWork.execute("private from start", "aaaaaaa", "story1", "Ongoing", "Private");
		// 		await BUTTON_REGISTRY.createChapter.execute("aaaaa", "aaaaaaa", "story1", "Private");
		// 		await BUTTON_REGISTRY.follow.execute("work", "story1");
		// 		await BUTTON_REGISTRY.getFollow.execute("work", "story1");
		// 		await BUTTON_REGISTRY.getAllFollows.execute("work");
		// 		await BUTTON_REGISTRY.getAllFollowsMerged.execute();
		// 	},
		// }));

		// testButtons.append(createButton({
		// 	name: "Test Following Works Made Private",
		// 	async execute () {
		// 		await BUTTON_REGISTRY.createWork.execute("made private later", "bbbbbbbb", "story2", "Ongoing", "Public");
		// 		await BUTTON_REGISTRY.createChapter.execute("bbbbbb", "bbbbbbbb", "story2", "Public");
		// 		await BUTTON_REGISTRY.follow.execute("work", "story2");
		// 		await BUTTON_REGISTRY.getFollow.execute("work", "story2");
		// 		await BUTTON_REGISTRY.getAllFollows.execute("work");
		// 		await BUTTON_REGISTRY.getAllFollowsMerged.execute();
		// 		await BUTTON_REGISTRY.updateWork.execute("story2", undefined, undefined, undefined, undefined, "Private");
		// 		await BUTTON_REGISTRY.viewWork.execute("story2");
		// 		await BUTTON_REGISTRY.getFollow.execute("work", "story2");
		// 		await BUTTON_REGISTRY.getAllFollows.execute("work");
		// 		await BUTTON_REGISTRY.getAllFollowsMerged.execute();

		// 	},
		// }));

		testButtons.append(createButton({
			name: "Create 40 works",
			async execute () {
				for (let i = 0; i < 30; i++) {
					await BUTTON_REGISTRY.createWork.execute(`test story ${i}`, "aaaaaaaaa", `teststory${i}`, "Ongoing", "Public")
				}
				for (let i = 0; i < 30; i++) {
					await BUTTON_REGISTRY.follow.execute("work", `teststory${i}`)
				}

			},
		}))

		testButtons.append(createButton({
			name: "Follows testing",
			async execute () {
				await BUTTON_REGISTRY.getAllFollows.execute("work", 0)
				await BUTTON_REGISTRY.getAllFollows.execute("work", 1)
				await BUTTON_REGISTRY.getAllFollowsMerged.execute(0)
				await BUTTON_REGISTRY.getAllFollowsMerged.execute(1)
			},
		}))

		testButtons.append(createButton({
			name: "Spam Create Follow Work Test",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("spam create works", "manyworks")
				for (let i = 0; i < 100; i++) {
					await BUTTON_REGISTRY.createWork.execute(`rapid story ${i}`, "aaaaaaaaa", `rapidstory${i}`, "Ongoing", "Public")
					await BUTTON_REGISTRY.follow.execute("work", `rapidstory${i}`)
				}
			},
		}))

		testButtons.append(createButton({
			name: "Test Ignore Endpoints",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("ignoring myself", "ignorepls")
				await BUTTON_REGISTRY.createWork.execute("to ignore", "testing ignoring", "worktoignore", "Ongoing", "Public")
				await BUTTON_REGISTRY.ignore.execute("author", "ignorepls")
				await BUTTON_REGISTRY.ignore.execute("work", "worktoignore")
				await BUTTON_REGISTRY.getIgnore.execute("author", "ignorepls")
				await BUTTON_REGISTRY.getIgnore.execute("work", "worktoignore")
				await BUTTON_REGISTRY.getAllIgnores.execute("author")
				await BUTTON_REGISTRY.getAllIgnores.execute("work")
				await BUTTON_REGISTRY.getAllIgnoresMerged.execute()
			},
		}))

		const privRoleButtons = Block().appendTo(view)

		privRoleButtons.append(createButton({
			name: "privileges initial test",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "WorkViewPrivate", "PrivilegeViewAuthor")
				await BUTTON_REGISTRY.privilegeGetAllAuthor.execute("privileges of somanystories", "somanystories")
				await BUTTON_REGISTRY.privilegeRevokeAuthor.execute("somanystories", "WorkViewPrivate")
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RevokePrivilege")
				await BUTTON_REGISTRY.privilegeRevokeAuthor.execute("somanystories", "WorkViewPrivate")
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "ThisPrivilegeDoesntExist")
				await BUTTON_REGISTRY.privilegeGetAllAuthor.execute("privileges of somanystories", "somanystories")
			},
		}))
		privRoleButtons.append(createButton({
			name: "grant privs for testing",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "PrivilegeRevoke", "RoleCreate", "RoleEdit", "RoleDelete", "RoleGrant", "RoleRevoke", "PrivilegeViewAuthor", "RoleViewAll")
				await BUTTON_REGISTRY.createRole.execute("TestingRevoke", "Visible")
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("TestingRevoke", "somanystories")
				await BUTTON_REGISTRY.revokeRoleFromAuthor.execute("TestingRevoke", "somanystories")
				await BUTTON_REGISTRY.privilegeGrantRole.execute("TestingRevoke", "ViewAllRoles")
				await BUTTON_REGISTRY.privilegeRevokeRole.execute("TestingRevoke", "ViewAllRoles")
				await BUTTON_REGISTRY.deleteRole.execute("TestingRevoke")
				await BUTTON_REGISTRY.createRole.execute("SecondAuthorRole", "Visible")
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("SecondAuthorRole", "justonestory")
				await BUTTON_REGISTRY.privilegeGrantRole.execute("SecondAuthorRole", "RoleEdit", "RoleDelete", "RoleCreate")
				// await BUTTON_REGISTRY.privilegeGrantAuthor.execute("justonestory", "ViewPrivateStories");
			},
		}))

		privRoleButtons.append(createButton({
			name: "second author test stuff",
			async execute () {
				await BUTTON_REGISTRY.createRole.execute("DontWork", "Admin")
				await BUTTON_REGISTRY.createRole.execute("DoWork", "SecondAuthorRole")
				await BUTTON_REGISTRY.editRole.execute("Admin", "CantDoThis")
				await BUTTON_REGISTRY.deleteRole.execute("SecondAuthorRole")
			},
		}))

		privRoleButtons.append(createButton({
			name: "see highest level",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleViewAll", "RoleGrant", "RoleCreate")
				await BUTTON_REGISTRY.createRole.execute("NotTopRole", "Admin")
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("NotTopRole", "somanystories")
				await BUTTON_REGISTRY.roleListAll.execute("listing all roles")

			},
		}))

		privRoleButtons.append(createButton({
			name: "role reorder test",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleViewAll", "RoleGrant", "RoleCreate")
				await BUTTON_REGISTRY.createRole.execute("Role1", "Visible", "Admin")
				await BUTTON_REGISTRY.createRole.execute("Role2", "Visible", "Admin")
				await BUTTON_REGISTRY.createRole.execute("Role3", "Hidden", "Admin")
				await BUTTON_REGISTRY.createRole.execute("Role4", "Hidden", "Admin")
				await BUTTON_REGISTRY.roleReorder.execute("Role1", "Role2", "Role3", "Role4")
			},
		}))


		const moreRoleButtons = Block().appendTo(view)

		moreRoleButtons.append(createButton({
			name: "admin list roles test (profile 1)",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleGrant", "RoleCreate")
				await BUTTON_REGISTRY.createRole.execute("Role4", "Hidden", "Admin")
				await BUTTON_REGISTRY.createRole.execute("Role3", "Visible", "Admin")
				await BUTTON_REGISTRY.createRole.execute("Role2", "Hidden", "Admin")
				await BUTTON_REGISTRY.createRole.execute("Role1", "Visible", "Admin")
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("Role2", "justonestory")
				await BUTTON_REGISTRY.roleListAll.execute("all roles admin")
			},
		}))

		moreRoleButtons.append(createButton({
			name: "user list roles test (profile 2)",
			async execute () {
				await BUTTON_REGISTRY.roleListAll.execute("all roles user")
			},
		}))

		moreRoleButtons.append(createButton({
			name: "Delete Author Test",
			async execute () {
				await BUTTON_REGISTRY.deleteAuthor.execute()
			},
		}))

		const commentsButton = Block().appendTo(view)

		commentsButton.append(createButton({
			name: "Author 2 lots of comments",
			async execute () {
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comments 1")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "2", "base comments 2")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "3", "base comments 3")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "4", "base comments 4")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "5", "base comments 5")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment", "6")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 2", "6")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 3", "11")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 4", "12")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comment index 1")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 6", "13")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 7", "11")
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comment index 1 again")
			},
		}))

		commentsButton.append(createButton({
			name: "Author 1 single comment ping",
			async execute () {
				await BUTTON_REGISTRY.createCommentChapter.execute("debut", "1", "wow you write so many stories @somanystories how do you do it")
				await BUTTON_REGISTRY.createCommentChapter.execute("debut", "1", "@somanystories you're so @somanystories amazing")
				await BUTTON_REGISTRY.getComment.execute("4")
				await BUTTON_REGISTRY.getComment.execute("5")
				await BUTTON_REGISTRY.updateCommentChapter.execute("4", "okay done fawning over @somanystories now")
				await BUTTON_REGISTRY.getComment.execute("4")
				await BUTTON_REGISTRY.deleteCommentChapter.execute("5")
				await BUTTON_REGISTRY.getComment.execute("5")
			},
		}))

		commentsButton.append(createButton({
			name: "try to delete author 1's comment",
			async execute () {
				await BUTTON_REGISTRY.deleteCommentChapter.execute("4")
				await BUTTON_REGISTRY.getComment.execute("4")
			},
		}))

		const patreonButtons = Block().appendTo(view)

		Button()
			.text.set("Campaign Test")
			.event.subscribe("click", async () => {
				await popup("Campaign OAuth", `${Env.API_ORIGIN}auth/patreon/campaign/begin`, 600, 900)
					.then(() => true).catch(err => { console.warn(err); return false })
				await Session.refresh()
			})
			.appendTo(patreonButtons)

		patreonButtons.append(createButton({
			name: "create patreon author",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("has a campaign", "patreonuser")
				await BUTTON_REGISTRY.createWork.execute("patreon only story", "test", "exclusive", "Ongoing", "Public")
				await BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 1", "hewwo", "Private")
				await BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 2", "hewwoo", "Private")
				await BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 3", "hewwooo", "Private")
				await BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 4", "hewwooo", "Private")
				await BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 5", "hewwooo", "Private")
			},
		}))

		patreonButtons.append(createButton({
			name: "get patreon tiers",
			async execute () {
				await BUTTON_REGISTRY.patreonGetTiers.execute("patreon tiers")
			},
		}))

		patreonButtons.append(createButton({
			name: "set patreon chapters",
			async execute () {
				await BUTTON_REGISTRY.updateChapter.execute("patreonuser", "exclusive", 1, undefined, undefined, "Public")
				await BUTTON_REGISTRY.patreonSetThresholds.execute("patreonuser", "exclusive", "Public", ["2", "3"])
				await BUTTON_REGISTRY.patreonSetThresholds.execute("patreonuser", "exclusive", "Patreon", ["4", "5"], "4392761")
			},
		}))

		Button()
			.text.set("Patron Test")
			.event.subscribe("click", async () => {
				await popup("Patron OAuth", `${Env.API_ORIGIN}auth/patreon/patron/begin`, 600, 900)
					.then(() => true).catch(err => { console.warn(err); return false })
				await Session.refresh()
			})
			.appendTo(patreonButtons)

		patreonButtons.append(createButton({
			name: "get patreon-only chapters",
			async execute () {
				await BUTTON_REGISTRY.viewChapter.execute("public:", "patreonuser", "exclusive", "3")
				await BUTTON_REGISTRY.viewChapter.execute("patreon:", "patreonuser", "exclusive", "4")
			},
		}))

		patreonButtons.append(createButton({
			name: "update patreon-only chapters",
			async execute () {
				await BUTTON_REGISTRY.patreonSetThresholds.execute("patreonuser", "exclusive", "Public", ["4"])
			},
		}))

		return view
	},
})
