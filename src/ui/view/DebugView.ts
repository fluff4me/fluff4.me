import type { AuthServices } from 'api.fluff4.me'
import EndpointAuthServices from 'endpoint/auth/EndpointAuthServices'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import { BUTTON_REGISTRY, type IButtonImplementation } from 'ui/view/debug/ButtonRegistry'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Env from 'utility/Env'
import Objects from 'utility/Objects'
import popup from 'utility/Popup'

const Block = Component.Builder(component => component
	.style('debug-block'))

export default ViewDefinition({
	async create () {
		const view = View('debug')

		const createButton = <ARGS extends any[]> (implementation: IButtonImplementation<ARGS>, ...args: ARGS) => {
			return Button()
				.text.set(implementation.name)
				.event.subscribe('click', async () => {
					try {
						await implementation.execute(...args)
					}
					catch (err) {
						const error = err as Error
						console.warn(`Button ${implementation.name} failed to execute:`, error)
					}
				})
		}

		const oauthDiv = Block().appendTo(view.content)

		const OAuthServices = await EndpointAuthServices.query()

		for (const service of Objects.values(OAuthServices.data ?? {} as Partial<AuthServices>)) {
			if (!service) continue

			Button()
				.text.set(`OAuth ${service.name}`)
				.event.subscribe('click', async () => {
					await popup(`OAuth ${service.name}`, service.url_begin, 600, 900)
						.then(() => true).catch(err => { console.warn(err); return false })
					await Session.refresh()
				})
				.appendTo(oauthDiv)

			Button()
				.text.set(`UnOAuth ${service.name}`)
				.event.subscribe('click', async () => {
					const id = Session.Auth.get(service.id)?.id
					if (id === undefined)
						return
					await fetch(`${Env.API_ORIGIN}auth/remove`, {
						method: 'POST',
						credentials: 'include',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ id }),
					})
				})
				.appendTo(oauthDiv)
		}

		// document.body.append(createButton(BUTTON_REGISTRY.createAuthor, "test author 1", "hi-im-an-author"));
		oauthDiv.append(createButton(BUTTON_REGISTRY.clearSession))

		const profileButtons = Block().appendTo(view.content)

		profileButtons.append(createButton({
			name: 'Seed Bulk Data',
			async execute () {
				await BUTTON_REGISTRY.seedBulk.execute()
			},
		}))

		profileButtons.append(createButton({
			name: 'Create Profile 1',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('prolific author', 'somanystories', 'wow a description that mentions <mention vanity="somanystories">', 'she/her pronies m8')
				await BUTTON_REGISTRY.createWork.execute('a debut work', 'pretty decent by <mention vanity="somanystories">', 'short description', 'debut', 'Complete', 'Public')
				await BUTTON_REGISTRY.createChapter.execute('somanystories', 'debut', 'chapter 1', 'woo look it\'s prolific author\'s first story!', 'Public')
				await BUTTON_REGISTRY.createWork.execute('sequel to debut', 'wow they wrote a sequel', 'sequel short description', 'sequel', 'Ongoing', 'Public')
				await BUTTON_REGISTRY.createChapter.execute('somanystories', 'sequel', 'the chapters', 'pretend there\'s a story here', 'Public')
				await BUTTON_REGISTRY.createWork.execute('work in progress', 'test', 'short description test', 'wip', 'Ongoing', 'Private')
				await BUTTON_REGISTRY.createChapter.execute('somanystories', 'wip', 'draft', 'it\'s a rough draft', 'Private')
				await BUTTON_REGISTRY.viewWork.execute('work', 'somanystories', 'debut')
				await BUTTON_REGISTRY.viewWork.execute('work', 'somanystories', 'sequel')
				await BUTTON_REGISTRY.viewWork.execute('work', 'somanystories', 'wip')
				await BUTTON_REGISTRY.getAllWorksByAuthor.execute('all works', 'somanystories')
			},
		}))

		profileButtons.append(createButton({
			name: 'View Profile 1',
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute('author with many stories', 'somanystories')
				await BUTTON_REGISTRY.getAllWorksByAuthor.execute('all works', 'somanystories')
			},
		}))

		profileButtons.append(createButton({
			name: 'Create Profile 2',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('single story author', 'justonestory', '<mention vanity="somanystories"> writes so much')
				await BUTTON_REGISTRY.createWork.execute('one big work', 'made by <mention vanity="justonestory">', 'wow description', 'bigstory', 'Ongoing', 'Public', ['Protagonist: Transgender', 'Genre: Fantasy', 'Genre: Romance', 'Setting: Urban Fantasy'], ['just a test work lmao', 'gotta add some custom tags'])
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 1', 'start of a long story', 'Public')
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story interlude', 'middle of a long story', 'Public', false, 'only notes before')
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 2', 'aaaa', 'Public', true, undefined, 'only notes after')
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3', 'aaaaaaa', 'Public', true, 'both notes before', 'and notes after')
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3.1', 'aaaaaaaaaaaaaaaaaaa', 'Public', false)
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3.2', 'aaaaaaaaaaaaaaaaaaa', 'Private', false)
				await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3.3', 'aaaaaaaaaaaaaaaaaaa', 'Public')
				for (let i = 4; i < 50; i++) {
					await BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', `big story ${i}`, 'aaaaaaaaaaaaaaaaaaa', 'Public')
				}
				await BUTTON_REGISTRY.updateChapter.execute('justonestory', 'bigstory', 4, undefined, undefined, undefined, false)
				await BUTTON_REGISTRY.viewChapter.execute('', 'justonestory', 'bigstory', 1)
				await BUTTON_REGISTRY.viewWork.execute('big story five chapters', 'justonestory', 'bigstory')
				await BUTTON_REGISTRY.getAllChapters.execute('justonestory', 'bigstory', 0)
				await BUTTON_REGISTRY.viewChapterPaginated.execute('0', 'justonestory', 'bigstory', 0)
				await BUTTON_REGISTRY.viewChapterPaginated.execute('4 (3.1)', 'justonestory', 'bigstory', 4)
				await BUTTON_REGISTRY.viewChapterPaginated.execute('6 (private)', 'justonestory', 'bigstory', 6)
				// await BUTTON_REGISTRY.follow.execute("work", "debut");
			},
		}))

		profileButtons.append(createButton({
			name: 'View Profile 2',
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute('justonestory author', 'justonestory')
			},
		}))

		profileButtons.append(createButton({
			name: 'View Profile 2\'s stories',
			async execute () {
				await BUTTON_REGISTRY.viewChapter.execute('', 'justonestory', 'bigstory', 1)
				await BUTTON_REGISTRY.viewWork.execute('big story five chapters', 'justonestory', 'bigstory')
				await BUTTON_REGISTRY.getAllChapters.execute('justonestory', 'bigstory', 0)
				await BUTTON_REGISTRY.viewChapterPaginated.execute('0', 'justonestory', 'bigstory', 0)
				await BUTTON_REGISTRY.viewChapterPaginated.execute('4 (3.1)', 'justonestory', 'bigstory', 4)
				await BUTTON_REGISTRY.viewChapterPaginated.execute('6 (private)', 'justonestory', 'bigstory', 6)
			},
		}))

		// profileButtons.append(createButton({
		// 	name: "Set Chiri Patreon chapters",
		// 	async execute () {
		// 		await BUTTON_REGISTRY.patreonSetThresholds.execute("justonestory", "bigstory", "Patreon", ["8", "9"], "4392761")
		// 	},
		// }))

		const followButtons = Block().appendTo(view.content)

		followButtons.append(createButton({
			name: 'Test New Following',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('new follows', 'thefollower')
				await BUTTON_REGISTRY.createWork.execute('wow a work', 'test pls ignore', 'pls ignore', 'wowawork', 'Ongoing', 'Public')
				await BUTTON_REGISTRY.getAllFollows.execute('work')
				await BUTTON_REGISTRY.getAllFollows.execute('work')
				await BUTTON_REGISTRY.follow.execute('author', 'thefollower')
				await BUTTON_REGISTRY.followWork.execute('thefollower', 'wowawork')
				await BUTTON_REGISTRY.getFollow.execute('author', 'thefollower')
				await BUTTON_REGISTRY.getFollow.execute('author', 'thefollower')
				await BUTTON_REGISTRY.getAllFollows.execute('work')
				await BUTTON_REGISTRY.getAllFollows.execute('work')
				await BUTTON_REGISTRY.getAllFollowsMerged.execute()
				await BUTTON_REGISTRY.getAllFollowsMerged.execute()
				await BUTTON_REGISTRY.unignoreWork.execute('thefollower', 'wowawork')
				// await BUTTON_REGISTRY.unfollow.execute("work", "wowawork");
				await BUTTON_REGISTRY.getFollowWork.execute('thefollower', 'wowawork')
			},
		}))

		followButtons.append(createButton({
			name: 'Create a work with loads of chapters',
			async execute () {
				await BUTTON_REGISTRY.createWork.execute('even longer story', 'aaaaaaaaa', 'short description aaaaa', 'wowbig', 'Ongoing', 'Public')
				for (let i = 0; i < 2000; i++) {
					await BUTTON_REGISTRY.createChapter.execute('justonestory', 'wowbig', `chapter ${i}`, `wow chapter body ${i}`, 'Public')
				}
			},
		}))

		followButtons.append(createButton({
			name: 'Follows testing',
			async execute () {
				await BUTTON_REGISTRY.getAllFollows.execute('work', 0)
				await BUTTON_REGISTRY.getAllFollows.execute('work', 1)
				await BUTTON_REGISTRY.getAllFollowsMerged.execute(0)
				await BUTTON_REGISTRY.getAllFollowsMerged.execute(1)
			},
		}))

		followButtons.append(createButton({
			name: 'Spam Create Follow Work Test',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('spam create works', 'manyworks')
				for (let i = 0; i < 100; i++) {
					await BUTTON_REGISTRY.createWork.execute(`rapid story ${i}`, 'aaaaaaaaa', 'rapid story aaaaa', `rapidstory${i}`, 'Ongoing', 'Public')
					await BUTTON_REGISTRY.follow.execute('work', `rapidstory${i}`)
				}
			},
		}))

		followButtons.append(createButton({
			name: 'Test Ignore Endpoints',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('ignoring myself', 'ignorepls')
				await BUTTON_REGISTRY.createWork.execute('to ignore', 'testing ignoring', 'test ignoring', 'worktoignore', 'Ongoing', 'Public')
				await BUTTON_REGISTRY.ignore.execute('author', 'ignorepls')
				await BUTTON_REGISTRY.ignore.execute('work', 'worktoignore')
				await BUTTON_REGISTRY.getIgnore.execute('author', 'ignorepls')
				await BUTTON_REGISTRY.getIgnore.execute('author', 'ignorepls')
				await BUTTON_REGISTRY.getIgnore.execute('work', 'worktoignore')
				await BUTTON_REGISTRY.getIgnore.execute('work', 'worktoignore')
				await BUTTON_REGISTRY.getAllIgnores.execute('author')
				await BUTTON_REGISTRY.getAllIgnores.execute('author')
				await BUTTON_REGISTRY.getAllIgnores.execute('work')
				await BUTTON_REGISTRY.getAllIgnoresMerged.execute()
				await BUTTON_REGISTRY.getAllIgnoresMerged.execute()
			},
		}))

		const privRoleButtons = Block().appendTo(view.content)

		privRoleButtons.append(createButton({
			name: 'privileges initial test',
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'WorkViewPrivate', 'PrivilegeViewAuthor')
				await BUTTON_REGISTRY.privilegeGetAllAuthor.execute('privileges of somanystories', 'somanystories')
				await BUTTON_REGISTRY.privilegeRevokeAuthor.execute('somanystories', 'WorkViewPrivate')
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RevokePrivilege')
				await BUTTON_REGISTRY.privilegeRevokeAuthor.execute('somanystories', 'WorkViewPrivate')
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'ThisPrivilegeDoesntExist')
				await BUTTON_REGISTRY.privilegeGetAllAuthor.execute('privileges of somanystories', 'somanystories')
			},
		}))
		privRoleButtons.append(createButton({
			name: 'grant privs for testing',
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'PrivilegeRevoke', 'RoleCreate', 'RoleEdit', 'RoleDelete', 'RoleGrant', 'RoleRevoke', 'PrivilegeViewAuthor', 'RoleViewAll')
				await BUTTON_REGISTRY.createRole.execute('TestingRevoke', 'Visible')
				await BUTTON_REGISTRY.grantRoleToAuthor.execute('TestingRevoke', 'somanystories')
				await BUTTON_REGISTRY.revokeRoleFromAuthor.execute('TestingRevoke', 'somanystories')
				await BUTTON_REGISTRY.privilegeGrantRole.execute('TestingRevoke', 'ViewAllRoles')
				await BUTTON_REGISTRY.privilegeRevokeRole.execute('TestingRevoke', 'ViewAllRoles')
				await BUTTON_REGISTRY.deleteRole.execute('TestingRevoke')
				await BUTTON_REGISTRY.createRole.execute('SecondAuthorRole', 'Visible')
				await BUTTON_REGISTRY.grantRoleToAuthor.execute('SecondAuthorRole', 'justonestory')
				await BUTTON_REGISTRY.privilegeGrantRole.execute('SecondAuthorRole', 'RoleEdit', 'RoleDelete', 'RoleCreate')
				// await BUTTON_REGISTRY.privilegeGrantAuthor.execute("justonestory", "ViewPrivateStories");
			},
		}))

		privRoleButtons.append(createButton({
			name: 'second author test stuff',
			async execute () {
				await BUTTON_REGISTRY.createRole.execute('DontWork', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('DoWork', 'SecondAuthorRole')
				await BUTTON_REGISTRY.editRole.execute('Admin', 'CantDoThis')
				await BUTTON_REGISTRY.deleteRole.execute('SecondAuthorRole')
			},
		}))

		privRoleButtons.append(createButton({
			name: 'see highest level',
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RoleViewAll', 'RoleGrant', 'RoleCreate')
				await BUTTON_REGISTRY.createRole.execute('NotTopRole', 'Admin')
				await BUTTON_REGISTRY.grantRoleToAuthor.execute('NotTopRole', 'somanystories')
				await BUTTON_REGISTRY.roleListAll.execute('listing all roles')
				await BUTTON_REGISTRY.roleListAll.execute('listing all roles')
			},
		}))

		privRoleButtons.append(createButton({
			name: 'role reorder test',
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RoleViewAll', 'RoleGrant', 'RoleCreate')
				await BUTTON_REGISTRY.createRole.execute('Role1', 'Visible', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('Role2', 'Visible', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('Role3', 'Hidden', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('Role4', 'Hidden', 'Admin')
				await BUTTON_REGISTRY.roleReorder.execute('Role1', 'Role2', 'Role3', 'Role4')
			},
		}))

		const moreRoleButtons = Block().appendTo(view.content)

		moreRoleButtons.append(createButton({
			name: 'Make ten billion works',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('lots of works test', 'manyworks', 'test description')
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('manyworks', 'TagGlobalCreate', 'TagGlobalDelete', 'TagGlobalUpdate', 'TagCategoryCreate', 'TagCategoryUpdate', 'TagCategoryDelete', 'TagPromote', 'TagDemote')
				await BUTTON_REGISTRY.tagCreateCategory.execute('Category One', 'the first test category')
				await BUTTON_REGISTRY.tagCreateCategory.execute('Category Two', 'the second test category')
				await BUTTON_REGISTRY.tagCreateCategory.execute('Category Three', 'the third test category')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag One', 'test tag 1', 'Category One')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Two', 'test tag 1', 'Category Two')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Three', 'test tag 1', 'Category Three')
				for (let a = 0; a < 333; a++) {
					await BUTTON_REGISTRY.createWork.execute(`work${a}`,
						`description no ${a} mentions <mention vanity="manyworks">\n"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."`,
						'Lorem ipsum dolor sit amet, consectetur adipiscing elit,',
						`testwork${a}`,
						'Ongoing',
						'Public',
						['Category One: Tag One', 'Category Two: Tag Two', 'Category Three: Tag Three'],
						['custom tag one', `custom tag two ${a}`])
				}
				for (let a = 0; a < 333; a++) {
					await BUTTON_REGISTRY.createChapter.execute('manyworks',
						`testwork${a}`,
						`chapter ${a}`,
						`it's a test chapter ${a}`,
						'Public')
				}
			},
		}))

		moreRoleButtons.append(createButton({
			name: 'view ten billion works',
			async execute () {
				await BUTTON_REGISTRY.getAllWorksByAuthor.execute('many works', 'manyworks')
			},
		}))

		moreRoleButtons.append(createButton({
			name: 'admin list roles test (profile 1)',
			async execute () {
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RoleGrant', 'RoleCreate')
				await BUTTON_REGISTRY.createRole.execute('Role4', 'Hidden', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('Role3', 'Visible', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('Role2', 'Hidden', 'Admin')
				await BUTTON_REGISTRY.createRole.execute('Role1', 'Visible', 'Admin')
				await BUTTON_REGISTRY.grantRoleToAuthor.execute('Role2', 'justonestory')
				await BUTTON_REGISTRY.roleListAll.execute('all roles admin')
			},
		}))

		moreRoleButtons.append(createButton({
			name: 'user list roles test (profile 2)',
			async execute () {
				await BUTTON_REGISTRY.roleListAll.execute('all roles user')
			},
		}))

		moreRoleButtons.append(createButton({
			name: 'Delete Author Test',
			async execute () {
				await BUTTON_REGISTRY.deleteAuthor.execute()
			},
		}))

		const commentsButton = Block().appendTo(view.content)

		commentsButton.append(createButton({
			name: 'Author 2 lots of comments',
			async execute () {
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'base comments 1')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '2', 'base comments 2')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '3', 'base comments 3')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '4', 'base comments 4')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '5', 'base comments 5')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment <mention vanity="justonestory">', '6')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 2', '6')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 3<mention vanity="justonestory">', '11')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 4<mention vanity="justonestory">', '12')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'base comment index 1')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 6', '13')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 7', '11')
				await BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'base comment index 1 again')
				await BUTTON_REGISTRY.getAllComments.execute('justonestory', 'bigstory', '1')
				await BUTTON_REGISTRY.getComment.execute('1', 'get comment')
			},
		}))

		commentsButton.append(createButton({
			name: 'Author 2 just get comments',
			async execute () {
				await BUTTON_REGISTRY.getAllComments.execute('justonestory', 'bigstory', '1')
			},
		}))

		commentsButton.append(createButton({
			name: 'Author 1 single comment ping',
			async execute () {
				await BUTTON_REGISTRY.createCommentChapter.execute('somanystories', 'debut', '1', 'wow you write so many stories @somanystories how do you do it')
				await BUTTON_REGISTRY.createCommentChapter.execute('somanystories', 'debut', '1', '@somanystories you\'re so @somanystories amazing')
				await BUTTON_REGISTRY.getComment.execute('4')
				await BUTTON_REGISTRY.getComment.execute('5')
				await BUTTON_REGISTRY.updateCommentChapter.execute('4', 'okay done fawning over @somanystories now')
				await BUTTON_REGISTRY.getComment.execute('4')
				await BUTTON_REGISTRY.deleteCommentChapter.execute('5')
				await BUTTON_REGISTRY.getComment.execute('5')
			},
		}))

		commentsButton.append(createButton({
			name: 'try to delete author 1\'s comment',
			async execute () {
				await BUTTON_REGISTRY.deleteCommentChapter.execute('4')
				await BUTTON_REGISTRY.getComment.execute('4')
			},
		}))

		const patreonButtons = Block().appendTo(view.content)

		Button()
			.text.set('Campaign Test')
			.event.subscribe('click', async () => {
				await popup('Campaign OAuth', `${Env.API_ORIGIN}auth/patreon/campaign/begin`, 600, 900)
					.then(() => true).catch(err => { console.warn(err); return false })
				await Session.refresh()
			})
			.appendTo(patreonButtons)

		patreonButtons.append(createButton({
			name: 'create patreon author',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('has a campaign', 'patreonuser')
				await BUTTON_REGISTRY.createWork.execute('patreon only story', 'test', 'short description test', 'exclusive', 'Ongoing', 'Public')
				await BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 1', 'hewwo', 'Private')
				await BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 2', 'hewwoo', 'Private')
				await BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 3', 'hewwooo', 'Private')
				await BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 4', 'hewwooo', 'Private')
				await BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 5', 'hewwooo', 'Private')
			},
		}))

		patreonButtons.append(createButton({
			name: 'get patreon tiers',
			async execute () {
				await BUTTON_REGISTRY.patreonGetTiers.execute('patreon tiers')
				await BUTTON_REGISTRY.patreonGetTiers.execute('patreon tiers')
			},
		}))

		patreonButtons.append(createButton({
			name: 'set patreon chapters',
			async execute () {
				await BUTTON_REGISTRY.updateChapter.execute('patreonuser', 'exclusive', 1, undefined, undefined, 'Public')
				await BUTTON_REGISTRY.patreonSetThresholds.execute('patreonuser', 'exclusive', 'Public', ['2', '3'])
				await BUTTON_REGISTRY.patreonSetThresholds.execute('patreonuser', 'exclusive', 'Patreon', ['4', '5'], '4392761')
			},
		}))

		Button()
			.text.set('Patron Test')
			.event.subscribe('click', async () => {
				await popup('Patron OAuth', `${Env.API_ORIGIN}auth/patreon/patron/begin`, 600, 900)
					.then(() => true).catch(err => { console.warn(err); return false })
				await Session.refresh()
			})
			.appendTo(patreonButtons)

		patreonButtons.append(createButton({
			name: 'get patreon-only chapters',
			async execute () {
				await BUTTON_REGISTRY.viewChapter.execute('public:', 'patreonuser', 'exclusive', 3)
				await BUTTON_REGISTRY.viewChapter.execute('public:', 'patreonuser', 'exclusive', 3)
				await BUTTON_REGISTRY.viewChapter.execute('patreon:', 'patreonuser', 'exclusive', 4)
				await BUTTON_REGISTRY.viewChapter.execute('patreon:', 'patreonuser', 'exclusive', 4)
			},
		}))

		patreonButtons.append(createButton({
			name: 'update patreon-only chapters',
			async execute () {
				await BUTTON_REGISTRY.patreonSetThresholds.execute('patreonuser', 'exclusive', 'Public', ['4'])
			},
		}))

		const tagButtons = Block().appendTo(view.content)

		tagButtons.append(createButton({
			name: 'Create Tag Author',
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute('tagging test', 'thetagger', 'test description')
				await BUTTON_REGISTRY.privilegeGrantAuthor.execute('thetagger', 'TagGlobalCreate', 'TagGlobalDelete', 'TagGlobalUpdate', 'TagCategoryCreate', 'TagCategoryUpdate', 'TagCategoryDelete', 'TagPromote', 'TagDemote')
			},
		}))

		tagButtons.append(createButton({
			name: 'Update Tag Author',
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger')
				await BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger')
				await BUTTON_REGISTRY.updateAuthor.execute('the tagger 2', 'wow i\'m <mention vanity="thetagger">')
				await BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger')
				await BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger')
			},
		}))

		tagButtons.append(createButton({
			name: 'Tag Create Test',
			async execute () {
				await BUTTON_REGISTRY.tagCreateCategory.execute('Category One', 'the first test category')
				await BUTTON_REGISTRY.tagCreateCategory.execute('Category Two', 'the second test category')
				await BUTTON_REGISTRY.tagCreateCategory.execute('Category Three', 'the third test category')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag One', 'test tag 1 <mention vanity="thetagger">', 'Category One')
				await BUTTON_REGISTRY.tagUpdateGlobal.execute('Category One: Tag One', 'Tag One Updated', 'test tag 1 updated', 'Category Two')
				await BUTTON_REGISTRY.tagUpdateCategory.execute('Category One', 'Category One Updated', 'first test category updated')
				await BUTTON_REGISTRY.tagRemoveCategory.execute('Category One Updated')
				await BUTTON_REGISTRY.tagRemoveGlobal.execute('Category Two: Tag One Updated')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('tag conflict', 'conflicting', 'Category Two')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('tag conflict', 'conflicting', 'Category Three')
				await BUTTON_REGISTRY.tagUpdateGlobal.execute('Category Three: tag conflict', undefined, undefined, 'Category Two')
			},
		}))

		tagButtons.append(createButton({
			name: 'Work Tag Test',
			async execute () {
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Two', 'test tag 2', 'Category Two')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Three', 'test tag 2', 'Category Two')
				await BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Four', 'test tag 2', 'Category Two')
				await BUTTON_REGISTRY.createWork.execute('Tag Test Work', 'test', 'desc test', 'testwork', 'Ongoing', 'Public', ['Category Two: Tag Two', 'Category Two: Tag Three'], ['custom tag 1', 'custom tag 2'])
				await BUTTON_REGISTRY.createWork.execute('Tag Test Work Two', 'test2', 'desc test', 'testworktwo', 'Ongoing', 'Public', ['Category Two: Tag Two', 'Category Two: Tag Three'], ['custom tag 2', 'custom tag 3'])
				await BUTTON_REGISTRY.viewWork.execute('work view 1', 'thetagger', 'testworktwo')
				await BUTTON_REGISTRY.viewWork.execute('work view 2', 'thetagger', 'testworktwo')
				await BUTTON_REGISTRY.updateWork.execute('thetagger', 'testworktwo', 'Test Work Two Updated')
				await BUTTON_REGISTRY.viewWork.execute('work view 3', 'thetagger', 'testworktwo')
				await BUTTON_REGISTRY.viewWork.execute('work view 4', 'thetagger', 'testworktwo')
				await BUTTON_REGISTRY.getAllWorksByAuthor.execute('all works', 'thetagger')
			},
		}))

		tagButtons.append(createButton({
			name: 'Chapter Tag Test',
			async execute () {
				await BUTTON_REGISTRY.createChapter.execute('thetagger',
					'testworktwo',
					'test chapter',
					'test chapter body',
					'Public',
					true,
					undefined,
					undefined,
					['Category Two: Tag Two', 'Category Two: Tag Three'],
					['custom tag 2', 'custom tag 3', 'custom tag 4']
				)
				await BUTTON_REGISTRY.viewChapter.execute('chapter', 'thetagger', 'testworktwo', 1)
			},
		}))

		tagButtons.append(createButton({
			name: 'Tag Promote/Demote',
			async execute () {
				await BUTTON_REGISTRY.tagPromoteCustom.execute('custom tag 1', 'test description', 'Category Two')
				await BUTTON_REGISTRY.tagDemoteGlobal.execute('Category Two: Tag Three')
				await BUTTON_REGISTRY.viewWork.execute('work view 3', 'thetagger', 'testwork')
				await BUTTON_REGISTRY.viewWork.execute('work view 4', 'thetagger', 'testworktwo')
			},
		}))

		tagButtons.append(createButton({
			name: 'manifest test',
			async execute () {
				await BUTTON_REGISTRY.tagGetManifest.execute()
			},
		}))

		tagButtons.append(createButton({
			name: 'manifest test 2',
			async execute () {
				await BUTTON_REGISTRY.tagCreateGlobal.execute('extra tag', 'wow', 'Category Three')
				await BUTTON_REGISTRY.tagGetManifest.execute()
			},
		}))

		tagButtons.append(createButton({
			name: 'form length manifest',
			async execute () {
				await BUTTON_REGISTRY.manifestFormLengthGet.execute()
			},
		}))

		const notifButtons = Block().appendTo(view.content)

		notifButtons.append(createButton({
			name: 'Get Notifications',
			async execute () {
				await BUTTON_REGISTRY.notificationsGet.execute()
				await BUTTON_REGISTRY.notificationsGetUnread.execute()
			},
		}))

		notifButtons.append(createButton({
			name: 'Mark Notifications Read',
			async execute () {
				await BUTTON_REGISTRY.notificationsMark.execute('read', ['ba397c1b-02e5-462c-b367-04b007d1f09a', 'd8830a0c-3e2c-4caa-ae4b-679a8c5cefa5'])
				await BUTTON_REGISTRY.notificationsMark.execute('unread', ['ba397c1b-02e5-462c-b367-04b007d1f09a', '3b9781ea-d15d-4915-bbeb-4788ed734453'])
			},
		}))

		notifButtons.append(createButton({
			name: 'Get Front Page Feed',
			async execute () {
				await BUTTON_REGISTRY.feedGet.execute()
			},
		}))

		return view
	},
})
