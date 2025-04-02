import quilt from 'lang/en-nz'
import DangerToken from 'model/DangerToken'
import FormInputLengths from 'model/FormInputLengths'
import Notifications from 'model/Notifications'
import Session from 'model/Session'
import Navigator from 'navigation/Navigate'
import style from 'style'
import Component from 'ui/Component'
import ExternalLink from 'ui/component/core/ExternalLink'
import Link from 'ui/component/core/Link'
import ToastList from 'ui/component/core/toast/ToastList'
import Masthead from 'ui/component/Masthead'
import { registerMarkdownMentionHandler } from 'ui/component/Mention'
import TagPopover from 'ui/component/popover/TagPopover'
import InputBus from 'ui/InputBus'
import ActiveListener from 'ui/utility/ActiveListener'
import FocusListener from 'ui/utility/FocusListener'
import FontsListener from 'ui/utility/FontsListener'
import HoverListener from 'ui/utility/HoverListener'
import Mouse from 'ui/utility/Mouse'
import { QuiltHelper } from 'ui/utility/StringApplicator'
import Viewport from 'ui/utility/Viewport'
import ViewContainer from 'ui/view/shared/component/ViewContainer'
import DevServer from 'utility/DevServer'
import Env from 'utility/Env'
import State from 'utility/State'
import Store from 'utility/Store'
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

TagPopover.register()

interface AppExtensions {
	navigate: Navigator
	view: ViewContainer
}

interface App extends Component, AppExtensions { }

async function App (): Promise<App> {
	if (location.pathname.startsWith('/auth/')) {
		// eslint-disable-next-line no-debugger
		debugger

		if (location.pathname.endsWith('/error')) {
			const params = new URLSearchParams(location.search)
			Store.items.popupError = {
				code: +(params.get('code') ?? '500'),
				message: params.get('message') ?? 'Internal Server Error',
			}
		}
		else if (location.pathname.endsWith('/ok')) {
			const params = new URLSearchParams(location.search)
			DangerToken.handleAuthParams(params)
		}
		else {
			Store.items.popupError = {
				code: 600,
				message: `Unsupported auth url '${location.pathname}'`,
			}
		}

		window.close()
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

	const content = Component()
		.style('app-content')
		.append(view, related)

	Component.wrap(document.body).monitorScrollEvents()
	Component.wrap(document.documentElement).monitorScrollEvents()
	Component.wrap(window as any as HTMLElement).monitorScrollEvents()

	const app: App = Component()
		.style('app')
		.append(masthead.flush, masthead, masthead.sidebar, content)
		.append(ToastList())
		.extend<AppExtensions>(app => ({
			navigate,
			view,
		}))
		.tweak(Navigator.setApp)
		.appendTo(document.body)

	if (Env.isNgrok)
		Component()
			.style('app-qrcode')
			.tweak(async qrcode => {
				const url = await QRCode.toDataURL(Env.URL_ORIGIN, { color: { dark: '#fff', light: '#0000' } })
				qrcode.style.setProperty('background-image', `url(${url})`)
			})
			.appendTo(document.body)

	ExternalLink(undefined)
		.style('app-version')
		.attributes.bind('href', Env.state.mapManual(env => !env?.BUILD_SHA ? undefined : `https://github.com/fluff4me/fluff4.me/commit/${env.BUILD_SHA}`))
		.text.bind(Env.state.mapManual(env => !env ? ''
			: !env.BUILD_SHA
				? 'dev'
				: `v${env.BUILD_NUMBER} (${env.BUILD_SHA?.slice(0, 7)})`
		))
		.appendTo(document.body)

	await app.navigate.fromURL()

	Object.assign(window, { app })
	return app
}

export default App
