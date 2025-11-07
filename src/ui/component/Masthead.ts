import Notifications from 'model/Notifications'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Dialog from 'ui/component/core/Dialog'
import Flag from 'ui/component/core/Flag'
import Link from 'ui/component/core/Link'
import type Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import NotificationList from 'ui/component/NotificationList'
import PrimaryNav from 'ui/component/PrimaryNav'
import Search from 'ui/component/Search'
import SettingsDialog from 'ui/component/SettingsDialog'
import Sidebar from 'ui/component/Sidebar'
import Viewport from 'ui/utility/Viewport'
import LoginView from 'ui/view/LoginView'
import type ViewContainer from 'ui/view/shared/component/ViewContainer'
import AbortPromise from 'utility/AbortPromise'
import Env from 'utility/Env'
import State from 'utility/State'

interface MastheadExtensions {
	readonly sidebar: Sidebar
	readonly flush: Component
}

interface Masthead extends Component, MastheadExtensions { }

const MASTHEAD_CLASS = '_masthead'

const Masthead = Component.Builder('header', (masthead, view: ViewContainer): Masthead => {
	masthead.style('masthead').classes.add(MASTHEAD_CLASS)
		.style.bind(view.wrapped.falsy, 'masthead--view-no-wrapper')

	const sidebar = Sidebar()
		.style.bind(view.wrapped.falsy, 'sidebar--view-no-wrapper')

	const nav = PrimaryNav()

	Button()
		.style('masthead-skip-nav')
		.text.use('masthead/skip-navigation')
		.event.subscribe('click', view.focus)
		.appendTo(masthead)

	const popover = State<Popover | undefined>(undefined)
	const left = Component()
		.append(Component()
			.and(Button)
			.setIcon('bars')
			.type('icon')
			.style('masthead-left-hamburger', 'masthead-left-hamburger-sidebar')
			.ariaHidden()
			.event.subscribe('click', sidebar.toggle))
		.append(Button()
			.setIcon('bars')
			.type('icon')
			.style('masthead-left-hamburger', 'masthead-left-hamburger-popover')
			.ariaLabel.use('masthead/primary-nav/alt')
			.clearPopover()
			.setPopover('hover/click', p => popover.value = p
				.style('primary-nav-popover')
				.anchor.add('aligned left', 'off bottom')
				.anchor.add('aligned left', 'off top')
				.ariaRole('navigation')))
		.style('masthead-left')
		.appendTo(masthead)

	sidebar.style.bind(masthead.hasFocused, 'sidebar--visible-due-to-keyboard-navigation')

	let sizeTimeout: number | undefined
	const fallbackHolder = Component()
	const putNav = (sidebarMode = !!sidebar.element.clientWidth) => nav
		.style.toggle(sidebarMode, 'primary-nav--sidebar')
		.appendTo(sidebarMode ? sidebar : (popover.value ?? fallbackHolder))
	Viewport.size.use(masthead, () => {
		window.clearTimeout(sizeTimeout)
		sizeTimeout = window.setTimeout(putNav, 1)
	})
	popover.subscribeManual(() => putNav())

	HomeLink()
		.style('masthead-home-wrapper')
		.appendTo(left)

	Search()
		.style('masthead-search')
		.appendTo(masthead)

	Slot()
		.style.remove('slot')
		.style('masthead-user')
		.if(Session.Auth.loggedIn, slot => slot

			////////////////////////////////////
			//#region Notifications Button
			.append(Button()
				.setIcon('bell')
				.type('icon')
				.style('masthead-user-notifications')
				.clearPopover()
				.ariaLabel.use('masthead/user/notifications/alt')
				.append(Slot().use(Notifications.unreadCount, (slot, count) => !count ? undefined
					: Component()
						.style('masthead-user-notifications-badge')
						.text.set(`${count}`)))
				.setPopover('hover/click', popover => popover
					.style('masthead-user-notifications-popover')
					.anchor.add('aligned right', 'off bottom')
					.anchor.add('aligned left', `.${MASTHEAD_CLASS}`, 'off top')
					.append(Slot().use(Notifications.cache, AbortPromise.asyncFunction(async (signal, slot, notifications) => {
						const list = await NotificationList(true, 5)
						if (signal.aborted)
							return

						list.paginator.type('flush')
							.style('masthead-user-notifications-list')

						list.paginator.header.style('masthead-user-notifications-list-header')
						list.paginator.title.style('masthead-user-notifications-list-title')
						list.paginator.content.style('masthead-user-notifications-list-content')
						list.paginator.footer.style('masthead-user-notifications-list-footer')

						for (const action of list.paginator.primaryActions.getChildren())
							if (action.is(Button))
								action.style('masthead-user-notifications-list-action')

						Link('/notifications')
							.and(Button)
							.type('flush')
							.text.use('masthead/user/notifications/link/label')
							.appendTo(list.paginator.footer.middle)

						list.appendTo(slot)
					})))))
			//#endregion
			////////////////////////////////////

			////////////////////////////////////
			//#region Profile Button
			.append(Button()
				.setIcon('circle-user')
				.type('icon')
				.clearPopover()
				.ariaLabel.use('masthead/user/profile/alt')
				.setPopover('hover/click', popover => popover
					.anchor.add('aligned right', 'off bottom')
					.anchor.add('aligned right', 'off top')
					.ariaRole('navigation')
					.append(Slot()
						.style('action-group')
						.style.remove('slot')
						.use(Session.Auth.author, (slot, author) => {
							if (!author)
								return

							Link(`/author/${author.vanity}`)
								.and(Button)
								.type('flush')
								.style('masthead-popover-link-button')
								.tweak(button => button.textWrapper.style('masthead-popover-link-button-text'))
								.setIcon('circle-user')
								.text.set(author.name)
								.ariaLabel.use(quilt => quilt['masthead/user/profile/popover/profile'](author.name))
								.appendTo(slot)

							Link('/account')
								.and(Button)
								.type('flush')
								.style('masthead-popover-link-button')
								.setIcon('id-card')
								.text.use('masthead/user/profile/popover/account')
								.appendTo(slot)

							Button()
								.type('flush')
								.style('masthead-popover-link-button')
								.setIcon('arrow-right-from-bracket')
								.text.use('view/account/action/logout')
								.event.subscribe('click', () => Session.reset())
								.appendTo(slot)
						}))))
			//#endregion
			////////////////////////////////////

			.append(Button()
				.setIcon('gear')
				.type('icon')
				.clearPopover()
				.ariaLabel.use('masthead/user/settings/alt')
				.event.subscribe('click', () => SettingsDialog().tweak(Dialog.await))
			)

		)
		.else(() => Button()
			.style('masthead-user-action-login')
			.type('primary')
			.setIcon('circle-user')
			.text.use('masthead/action/login')
			.event.subscribe('click', () => navigate.ephemeral(LoginView, undefined))
		)
		.appendTo(masthead)

	return masthead.extend<MastheadExtensions>(masthead => ({
		sidebar,
		flush: MastheadFlush()
			.style.bind(view.wrapped.falsy, 'masthead--view-no-wrapper'),
	}))
})

export default Masthead

interface HomeLinkExtensions {
	readonly button: Button
}

export interface HomeLink extends Link, HomeLinkExtensions { }

export const HomeLink = Component.Builder('a', (component): HomeLink => {
	const flag = Flag()
		.style('masthead-home-logo')

	const homeLink = component.and(Link, '/')
		.ariaLabel.use('home/label')
		.style('masthead-home-link')
		.clearPopover()

	const button = Component()
		.and(Button)
		.style('masthead-home', 'heading')
		.append(flag)
		.append(Component('img')
			.style('masthead-home-logo-wordmark')
			.ariaHidden()
			.attributes.set('src', `${Env.URL_ORIGIN}image/logo-wordmark.svg`)
		)
		.append(Component()
			.style('masthead-home-logo-beta')
			.text.use('masthead/label/beta')
		)
		.appendTo(homeLink)

	flag.style.bind(homeLink.hoveredOrFocused, 'flag--focused')
	flag.style.bind(homeLink.active, 'flag--active')
	homeLink.hoveredOrFocused.subscribeManual(focus => flag.wave('home link focus', focus))

	return homeLink.extend<HomeLinkExtensions>(homeLink => ({ button }))
})

export const MastheadFlush = Component.Builder('header', masthead => {
	return masthead
		.style('masthead-flush')
		.append(HomeLink())
})
