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
import Task from 'utility/Task'

interface ViewContainerExtensions {
	readonly state: State<View | undefined>
	readonly wrapped: State<boolean>
	show<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (view: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS): Promise<VIEW | undefined>

	ephemeral?: View
	ephemeralOwner?: State.Owner.Removable
	ephemeralDialog: Dialog
	showEphemeral<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (view: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS): Promise<VIEW | undefined>
	hideEphemeral (): Promise<void>
}

interface ViewContainer extends Component, ViewContainerExtensions { }

let globalId = 0
const ViewContainer = (): ViewContainer => {
	let cancelLogin: (() => void) | undefined

	const state = State<View | undefined>(undefined)
	const wrapped = State(true)

	let loadingOwner: State.Owner.Removable | undefined

	// const viewStartAnchor = Component().style('view-container-start-anchor')

	const container = Component()
		.style('view-container')
		.style.bind(wrapped.falsy, 'view-container--no-wrapper')
		.tabIndex('programmatic')
		.ariaRole('main')
		.ariaLabel.use('view/container/alt')
		// .append(viewStartAnchor)
		.extend<ViewContainerExtensions>(container => ({
			state,
			wrapped,
			show: async <VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (definition: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS>, params: PARAMS) => {
				const showingId = ++globalId
				loadingOwner?.remove()
				loadingOwner = State.Owner.create()

				let view: VIEW | undefined
				let loadParams: LOAD_PARAMS | Errors.Redirecting | undefined = undefined

				wrapped.value = definition.wrapper !== false

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

				let loading: Loading | undefined
				if (definition.load) {
					container.style('view-container--loading')

					loading = Loading()
						.setOwner(loadingOwner)
						.style('view-container-loading')
						.prependTo(container)
					// .insertTo(container, 'after', viewStartAnchor)
				}

				await Task.yield()
				window.scrollTo({ top: 0, behavior: 'smooth' })
				// await Async.sleep(100)

				let loadError: Error & Partial<ErrorResponse> | undefined
				if (definition.load) {
					try {
						const asyncState = State.Async(loadingOwner, State(params), definition.load)
						loading?.use(asyncState)
						loadParams = await asyncState.promise
					}
					catch (err) {
						loadError = err as never
					}
				}

				// throw new Error()
				loading?.remove()
				loadingOwner?.remove(); loadingOwner = undefined
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

				async function swapAdd (replacementDefinition = definition as any as ViewDefinition<View, object | undefined, object | undefined>) {
					const shownView = await (loadError ? Promise.reject(loadError) : Promise.resolve(replacementDefinition.create(params, loadParams as object | undefined)))
						.then(v => {
							view = replacementDefinition === definition as any ? v as VIEW : undefined
							return v
						})
						.catch((error: Error & Partial<ErrorResponse>) => ErrorView.create({
							code: (error.code! < 200 ? undefined : error.code) ?? 600,
							error,
						}, {}))
					if (shownView) {
						shownView.prependTo(container)
						// shownView.insertTo(container, 'after', viewStartAnchor)
						state.value = shownView
						if (replacementDefinition === definition as any)
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
				return await showEphemeral(definition, params)
			},
			hideEphemeral: async () => {
				const transition = document.startViewTransition(hideEphemeral)
				await transition.updateCallbackDone
			},
		}))

	return container

	async function showEphemeral<VIEW extends View> (definition: ViewDefinition<VIEW, any, any>, params: any) {
		container.ephemeral?.remove(); container.ephemeral = undefined
		container.ephemeralOwner?.remove()

		let view: VIEW | undefined

		container.ephemeralOwner = State.Owner.create()

		let loadParams: any
		if (definition.load) {
			const loadState = State.Async(container.ephemeralOwner, State(params), definition.load)

			const loading = Loading()
				.setOwner(container.ephemeralOwner)
				.style('view-container-loading', 'view-container-ephemeral-loading')

			await Task.yield()

			if (!container.ephemeralDialog.opened.value) {
				const transition = document.startViewTransition(showLoading)
				await transition.updateCallbackDone
			}

			function showLoading () {
				loading.prependTo(container.ephemeralDialog)
				loading.use(loadState)
				container.ephemeralDialog.open()
				container.attributes.append('inert')
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			loadParams = await loadState?.promise

			loading.remove()
			await swapViewIn()
		}
		else {
			if (!container.ephemeralDialog.opened.value) {
				const transition = document.startViewTransition(swapViewIn)
				await transition.updateCallbackDone
			}
			else {
				await swapViewIn()
			}
		}

		return view

		async function swapViewIn () {
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
		}
	}

	function hideEphemeral () {
		container.ephemeralDialog.close()
		container.ephemeral?.remove(); container.ephemeral = undefined
		container.ephemeralOwner?.remove(); container.ephemeralOwner = undefined
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
