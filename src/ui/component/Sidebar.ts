import Session from 'model/Session'
import type { RoutePath } from 'navigation/Routes'
import type { ComponentInsertionDestination } from 'ui/Component'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import Heading from 'ui/component/core/Heading'
import Link from 'ui/component/core/Link'
import type { SlotInitialiserReturn } from 'ui/component/core/Slot'
import Slot from 'ui/component/core/Slot'
import { Quilt } from 'ui/utility/StringApplicator'
import Env from 'utility/Env'
import type State from 'utility/State'
import Store from 'utility/Store'

declare module 'utility/Store' {
	interface ILocalStorage {
		sidebar: boolean
	}
}

interface SidebarExtensions {
	toggle (): this
}

interface Sidebar extends Component, SidebarExtensions { }

const Sidebar = Component.Builder('nav', (sidebar): Sidebar => {
	sidebar.style('sidebar')
		.ariaLabel.use('masthead/primary-nav/alt')

	const top = Component()
		.style('sidebar-top')
		.appendTo(sidebar)

	const bottom = Component()
		.style('sidebar-bottom')
		.appendTo(sidebar)

	////////////////////////////////////
	//#region Util

	interface GroupInsertion {
		add (path: RoutePath, translation: Quilt.SimpleKey | Quilt.Handler, initialiser?: (button: Link & Button) => unknown): this
	}

	interface GroupInsertionTransaction extends ComponentInsertionTransaction, GroupInsertion { }

	interface GroupExtensions extends GroupInsertion {
		using<T> (state: State<T>, initialiser: (slot: GroupInsertionTransaction, value: T) => SlotInitialiserReturn): this
	}

	interface Group extends Component, GroupExtensions { }

	function Group (at: 'top' | 'bottom' | null, translation: Quilt.SimpleKey | Quilt.Handler): Group {
		return Component()
			.style('sidebar-group')
			.append(Heading()
				.style('sidebar-group-heading')
				.style.remove('heading')
				.text.use(translation))
			.extend<GroupExtensions>(group => ({
				add: createAddFunction(group),
				using: (state, initialiser) => {
					Slot()
						.use(state, (transaction, value) =>
							initialiser(Object.assign(transaction, { add: createAddFunction(transaction as GroupInsertionTransaction) }), value))
						.appendTo(group)
					return group
				},
			}))
			.tweak(group => at !== null
				&& group.appendTo(at === 'top' ? top : bottom))

		function createAddFunction<T extends ComponentInsertionDestination> (addTo: T): (...params: Parameters<GroupInsertion['add']>) => T {
			return (path, translation, initialiser) => {
				Link(path)
					.and(Button)
					.style('sidebar-link')
					.type('flush')
					.text.use(translation)
					.override('setIcon', (button, original) => icon => original(icon)
						.tweak(button => button.icon?.style('sidebar-link-icon')))
					.tweak(button => button
						.style.bind(button.disabled, 'button--disabled', 'sidebar-link--disabled'))
					.tweak(button => button
						.textWrapper.style('sidebar-link-text'))
					.tweak(initialiser)
					.appendTo(addTo)
				return addTo
			}
		}
	}

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Content

	Group('top', 'sidebar/section/browse')
		.add('/', 'sidebar/link/new', button => button.setIcon('calendar-plus'))
		.using(Session.Auth.author, (group, author) => group
			.add('/feed', 'sidebar/link/feed', button => button.setIcon('heart')
				.setDisabled(!author, 'no author'))
			.add('/history', 'sidebar/link/history', button => button.setIcon('clock-rotate-left')
				.setDisabled(!author, 'no author'))
		)

	Slot()
		.use(Session.Auth.author, (slot, author) => author
			&& Group('top', 'sidebar/section/create')
				.tweak(group => {
					for (const work of author.works ?? [])
						group.add(`/work/${work.author}/${work.vanity}`, Quilt.fake(work.name), button => button.setIcon('book'))
				})
				.add('/work/new', 'sidebar/link/create-work', button => button.setIcon('plus'))
		)
		.appendTo(top)

	Group('bottom', 'sidebar/section/profile')
		.using(Session.Auth.author, (group, author) => {
			if (author) group
				.add(`/author/${author.vanity}`, 'sidebar/link/profile', button => button.setIcon('circle-user'))
				.add('/account', 'sidebar/link/settings', button => button.setIcon('id-card'))
			else group
				.add('/account', 'sidebar/link/login', button => button.setIcon('circle-user'))
		})

	if (Env.ENVIRONMENT === 'dev')
		Group('bottom', 'sidebar/section/dev')
			.add('/debug', 'sidebar/link/debug', button => button.setIcon('bug'))

	//#endregion
	////////////////////////////////////

	updateSidebarVisibility()
	return sidebar.extend<SidebarExtensions>(sidebar => ({
		toggle: () => {
			Store.items.sidebar = !Store.items.sidebar
			updateSidebarVisibility()
			return sidebar
		},
	}))

	function updateSidebarVisibility () {
		sidebar.style.toggle(!!Store.items.sidebar, 'sidebar--visible')
	}
})

export default Sidebar
