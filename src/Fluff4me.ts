/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { BUTTON_REGISTRY, type IButtonImplementation } from "dev/ButtonRegistry";
import UiEventBus from "ui/UiEventBus";
import Env from "utility/Env";
import popup from "utility/Popup";
import Session from "utility/Session";

if (location.pathname.startsWith("/auth/")) {
	if (location.pathname.endsWith("/error")) {
		const params = new URLSearchParams(location.search);
		debugger;
		localStorage.setItem("Popup-Error-Code", params.get("code") ?? "500");
		localStorage.setItem("Popup-Error-Message", params.get("message") ?? "Internal Server Error");
	}
	window.close();
}

void screen?.orientation?.lock?.("portrait-primary").catch(() => { });

export default class Fluff4me {

	public constructor () {
		void this.main();
	}

	private async main () {

		UiEventBus.subscribe("keydown", event => {
			if (event.use("F6"))
				for (const stylesheet of document.querySelectorAll("link[rel=stylesheet]")) {
					const href = stylesheet.getAttribute("href")!;
					const newHref = `${href.slice(0, Math.max(0, href.indexOf("?")) || Infinity)}?${Math.random().toString().slice(2)}`;
					stylesheet.setAttribute("href", newHref);
				}

			if (event.use("F4"))
				document.documentElement.classList.add("persist-tooltips");
		});
		UiEventBus.subscribe("keyup", event => {
			if (event.use("F4"))
				document.documentElement.classList.remove("persist-tooltips");
		});

		await Env.load();

		// const path = URL.path ?? URL.hash;
		// if (path === AuthView.id) {
		// 	URL.hash = null;
		// 	URL.path = null;
		// }

		// ViewManager.showByHash(URL.path ?? URL.hash);

		await Session.refresh();

		const createButton = <ARGS extends any[]> (implementation: IButtonImplementation<ARGS>, ...args: ARGS) => {
			const button = document.createElement("button");
			button.textContent = implementation.name;
			button.addEventListener("click", async () => {
				try {
					await implementation.execute(...args);
				} catch (err) {
					const error = err as Error;
					console.warn(`Button ${implementation.name} failed to execute:`, error);
				}
			});
			return button;
		};

		const oauthDiv = document.createElement("div");
		document.body.append(oauthDiv);

		const OAuthServices = await fetch(`${Env.API_ORIGIN}auth/services`, {})
			.then(response => response.json());

		for (const service of Object.values(OAuthServices.data) as any[]) {
			const oauthButton = document.createElement("button");
			oauthButton.textContent = `OAuth ${service.name}`;
			oauthDiv.append(oauthButton);
			oauthButton.addEventListener("click", async () => {
				await popup(service.url_begin, 600, 900)
					.then(() => true).catch(err => { console.warn(err); return false; });
				await Session.refresh();
			});

			const unoauthbutton = document.createElement("button");
			unoauthbutton.textContent = `UnOAuth ${service.name}`;
			oauthDiv.append(unoauthbutton);
			unoauthbutton.addEventListener("click", async () => {
				const id = Session.getAuthServices()[service.id]?.[0]?.id;
				if (id === undefined)
					return;
				await fetch(`${Env.API_ORIGIN}auth/remove`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id }),
				});
			});
		}

		// document.body.append(createButton(BUTTON_REGISTRY.createAuthor, "test author 1", "hi-im-an-author"));
		oauthDiv.append(createButton(BUTTON_REGISTRY.clearSession));

		const profileButtons = document.createElement("div");
		document.body.append(profileButtons);

		profileButtons.append(createButton({
			name: "Create Profile 1",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("prolific author", "somanystories");
				await BUTTON_REGISTRY.createWork.execute("a debut work", "pretty decent", "debut", "Complete", "Public");
				await BUTTON_REGISTRY.createChapter.execute("chapter 1", "woo look it's prolific author's first story!", "debut", "Public");
				await BUTTON_REGISTRY.createWork.execute("sequel to debut", "wow they wrote a sequel", "sequel", "Ongoing", "Public");
				await BUTTON_REGISTRY.createChapter.execute("the chapters", "pretend there's a story here", "sequel", "Public");
				await BUTTON_REGISTRY.createWork.execute("work in progress", "private test", "wip", "Ongoing", "Private");
				await BUTTON_REGISTRY.createChapter.execute("draft", "it's a rough draft", "wip", "Private");
			},
		}));

		profileButtons.append(createButton({
			name: "View Profile 1",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("author with many stories", "somanystories");
			},
		}));

		profileButtons.append(createButton({
			name: "Create Profile 2",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("single story author", "justonestory");
				await BUTTON_REGISTRY.createWork.execute("one big work", "it's long", "bigstory", "Ongoing", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story", "start of a long story", "bigstory", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story 2", "middle of a long story", "bigstory", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story 3", "aaaa", "bigstory", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story 4", "aaaaaaa", "bigstory", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story 5", "aaaaaaaaaaaaaaaaaaa", "bigstory", "Public");
				await BUTTON_REGISTRY.viewWork.execute("big story five chapters", "bigstory");
				// await BUTTON_REGISTRY.follow.execute("work", "debut");

			},
		}));

		profileButtons.append(createButton({
			name: "View Profile 2",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("justonestory author", "justonestory");
			},
		}));

		profileButtons.append(createButton({
			name: "Create Profile 3",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("prolific follower", "ifollowpeople");
				await BUTTON_REGISTRY.createWork.execute("invalid status", "a test", "uwu", "ShouldNotValidate", "ShouldNotBeValidated");
				// await BUTTON_REGISTRY.follow.execute("author", "somanystories");
				// await BUTTON_REGISTRY.follow.execute("author", "justonestory");
				// await BUTTON_REGISTRY.follow.execute("work", "debut");
				// await BUTTON_REGISTRY.follow.execute("work", "sequel");
				// await BUTTON_REGISTRY.follow.execute("work", "wip");
				// await BUTTON_REGISTRY.follow.execute("work", "bigstory");
			},
		}));

		profileButtons.append(createButton({
			name: "View Profile 3",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("ifollowpeople author", "ifollowpeople");
			},
		}));

		const testButtons = document.createElement("div");
		document.body.append(testButtons);

		testButtons.append(createButton({
			name: "Test New Following",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("new follows", "thefollower");
				await BUTTON_REGISTRY.createWork.execute("wow a work", "test pls ignore", "wowawork", "Ongoing", "Public");
				await BUTTON_REGISTRY.follow.execute("author", "thefollower");
				await BUTTON_REGISTRY.follow.execute("work", "wowawork");
				await BUTTON_REGISTRY.getFollow.execute("author", "thefollower");
				await BUTTON_REGISTRY.getAllFollows.execute("work");
				await BUTTON_REGISTRY.getAllFollowsMerged.execute();
				await BUTTON_REGISTRY.unignore.execute("work", "wowawork");
				// await BUTTON_REGISTRY.unfollow.execute("work", "wowawork");
				await BUTTON_REGISTRY.getFollow.execute("work", "wowawork");
			},
		}));

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
					await BUTTON_REGISTRY.createWork.execute(`test story ${i}`, "aaaaaaaaa", `teststory${i}`, "Ongoing", "Public");
				}
				for (let i = 0; i < 30; i++) {
					await BUTTON_REGISTRY.follow.execute("work", `teststory${i}`);
				}

			},
		}));

		testButtons.append(createButton({
			name: "Follows testing",
			async execute () {
				await BUTTON_REGISTRY.getAllFollows.execute("work", 0);
				await BUTTON_REGISTRY.getAllFollows.execute("work", 1);
				await BUTTON_REGISTRY.getAllFollowsMerged.execute(0);
				await BUTTON_REGISTRY.getAllFollowsMerged.execute(1);
			},
		}));

		testButtons.append(createButton({
			name: "Spam Create Follow Work Test",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("spam create works", "manyworks");
				for (let i = 0; i < 100; i++) {
					await BUTTON_REGISTRY.createWork.execute(`rapid story ${i}`, "aaaaaaaaa", `rapidstory${i}`, "Ongoing", "Public");
					await BUTTON_REGISTRY.follow.execute("work", `rapidstory${i}`);
				}
			},
		}));

		testButtons.append(createButton({
			name: "Test Ignore Endpoints",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("ignoring myself", "ignorepls");
				await BUTTON_REGISTRY.createWork.execute("to ignore", "testing ignoring", "worktoignore", "Ongoing", "Public");
				await BUTTON_REGISTRY.ignore.execute("author", "ignorepls");
				await BUTTON_REGISTRY.ignore.execute("work", "worktoignore");
				await BUTTON_REGISTRY.getIgnore.execute("author", "ignorepls");
				await BUTTON_REGISTRY.getIgnore.execute("work", "worktoignore");
				await BUTTON_REGISTRY.getAllIgnores.execute("author");
				await BUTTON_REGISTRY.getAllIgnores.execute("work");
				await BUTTON_REGISTRY.getAllIgnoresMerged.execute();
			},
		}));

		const privRoleButtons = document.createElement("div");
		document.body.append(privRoleButtons);

		privRoleButtons.append(createButton({
			name: "privileges initial test",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "WorkViewPrivate", "PrivilegeViewAuthor");
				await BUTTON_REGISTRY.privilegeGetAllAuthor.execute("privileges of somanystories", "somanystories");
				await BUTTON_REGISTRY.privilegeRevokeAuthor.execute("somanystories", "WorkViewPrivate");
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RevokePrivilege");
				await BUTTON_REGISTRY.privilegeRevokeAuthor.execute("somanystories", "WorkViewPrivate");
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "ThisPrivilegeDoesntExist");
				await BUTTON_REGISTRY.privilegeGetAllAuthor.execute("privileges of somanystories", "somanystories");
			},
		}));
		privRoleButtons.append(createButton({
			name: "grant privs for testing",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "PrivilegeRevoke", "RoleCreate", "RoleEdit", "RoleDelete", "RoleGrant", "RoleRevoke", "PrivilegeViewAuthor", "RoleViewAll");
				await BUTTON_REGISTRY.createRole.execute("TestingRevoke", "Visible");
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("TestingRevoke", "somanystories");
				await BUTTON_REGISTRY.revokeRoleFromAuthor.execute("TestingRevoke", "somanystories");
				await BUTTON_REGISTRY.privilegeGrantRole.execute("TestingRevoke", "ViewAllRoles");
				await BUTTON_REGISTRY.privilegeRevokeRole.execute("TestingRevoke", "ViewAllRoles");
				await BUTTON_REGISTRY.deleteRole.execute("TestingRevoke");
				await BUTTON_REGISTRY.createRole.execute("SecondAuthorRole", "Visible");
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("SecondAuthorRole", "justonestory");
				await BUTTON_REGISTRY.privilegeGrantRole.execute("SecondAuthorRole", "RoleEdit", "RoleDelete", "RoleCreate");
				// await BUTTON_REGISTRY.privilegeGrantAuthor.execute("justonestory", "ViewPrivateStories");
			},
		}));

		privRoleButtons.append(createButton({
			name: "second author test stuff",
			async execute () {
				await BUTTON_REGISTRY.createRole.execute("DontWork", "Admin");
				await BUTTON_REGISTRY.createRole.execute("DoWork", "SecondAuthorRole");
				await BUTTON_REGISTRY.editRole.execute("Admin", "CantDoThis");
				await BUTTON_REGISTRY.deleteRole.execute("SecondAuthorRole");
			},
		}));

		privRoleButtons.append(createButton({
			name: "see highest level",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleViewAll", "RoleGrant", "RoleCreate");
				await BUTTON_REGISTRY.createRole.execute("NotTopRole", "Admin");
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("NotTopRole", "somanystories");
				await BUTTON_REGISTRY.roleListAll.execute("listing all roles");

			},
		}));

		privRoleButtons.append(createButton({
			name: "role reorder test",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleViewAll", "RoleGrant", "RoleCreate");
				await BUTTON_REGISTRY.createRole.execute("Role1", "Visible", "Admin");
				await BUTTON_REGISTRY.createRole.execute("Role2", "Visible", "Admin");
				await BUTTON_REGISTRY.createRole.execute("Role3", "Hidden", "Admin");
				await BUTTON_REGISTRY.createRole.execute("Role4", "Hidden", "Admin");
				await BUTTON_REGISTRY.roleReorder.execute("Role1", "Role2", "Role3", "Role4");
			},
		}));


		const moreRoleButtons = document.createElement("div");
		document.body.append(moreRoleButtons);

		moreRoleButtons.append(createButton({
			name: "admin list roles test (profile 1)",
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleGrant", "RoleCreate");
				await BUTTON_REGISTRY.createRole.execute("Role4", "Hidden", "Admin");
				await BUTTON_REGISTRY.createRole.execute("Role3", "Visible", "Admin");
				await BUTTON_REGISTRY.createRole.execute("Role2", "Hidden", "Admin");
				await BUTTON_REGISTRY.createRole.execute("Role1", "Visible", "Admin");
				await BUTTON_REGISTRY.grantRoleToAuthor.execute("Role2", "justonestory");
				await BUTTON_REGISTRY.roleListAll.execute("all roles admin");
			},
		}));

		moreRoleButtons.append(createButton({
			name: "user list roles test (profile 2)",
			async execute () {
				await BUTTON_REGISTRY.roleListAll.execute("all roles user");
			},
		}));

		moreRoleButtons.append(createButton({
			name: "Delete Author Test",
			async execute () {
				await BUTTON_REGISTRY.deleteAuthor.execute();
			},
		}));

		const commentsButton = document.createElement("div");
		document.body.append(commentsButton);

		commentsButton.append(createButton({
			name: "Author 2 lots of comments",
			async execute () {
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comments 1");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "2", "base comments 2");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "3", "base comments 3");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "4", "base comments 4");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "5", "base comments 5");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment", "6");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 2", "6");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 3", "11");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 4", "12");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comment index 1");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 6", "13");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 7", "11");
				await BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comment index 1 again");
			},
		}));

		commentsButton.append(createButton({
			name: "Author 1 single comment ping",
			async execute () {
				await BUTTON_REGISTRY.createCommentChapter.execute("debut", "1", "wow you write so many stories @somanystories how do you do it");
				await BUTTON_REGISTRY.createCommentChapter.execute("debut", "1", "@somanystories you're so @somanystories amazing");
				await BUTTON_REGISTRY.getComment.execute("4");
				await BUTTON_REGISTRY.getComment.execute("5");
				await BUTTON_REGISTRY.updateCommentChapter.execute("4", "okay done fawning over @somanystories now");
				await BUTTON_REGISTRY.getComment.execute("4");
				await BUTTON_REGISTRY.deleteCommentChapter.execute("5");
				await BUTTON_REGISTRY.getComment.execute("5");
			},
		}));

		commentsButton.append(createButton({
			name: "try to delete author 1's comment",
			async execute () {
				await BUTTON_REGISTRY.deleteCommentChapter.execute("4");
				await BUTTON_REGISTRY.getComment.execute("4");
			},
		}));

		const patreonButtons = document.createElement("div");
		document.body.append(patreonButtons);

		const campaignButtonTest = document.createElement("button");
		campaignButtonTest.textContent = "Campaign Test";
		patreonButtons.append(campaignButtonTest);
		patreonButtons.addEventListener("click", async () => {
			await popup(`${Env.API_ORIGIN}auth/patreon/campaign/begin`, 600, 900)
				.then(() => true).catch(err => { console.warn(err); return false; });
			await Session.refresh();
		});

	}
}


