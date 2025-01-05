import type { AuthorAuthorised, AuthorFull, Paths } from 'api.fluff4.me'
import { type Authorisation, type AuthService, type Session } from 'api.fluff4.me'
import EndpointAuthRemove from 'endpoint/auth/EndpointAuthRemove'
import EndpointSessionGet from 'endpoint/session/EndpointSessionGet'
import EndpointSessionReset from 'endpoint/session/EndpointSessionReset'
import type Component from 'ui/Component'
import Env from 'utility/Env'
import popup from 'utility/Popup'
import State from 'utility/State'
import type { ILocalStorage } from 'utility/Store'
import Store from 'utility/Store'

export type DangerTokenType = keyof { [KEY in keyof Paths as KEY extends `/danger-token/request/${infer TOKEN}/{service}/begin` ? TOKEN : never]: true }

declare module 'utility/Store' {
	interface ILocalStorage {
		stateToken: string
		session: Session
	}
}

namespace Session {

	const clearedWithSessionChange: (keyof ILocalStorage)[] = []
	export function setClearedWithSessionChange (...keys: (keyof ILocalStorage)[]) {
		clearedWithSessionChange.push(...keys)
	}

	export async function refresh () {
		const session = await EndpointSessionGet.query()
		const stateToken = session.headers.get('State-Token')
		if (stateToken)
			Store.items.stateToken = stateToken

		if (Store.items.session?.created !== session.data?.created)
			for (const key of clearedWithSessionChange)
				Store.delete(key)

		Store.items.session = session?.data ?? undefined
		updateState()
	}

	export async function reset () {
		await EndpointSessionReset.query()
		delete Store.items.session
		updateState()
	}

	export function setAuthor (author: AuthorFull & Partial<AuthorAuthorised>) {
		const session = Store.items.session
		if (!session)
			return void refresh()

		Store.items.session = {
			...session,
			author: {
				...author,
				authorisations: undefined,
			} as AuthorFull,
			authorisations: author.authorisations ?? session.authorisations,
		}
		updateState()
	}

	function updateState () {
		Auth.state.value = Store.items.session?.author ? 'logged-in' : Store.items.session?.authorisations?.length ? 'has-authorisations' : 'none'
		Auth.authorisations.value = Store.items.session?.authorisations ?? []
		Auth.author.value = Store.items.session?.author ?? undefined
	}

	export function getStateToken () {
		return Store.items.stateToken
	}

	export namespace Auth {
		export type State =
			| 'none'
			| 'has-authorisations'
			| 'logged-in'

		export const state = State<State>('none')
		export const loggedIn = State.Generator(() => state.value === 'logged-in').observeManual(state)
		export const authorisations = State<Authorisation[]>([])
		export const author = State<AuthorFull | undefined>(undefined, (a, b) => a?.vanity === b?.vanity)

		export function getAll () {
			return Store.items.session?.authorisations ?? []
		}

		export function get (service: string) {
			return Store.items.session?.authorisations?.find(auth => auth.service === service)
		}

		export function isAuthed (service: AuthService) {
			return Session.Auth.authorisations.value.some(auth => auth.service === service.name)
		}

		export async function unauth (authOrId: Authorisation | string) {
			const id = typeof authOrId === 'string' ? authOrId : authOrId.id
			await EndpointAuthRemove.query({ body: { id } })

			const session = Store.items.session
			if (session?.authorisations) {
				let authorisations: Authorisation[] | null = session.authorisations.filter(auth => auth.id !== id)
				if (!authorisations.length)
					authorisations = null

				Store.items.session = {
					...session,
					authorisations,
				}
			}

			updateState()
		}

		export async function auth (service: AuthService) {
			await popup(`Login Using ${service.name}`, service.url_begin, 600, 900)
				.then(() => true).catch(err => { console.warn(err); return false })
			await Session.refresh()
		}

		let isRequestingDangerToken = false
		export function canRequestDangerToken () {
			return !isRequestingDangerToken
		}

		export async function requestDangerToken (type: DangerTokenType, service: AuthService) {
			if (isRequestingDangerToken)
				return false

			isRequestingDangerToken = true
			const result = await popup(`Re-authenticate Using ${service.name}`, `${Env.API_ORIGIN}danger-token/request/${type}/${service.id}/begin`, 600, 900)
				.then(() => true).catch(err => { console.warn(err); return false })
			isRequestingDangerToken = false
			return result
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
