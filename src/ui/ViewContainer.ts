import Component from "ui/Component"
import type View from "ui/view/View"
import type ViewDefinition from "ui/view/ViewDefinition"

export enum ViewContainerClasses {
	Main = "view-container",
}

interface ViewContainerExtensions {
	view?: View
	show<VIEW extends View> (view: ViewDefinition<VIEW>): Promise<VIEW>
}

interface ViewContainer extends Component, ViewContainerExtensions { }

const ViewContainer = (): ViewContainer => Component()
	.classes.add(ViewContainerClasses.Main)
	.extend<ViewContainerExtensions>(container => ({
		view: undefined,
		show: async definition => {
			void container.view?.hide()
			const view = await definition.create()
			view.appendTo(container)
			return view
		},
	}))

export default ViewContainer
