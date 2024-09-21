import EndpointSessionGet from "utility/endpoint/session/EndpointSessionGet"
import Store from "utility/Store"

namespace Session {
	export async function refresh () {
		const session = await EndpointSessionGet.query()
		const stateToken = session.headers.get("State-Token")
		if (stateToken)
			Store.items.stateToken = stateToken

		Store.items.sessionAuthServices = session?.data?.authorisations ?? undefined
	}

	export function getStateToken () {
		return Store.items.stateToken
	}

	export function getAuthServices () {
		return Store.items.sessionAuthServices ?? []
	}
}

export default Session
