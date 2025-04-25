import type { ErrorResponse } from 'api.fluff4.me'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Dialog from 'ui/component/core/Dialog'
import Loading from 'ui/component/core/Loading'
import ErrorView from 'ui/view/ErrorView'
import LoginView from 'ui/view/LoginView'
import RequireLoginView from 'ui/view/RequireLoginView'
import type View from 'ui/view/shared/component/View'
import type ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import type Errors from 'utility/Errors'
import State from 'utility/State'

interface ViewContainerExtensions {
	readonly state: State<View | undefined>
	show<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (view: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS): Promise<VIEW | undefined>

	ephemeral?: View
	ephemeralDialog: Dialog
	showEphemeral<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (view: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS): Promise<VIEW | undefined>
	hideEphemeral (): Promise<void>
}

interface ViewContainer extends Component, ViewContainerExtensions { }

let globalId = 0
const ViewContainer = (): ViewContainer => {
	let cancelLogin: (() => void) | undefined

	const state = State<View | undefined>(undefined)

	const container = Component()
		.style('view-container')
		.tabIndex('programmatic')
		.ariaRole('main')
		.ariaLabel.use('view/container/alt')
		.extend<ViewContainerExtensions>(container => ({
			state,
			show: async <VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (definition: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS) => {
				const showingId = ++globalId

				let view: VIEW | undefined
				let loadParams: LOAD_PARAMS | Errors.Redirecting | undefined = undefined

				const needsLogin = definition.requiresLogin && !Session.Auth.loggedIn.value
				if (needsLogin || definition.load) {
					let loginPromise: Promise<boolean> | undefined
					const transition = ViewTransition.perform('view', async () => {
						swapRemove()
						if (!needsLogin)
							return

						const login = logIn()
						loginPromise = login?.authed
						await login?.loginViewShown
					})
					await transition.updateCallbackDone
					await loginPromise

					if (needsLogin && !Session.Auth.loggedIn.value) {
						let setLoggedIn!: () => void
						const loggedIn = new Promise<void>(resolve => setLoggedIn = resolve)
						ViewTransition.perform('view', async () => {
							hideEphemeral()
							const view = await swapAdd(RequireLoginView)
							if (!view)
								return

							Session.Auth.loggedIn.subscribe(view, loggedIn =>
								loggedIn && setLoggedIn())
						})

						await loggedIn
					}
				}

				container.style('view-container--loading')

				let loading: Loading | undefined
				if (definition.load)
					loading = Loading()
						.style('view-container-loading')
						.appendTo(container)

				let loadError: Error & Partial<ErrorResponse> | undefined
				try {
					loadParams = !definition.load ? undefined : await Promise.resolve(definition.load(params))
				}
				catch (err) {
					loadError = err as never
				}

				loading?.remove()
				container.style.remove('view-container--loading')

				if (globalId !== showingId)
					return

				if (typeof loadParams === 'symbol')
					return

				if (container.state || showingId > 1) {
					const transition = ViewTransition.perform('view', swap)
					await transition.updateCallbackDone
				}
				else {
					await swap()
				}

				return view

				async function swap () {
					swapRemove()
					await swapAdd()
				}

				function swapRemove () {
					container.state?.value?.remove()
					hideEphemeral()
				}

				async function swapAdd (replacementDefinition: ViewDefinition<View, object | undefined, object | undefined> = definition) {
					const shownView = await (loadError ? Promise.reject(loadError) : Promise.resolve(replacementDefinition.create(params, loadParams as object | undefined)))
						.then(v => {
							view = replacementDefinition === definition ? v as VIEW : undefined
							return v
						})
						.catch((error: Error & Partial<ErrorResponse>) => ErrorView.create({
							code: (error.code! < 200 ? undefined : error.code) ?? 600,
							error,
						}, {}))
					if (shownView) {
						shownView.appendTo(container)
						state.value = shownView
						if (replacementDefinition === definition)
							shownView.params = params
					}

					return shownView
				}
			},

			ephemeralDialog: Dialog()
				.style('view-container-ephemeral')
				.tweak(dialog => dialog.style.bind(dialog.opened, 'view-container-ephemeral--open'))
				.setOwner(container)
				.setNotModal()
				.append(Button()
					.setIcon('xmark')
					.style('view-container-ephemeral-close')
					.event.subscribe('click', () => {
						if (cancelLogin)
							cancelLogin()
						else
							return container.hideEphemeral()
					}))
				.appendTo(document.body),

			showEphemeral: async <VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (definition: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS) => {
				let view: VIEW | undefined

				const transition = document.startViewTransition(async () =>
					view = await showEphemeral(definition, params))
				await transition.updateCallbackDone

				return view
			},
			hideEphemeral: async () => {
				const transition = document.startViewTransition(hideEphemeral)
				await transition.updateCallbackDone
			},
		}))

	return container

	async function showEphemeral<VIEW extends View> (definition: ViewDefinition<VIEW, any, any>, params: any) {
		container.ephemeral?.remove()

		let view: VIEW | undefined

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const loadParams = await definition.load?.(params)

		const shownView = await Promise.resolve(definition.create(params, loadParams))
			.then(v => view = v)
			.catch((error: Error & Partial<ErrorResponse>) => ErrorView.create({ code: error.code ?? 600, error }, {}))
		if (shownView) {
			shownView.prependTo(container.ephemeralDialog)
			container.ephemeral = shownView
			container.ephemeralDialog.open()
			container.attributes.append('inert')
			container.ephemeralDialog.opened.subscribe(shownView, opened => {
				if (!opened) {
					hideEphemeral()
				}
			})
		}

		return view
	}

	function hideEphemeral () {
		container.ephemeralDialog.close()
		container.ephemeral?.remove()
		delete container.ephemeral
		container.attributes.remove('inert')
	}

	function logIn () {
		if (Session.Auth.author.value)
			return

		const loginViewShown = showEphemeral(LoginView, undefined)
		const authPromise = loginViewShown.then(async view => {
			if (!view)
				return false

			const loginCancelledPromise = new Promise<void>(resolve => cancelLogin = resolve)

			await Promise.race([
				Session.Auth.await(view),
				loginCancelledPromise,
			])

			cancelLogin = undefined
			return Session.Auth.loggedIn.value
		})

		return {
			loginViewShown,
			authed: authPromise,
		}
	}
}

export default ViewContainer
