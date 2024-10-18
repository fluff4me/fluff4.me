import type { ErrorResponse } from "api.fluff4.me"
import Component from "ui/Component"
import ViewTransition from "ui/view/component/ViewTransition"
import ErrorView from "ui/view/ErrorView"
import type View from "ui/view/View"
import type ViewDefinition from "ui/view/ViewDefinition"

interface ViewContainerExtensions {
	view?: View
	show<VIEW extends View, PARAMS extends object> (view: ViewDefinition<VIEW, PARAMS>, params: PARAMS): Promise<VIEW | undefined>
}

interface ViewContainer extends Component, ViewContainerExtensions { }

const ViewContainer = (): ViewContainer => Component()
	.style("view-container")
	.tabIndex("programmatic")
	.ariaRole("main")
	.ariaLabel("view/container/alt")
	.extend<ViewContainerExtensions>(container => ({
		view: undefined,
		show: async <VIEW extends View, PARAMS extends object> (definition: ViewDefinition<VIEW, PARAMS>, params: PARAMS) => {
			let view: VIEW | undefined

			if (container.view) {
				const transition = ViewTransition.perform("view", swap)
				await transition.updateCallbackDone
			} else {
				await swap()
			}

			return view

			async function swap () {
				container.view?.remove()
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const shownView = await Promise.resolve(definition.create(params)).catch((error: Error & Partial<ErrorResponse>) => ErrorView.create({ code: error.code ?? 500, error }))
				shownView.appendTo(container)
				container.view = shownView
			}
		},
	}))

export default ViewContainer
