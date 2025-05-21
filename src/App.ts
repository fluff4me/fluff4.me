import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Notifications from 'model/Notifications'
import Session from 'model/Session'
import ToSManager from 'model/ToSManager'
import Navigator from 'navigation/Navigate'
import PopupRoute from 'navigation/popup/PopupRoute'
import PopupRoutes from 'navigation/popup/PopupRoutes'
import style from 'style'
import Component from 'ui/Component'
import { AppBannerQueue } from 'ui/component/AppBanner'
import AppFooter from 'ui/component/AppFooter'
import ExternalLink from 'ui/component/core/ExternalLink'
import Link from 'ui/component/core/Link'
import ToastList from 'ui/component/core/toast/ToastList'
import Masthead, { HomeLink } from 'ui/component/Masthead'
import { registerMarkdownMentionHandler } from 'ui/component/Mention'
import TagPopover from 'ui/component/popover/TagPopover'
import InputBus from 'ui/InputBus'
import ActiveListener from 'ui/utility/ActiveListener'
import FocusListener from 'ui/utility/FocusListener'
import FontsListener from 'ui/utility/FontsListener'
import HoverListener from 'ui/utility/HoverListener'
import MarkdownContent from 'ui/utility/MarkdownContent'
import Mouse from 'ui/utility/Mouse'
import { QuiltHelper } from 'ui/utility/StringApplicator'
import Viewport from 'ui/utility/Viewport'
import ViewContainer from 'ui/view/shared/component/ViewContainer'
import DevServer from 'utility/DevServer'
import Env from 'utility/Env'
import State from 'utility/State'
import Strings from 'utility/string/Strings'

if (location.href.includes('localhost') && Env.isNgrok)
	location.href = Env.URL_ORIGIN + location.pathname.slice(1)

interface QRCodeOptions {
	color?: {
		dark: string
		light: string
	}
}

declare global {
	namespace QRCode {
		export function toDataURL (text: string, options?: QRCodeOptions): Promise<string>
	}
}

QuiltHelper.init({
	Component,
	Link,
	ExternalLink,
})

registerMarkdownMentionHandler()
MarkdownContent.registerMarkdownWeaveHandler()

TagPopover.register()

interface AppExtensions {
	navigate: Navigator
	view: ViewContainer
}

interface App extends Component, AppExtensions { }

async function App (): Promise<App> {
	for (const { route, handler } of PopupRoutes) {
		const match = PopupRoute.match(route, location.pathname)
		if (match)
			handler(match)
	}

	await screen?.orientation?.lock?.('portrait-primary').catch(() => { })

	InputBus.subscribe('down', event => {
		if (event.use('F6'))
			for (const stylesheet of document.querySelectorAll('link[rel=stylesheet]')) {
				const href = stylesheet.getAttribute('href')!
				const newHref = `${href.slice(0, Math.max(0, href.indexOf('?')) || Infinity)}?${Math.random().toString().slice(2)}`
				stylesheet.setAttribute('href', newHref)
			}

		if (event.use('F4'))
			document.documentElement.classList.add('persist-tooltips')
	})
	InputBus.subscribe('up', event => {
		if (event.use('F4'))
			document.documentElement.classList.remove('persist-tooltips')
	})

	Component.allowBuilding()

	void FormInputLengths.getManifest()

	// const path = URL.path ?? URL.hash;
	// if (path === AuthView.id) {
	// 	URL.hash = null;
	// 	URL.path = null;
	// }

	// ViewManager.showByHash(URL.path ?? URL.hash);

	Session.init()

	const navigate = Navigator()

	HoverListener.listen()
	ActiveListener.listen()
	FocusListener.listen()
	Mouse.listen()
	Viewport.listen()
	void FontsListener.listen()
	DevServer.connect()

	document.title = quilt['fluff4me/title']().toString()

	document.body.classList.add(...style.body)

	const view = ViewContainer()
	const masthead = Masthead(view)

	State.UseManual({
		viewTitle: view.state.mapManual(view => view?.titleComponent).mapManual(title => title?.text.state),
		returnTo: view.state.mapManual(view => view?.breadcrumbs.backButton).mapManual(button => button?.subText.state),
		notificationCount: Notifications.unreadCount,
	}).mapManual(({ viewTitle, returnTo, notificationCount }) => {
		document.title = quilt['fluff4me/title']({
			NOTIFICATIONS: notificationCount,
			PAGE: viewTitle,
			PAGE2: Strings.areSameWords(viewTitle ?? undefined, returnTo ?? undefined) ? undefined : returnTo,
		}).toString()

		// document.querySelector('link[rel="shortcut icon"]')?.remove()

		// const logoIconPath = 'image/flag/logo'
		// 	+ (!notificationCount ? '' : '-unread')
		// 	+ '.png'

		// Component('link')
		// 	.attributes.set('rel', 'shortcut icon')
		// 	.attributes.set('href', `${Env.URL_ORIGIN}${logoIconPath}`)
		// 	.appendTo(document.head)
	})

	const related = Component()
		.style('app-content-related')

	AppFooter()
		.style.bind(masthead.sidebar.state.falsy, 'app-footer--no-sidebar')
		.style.bind(view.wrapped.falsy, 'app-footer--view-no-wrapper')
		.appendTo(view)

	const content = Component()
		.style('app-content')
		.append(view, related)

	Component.getBody().monitorScrollEvents()
	Component.getDocument().monitorScrollEvents()
	Component.getWindow().monitorScrollEvents()

	const banner = AppBannerQueue()
		.style.bind(view.wrapped.falsy, 'app-banner-container--view-no-wrapper')

	const noWrapperHomeLink = HomeLink()
		.style('app-no-wrapper-home-link')
		.tweak(homeLink => homeLink.button.style('app-no-wrapper-home-link-button'))

	const app: App = Component()
		.style('app')
		.style.bind(banner.state, 'app--has-banner')
		.style.bind(view.wrapped.falsy, 'app--view-no-wrapper')
		.appendWhen(view.wrapped.falsy, noWrapperHomeLink)
		.append(masthead.flush, masthead, banner, masthead.sidebar, content)
		.append(ToastList())
		.extend<AppExtensions>(app => ({
			navigate,
			view,
		}))
		.tweak(Navigator.setApp)
		.appendTo(document.body)

	Object.assign(window, { app })

	if (Env.isNgrok)
		Component()
			.style('app-qrcode')
			.tweak(async qrcode => {
				const url = await QRCode.toDataURL(Env.URL_ORIGIN, { color: { dark: '#fff', light: '#0000' } })
				qrcode.style.setProperty('background-image', `url(${url})`)
			})
			.appendTo(document.body)

	ToSManager.ensureAccepted()

	await app.navigate.fromURL()
	return app
}

export default App
