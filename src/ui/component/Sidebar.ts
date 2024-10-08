import Component from "ui/Component"

interface SidebarExtensions {
}

interface Sidebar extends Component, SidebarExtensions { }

const Sidebar = Component.Builder("aside", (component): Sidebar => {
	component.style("sidebar")

	return component.extend<SidebarExtensions>(sidebar => ({
	}))
})

export default Sidebar
