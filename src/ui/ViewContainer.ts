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
	.tabIndex("programmatic")
	.ariaLabel("view/container/alt")
	.extend<ViewContainerExtensions>(container => ({
		view: undefined,
		show: async <VIEW extends View, PARAMS extends object> (definition: ViewDefinition<VIEW, PARAMS>, params: PARAMS) => {
			let view!: VIEW

			if (container.view) {
				const transition = document.startViewTransition(swap)
				await transition.updateCallbackDone
			} else {
				await swap()
			}

			return view

			async function swap () {
				container.view?.remove()
				view = await definition.create(params)
				view.appendTo(container)
				container.view = view
			}
		},
	}))

export default ViewContainer
