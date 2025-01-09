import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Env from 'utility/Env'
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

	if (Env.ENVIRONMENT === 'dev')
		Link('/debug')
			.and(Button)
			.text.set('Debug')
			.appendTo(sidebar)

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
