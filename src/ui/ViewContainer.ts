import type { ErrorResponse } from "api.fluff4.me"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import Dialog from "ui/component/core/Dialog"
import ViewTransition from "ui/view/component/ViewTransition"
import ErrorView from "ui/view/ErrorView"
import type View from "ui/view/View"
import type ViewDefinition from "ui/view/ViewDefinition"

interface ViewContainerExtensions {
	view?: View
	show<VIEW extends View, PARAMS extends object | undefined> (view: ViewDefinition<VIEW, PARAMS>, params: PARAMS): Promise<VIEW | undefined>

	ephemeral?: View
	ephemeralDialog: Dialog
	showEphemeral<VIEW extends View, PARAMS extends object | undefined> (view: ViewDefinition<VIEW, PARAMS>, params: PARAMS): Promise<VIEW | undefined>
	hideEphemeral (): Promise<void>
}

interface ViewContainer extends Component, ViewContainerExtensions { }

let globalId = 0
const ViewContainer = (): ViewContainer => {
	const container = Component()
		.style("view-container")
		.tabIndex("programmatic")
		.ariaRole("main")
		.ariaLabel.use("view/container/alt")
		.extend<ViewContainerExtensions>(container => ({
			show: async <VIEW extends View, PARAMS extends object | undefined> (definition: ViewDefinition<VIEW, PARAMS>, params: PARAMS) => {
				const showingId = ++globalId
				if (definition.prepare)
					await definition.prepare(params)

				if (globalId !== showingId)
					return

				let view: VIEW | undefined

				if (container.view || showingId > 1) {
					const transition = ViewTransition.perform("view", swap)
					await transition.updateCallbackDone
				} else {
					await swap()
				}

				return view

				async function swap () {
					container.view?.remove()

					container.ephemeralDialog.close()
					container.ephemeral?.remove()
					delete container.ephemeral
					container.attributes.remove("inert")

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const shownView = await Promise.resolve(definition.create(params))
						.then(v => view = v)
						.catch((error: Error & Partial<ErrorResponse>) => ErrorView.create({ code: error.code ?? 500, error }))
					if (shownView) {
						shownView.appendTo(container)
						container.view = shownView
					}
				}
			},

			ephemeralDialog: Dialog()
				.style("view-container-ephemeral")
				.tweak(dialog => dialog.style.bind(dialog.opened, "view-container-ephemeral--open"))
				.setOwner(container)
				.setNotModal()
				.append(Button()
					.style("view-container-ephemeral-close")
					.event.subscribe("click", () => container.hideEphemeral()))
				.appendTo(document.body),

			showEphemeral: async <VIEW extends View, PARAMS extends object | undefined> (definition: ViewDefinition<VIEW, PARAMS>, params: PARAMS) => {
				let view: VIEW | undefined

				const transition = document.startViewTransition(swap)
				await transition.updateCallbackDone

				return view

				async function swap () {
					container.ephemeral?.remove()
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const shownView = await Promise.resolve(definition.create(params))
						.then(v => view = v)
						.catch((error: Error & Partial<ErrorResponse>) => ErrorView.create({ code: error.code ?? 500, error }))
					if (shownView) {
						shownView.appendTo(container.ephemeralDialog)
						container.ephemeral = shownView
						container.ephemeralDialog.open()
						container.attributes.add("inert")
					}
				}
			},
			hideEphemeral: async () => {
				const transition = document.startViewTransition(() => {
					container.ephemeralDialog.close()
					container.ephemeral?.remove()
					delete container.ephemeral
					container.attributes.remove("inert")
				})
				await transition.updateCallbackDone
			},
		}))

	return container
}

export default ViewContainer
