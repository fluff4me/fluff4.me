import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import type Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import Flag from 'ui/component/masthead/Flag'
import PrimaryNav from 'ui/component/PrimaryNav'
import Sidebar from 'ui/component/Sidebar'
import Viewport from 'ui/utility/Viewport'
import type ViewContainer from 'ui/view/shared/component/ViewContainer'
import Env from 'utility/Env'
import Task from 'utility/Task'

interface MastheadExtensions {
	sidebar: Sidebar
}

interface Masthead extends Component, MastheadExtensions { }

const Masthead = Component.Builder('header', (masthead, view: ViewContainer) => {
	masthead.style('masthead')

	const sidebar = Sidebar()
	const nav = PrimaryNav()

	Button()
		.style('masthead-skip-nav')
		.text.use('masthead/skip-navigation')
		.event.subscribe('click', view.focus)
		.appendTo(masthead)

	let popover!: Popover
	const left = Component()
		.append(Component()
			.and(Button)
			.setIcon('bars')
			.style('masthead-left-hamburger', 'masthead-left-hamburger-sidebar')
			.ariaHidden()
			.event.subscribe('click', sidebar.toggle))
		.append(Button()
			.setIcon('bars')
			.style('masthead-left-hamburger', 'masthead-left-hamburger-popover')
			.ariaLabel.use('masthead/primary-nav/alt')
			.clearPopover()
			.setPopover('hover', p => popover = p
				.anchor.add('aligned left', 'off bottom')
				.ariaRole('navigation')))
		.style('masthead-left')
		.appendTo(masthead)

	sidebar.style.bind(masthead.hasFocused, 'sidebar--visible-due-to-keyboard-navigation')

	Viewport.size.use(masthead, async () => {
		await Task.yield()
		nav.appendTo(sidebar.element.clientWidth ? sidebar : popover)
	})

	const flag = Flag()
		.style('masthead-home-logo')

	const homeLink = Link('/')
		.ariaLabel.use('home/label')
		.clearPopover()
		.append(Component()
			.and(Button)
			.style('masthead-home', 'heading')
			.append(flag)
			.append(Component('img')
				.style('masthead-home-logo-wordmark')
				.ariaHidden()
				.attributes.set('src', `${Env.URL_ORIGIN}image/logo-wordmark.svg`)))
		.appendTo(left)

	flag.style.bind(homeLink.hoveredOrFocused, 'flag--focused')
	flag.style.bind(homeLink.active, 'flag--active')
	homeLink.hoveredOrFocused.subscribe(masthead, focus => flag.wave('home link focus', focus))

	Component()
		.style('masthead-search')
		.appendTo(masthead)

	Component()
		.style('masthead-user')
		.append(Button()
			.setIcon('bell')
			.clearPopover()
			.ariaLabel.use('masthead/user/notifications/alt'))
		.append(Button()
			.setIcon('circle-user')
			.clearPopover()
			.ariaLabel.use('masthead/user/profile/alt')
			.setPopover('hover', popover => popover
				.anchor.add('aligned right', 'off bottom')
				.ariaRole('navigation')
				.append(Slot()
					.use(Session.Auth.author, (slot, author) => {
						if (!author) {
							Link('/account')
								.and(Button)
								.type('flush')
								.text.use('masthead/user/profile/popover/login')
								.appendTo(slot)
							return
						}

						Link(`/author/${author.vanity}`)
							.and(Button)
							.type('flush')
							.text.use('masthead/user/profile/popover/profile')
							.appendTo(slot)

						Link('/account')
							.and(Button)
							.type('flush')
							.text.use('masthead/user/profile/popover/account')
							.appendTo(slot)
					}))))
		.appendTo(masthead)

	return masthead.extend<MastheadExtensions>(masthead => ({
		sidebar,
	}))
})

export default Masthead
