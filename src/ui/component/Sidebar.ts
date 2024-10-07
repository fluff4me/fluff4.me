import Component from "ui/Component"
import Flag from "ui/component/Flag"

interface SidebarExtensions {
}

interface Sidebar extends Component, SidebarExtensions { }

const Sidebar = Component.Builder("aside", (component): Sidebar => {
	component.style("sidebar")

	Flag().appendTo(component)

	return component.extend<SidebarExtensions>(sidebar => ({
	}))
})

export default Sidebar
