import Component from "ui/Component"
import type View from "ui/view/View"
import type ViewDefinition from "ui/view/ViewDefinition"

interface ViewContainerExtensions {
	view?: View
	show<VIEW extends View, PARAMS extends object> (view: ViewDefinition<VIEW, PARAMS>, params: PARAMS): Promise<VIEW>
}

interface ViewContainer extends Component, ViewContainerExtensions { }

const ViewContainer = (): ViewContainer => Component()
	.style("view-container")
	.extend<ViewContainerExtensions>(container => ({
		view: undefined,
		show: async (definition, params) => {
			void container.view?.hide()
			const view = await definition.create(params)
			view.appendTo(container)
			return view
		},
	}))

export default ViewContainer
