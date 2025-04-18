import type { AuthorFull, AuthorSelf, Privilege } from 'api.fluff4.me'
import { type Authorisation, type AuthService, type Session } from 'api.fluff4.me'
import EndpointAuthRemove from 'endpoint/auth/EndpointAuthDelete'
import EndpointSessionGet from 'endpoint/session/EndpointSessionGet'
import EndpointSessionReset from 'endpoint/session/EndpointSessionReset'
import type Component from 'ui/Component'
import popup from 'utility/Popup'
import State from 'utility/State'
import type { ILocalStorage } from 'utility/Store'
import Store from 'utility/Store'

declare module 'api.fluff4.me' {
	interface Author {
		supporter?: Supporter
	}

	interface Supporter {
		tier: number
		months: number

		vanity_colours?: number[]
	}
}

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
			} as AuthorFull,
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

		export function hasPrivilege (privilege: Privilege) {
			return !!Session.Auth.author.value?.roles?.some(role => role.privileges?.includes(privilege))
		}

		export async function unauth (authOrId: Authorisation | string) {
			const id = typeof authOrId === 'string' ? authOrId : authOrId.id
			await EndpointAuthRemove.query({ body: { id } })

			const session = Store.items.session
			if (session?.authorisations) {
				let authorisations: Authorisation[] | null = session.authorisations.filter(auth => auth.id !== id)
				if (!authorisations.length) {
					authorisations = null
					delete session?.partial_login
				}

				const sessionData = {
					...session,
					authorisations,
				}
				Store.items.session = sessionData
				Session.state.asMutable?.setValue(sessionData)
			}
		}

		export async function auth (service: AuthService) {
			await popup(`Login Using ${service.name}`, service.url_begin, 600, 900)
				.then(() => true).catch(err => { console.warn(err); return false })
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
