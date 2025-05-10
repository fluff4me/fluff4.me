import Component from 'ui/Component'
import State from 'utility/State'
import Store from 'utility/Store'

declare module 'utility/Store' {
	interface ILocalStorage {
		sidebar: boolean
	}
}

interface SidebarExtensions {
	readonly state: State<boolean>
	toggle (): this
}

interface Sidebar extends Component, SidebarExtensions { }

const Sidebar = Component.Builder('nav', (sidebar): Sidebar => {
	sidebar.style('sidebar')
		.ariaLabel.use('masthead/primary-nav/alt')

	const state = State.Generator(() => !!Store.items.sidebar)
	updateSidebarVisibility()
	return sidebar.extend<SidebarExtensions>(sidebar => ({
		state,
		toggle: () => {
			Store.items.sidebar = !Store.items.sidebar
			state.refresh()
			updateSidebarVisibility()
			return sidebar
		},
	}))

	function updateSidebarVisibility () {
		sidebar.style.toggle(!!Store.items.sidebar, 'sidebar--visible')
	}
})

export default Sidebar
