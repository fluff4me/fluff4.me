import type { AuthorFull, AuthorSelf, Privilege } from 'api.fluff4.me'
import { type Authorisation, type AuthService, type Session } from 'api.fluff4.me'
import EndpointAuthRemove from 'endpoint/auth/EndpointAuthDelete'
import EndpointSessionGet from 'endpoint/session/EndpointSessionGet'
import EndpointSessionReset from 'endpoint/session/EndpointSessionReset'
import type Component from 'ui/Component'
import Popup from 'utility/Popup'
import State from 'utility/State'
import type { ILocalStorage } from 'utility/Store'
import Store from 'utility/Store'
import type { PartialRecord } from 'utility/Type'

declare module 'utility/Store' {
	interface ILocalStorage {
		stateToken: string
		session: Session
	}
}

namespace Session {

	const _state = State<Session | undefined>(undefined)
	export const state = _state as State<Session | undefined>
	export const has = _state.mapManual(session => !!session)

	const clearedWithSessionChange: (keyof ILocalStorage | (() => unknown))[] = []
	export function setClearedWithSessionChange (...cleared: (keyof ILocalStorage | (() => unknown))[]) {
		clearedWithSessionChange.push(...cleared)
	}

	export function init () {
		_state.value = Store.items.session
		void refresh()
	}

	export async function refresh () {
		const session = await EndpointSessionGet.query()
		const stateToken = session.headers.get('State-Token')
		if (stateToken)
			Store.items.stateToken = stateToken

		const sessionData = session?.data ?? undefined
		if (Store.items.session?.created !== sessionData?.created)
			for (const keyOrHandler of clearedWithSessionChange)
				if (typeof keyOrHandler === 'function')
					keyOrHandler()
				else
					Store.delete(keyOrHandler)

		Store.items.session = sessionData
		_state.value = sessionData
	}

	export async function reset (skipRefresh = false) {
		await EndpointSessionReset.query()
		delete Store.items.session
		_state.value = undefined

		if (skipRefresh)
			return

		await refresh()
	}

	export function setAuthor (author: AuthorFull & Partial<AuthorSelf>) {
		const session = Store.items.session
		if (!session)
			return void refresh()

		const sessionData = {
			...session,
			author: {
				...author,
				authorisations: undefined,
			} as AuthorSelf,
			authorisations: author.authorisations ?? session.authorisations,
		}
		Store.items.session = sessionData
		_state.value = sessionData
	}

	export function getStateToken () {
		return Store.items.stateToken
	}

	export namespace Auth {
		export type State =
			| 'none'
			| 'has-authorisations'
			| 'partial-login'
			| 'logged-in'

		export const state = Session.state.mapManual((session): State => {
			if (session?.author) return 'logged-in'
			if (session?.partial_login) return 'partial-login'
			if (Store.items.session?.authorisations?.length) return 'has-authorisations'
			return 'none'
		})
		export const loggedIn = state.mapManual(state => state === 'logged-in')
		export const authorisations = Session.state.mapManual(session => session?.author?.authorisations ?? session?.authorisations ?? [], false)
		export const author = Session.state.mapManual(session => session?.author, false)
		export const partialLogin = Session.state.mapManual(session => session?.partial_login)

		export function get (service: string) {
			return _
				?? Session.Auth.author.value?.authorisations?.find(auth => auth.service === service)
				?? Session.Auth.authorisations.value.find(auth => auth.service === service)
		}

		export function loggedInAs (owner: State.Owner, authorVanity: string): State.Generator<boolean> {
			return author.map(owner, author => author?.vanity === authorVanity)
		}

		export function isAuthed (service: AuthService) {
			return false
				|| Session.Auth.author.value?.authorisations?.some(auth => auth.service === service.name)
				|| Session.Auth.authorisations.value.some(auth => auth.service === service.name)
		}

		const privilegeStates: PartialRecord<Privilege, State.Generator<boolean>> = {}
		export const privileged = new Proxy({} as Record<Privilege, State.Generator<boolean>>, {
			get (target, p) {
				const privilege = p as Privilege
				return privilegeStates[privilege]
					??= Session.Auth.author.mapManual(author =>
						author?.roles?.some(role => role.privileges?.includes(privilege)) ?? false)
			},
		})

		export async function unauth (authOrId: Authorisation | string) {
			const id = typeof authOrId === 'string' ? authOrId : authOrId.id
			const response = await EndpointAuthRemove.query({ body: { id } })
			if (toast.handleError(response))
				return

			const session = Store.items.session
			const authorisations = session?.author?.authorisations ?? session?.authorisations
			if (authorisations) {
				authorisations.filterInPlace(auth => auth.id !== id)
				if (!authorisations.length && session?.partial_login) {
					session.authorisations = null
					delete session?.partial_login
				}

				Store.items.session = session
				Session.state.asMutable?.setValue(session)
			}
		}

		const LoginPopup = Popup({ width: 600, height: 900 })

		export async function auth (owner: State.Owner, service: AuthService) {
			await LoginPopup
				.show(owner, {
					translation: quilt => quilt['view/account/auth/popup/title'](service.name),
					url: service.url_begin,
				})
				.toastError()
			await Session.refresh()
		}

		export async function await (owner: Component) {
			if (state.value === 'logged-in')
				return true

			return new Promise<void>(resolve => {
				state.subscribe(owner, handleStateChange)
				function handleStateChange (value: State) {
					if (value !== 'logged-in')
						return

					resolve()
					state.unsubscribe(handleStateChange)
				}
			})
		}
	}

}

Object.assign(window, { Session })

export default Session
