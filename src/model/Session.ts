import type { Author, AuthorWithAuthorisations } from "api.fluff4.me"
import { type Authorisation, type AuthService, type Session } from "api.fluff4.me"
import EndpointAuthRemove from "endpoint/auth/EndpointAuthRemove"
import EndpointSessionGet from "endpoint/session/EndpointSessionGet"
import popup from "utility/Popup"
import State from "utility/State"
import Store from "utility/Store"

declare module "utility/Store" {
	interface ILocalStorage {
		stateToken: string
		session: Session
	}
}

namespace Session {
	export async function refresh () {
		const session = await EndpointSessionGet.query()
		const stateToken = session.headers.get("State-Token")
		if (stateToken)
			Store.items.stateToken = stateToken

		Store.items.session = session?.data ?? undefined
		updateState()
	}

	export function setAuthor (author: Author & Partial<AuthorWithAuthorisations>) {
		const session = Store.items.session
		if (!session)
			return void refresh()

		Store.items.session = {
			...session,
			author: {
				...author,
				authorisations: undefined,
			} as Author,
			authorisations: author.authorisations ?? session.authorisations,
		}
		updateState()
	}

	function updateState () {
		Auth.state.value = Store.items.session?.authorisations?.length ? "has-authorisations" : "none"
		Auth.authorisations.value = Store.items.session?.authorisations ?? []
		Auth.author.value = Store.items.session?.author ?? undefined
	}

	export function getStateToken () {
		return Store.items.stateToken
	}

	export namespace Auth {
		export type State =
			| "none"
			| "has-authorisations"
			| "logged-in"

		export const state = State<State>("none")
		export const authorisations = State<Authorisation[]>([])
		export const author = State<Author | undefined>(undefined, (a, b) => a?.vanity === b?.vanity)

		export function getAll () {
			return Store.items.session?.authorisations ?? []
		}

		export function get (service: string) {
			return Store.items.session?.authorisations?.find(auth => auth.service === service)
		}

		export async function unauth (authOrId: Authorisation | string) {
			const id = typeof authOrId === "string" ? authOrId : authOrId.id
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
	}

}

Object.assign(window, { Session })

export default Session
