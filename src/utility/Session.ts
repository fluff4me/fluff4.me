import Env from "utility/Env";

namespace Session {
	export async function refresh (response?: Response) {
		const headers: HeadersInit = {
			"Accept": "application/json",
		};
		response ??= await fetch(`${Env.API_ORIGIN}session`, { headers, credentials: "include" });
		const stateToken = response.headers.get("State-Token");
		if (stateToken)
			localStorage.setItem("State-Token", stateToken);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const session = await response.json().catch(() => ({}));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		localStorage.setItem("Session-Auth-Services", JSON.stringify(session?.data?.authServices ?? {}));
	}

	export function getStateToken () {
		return localStorage.getItem("State-Token");
	}

	export function getAuthServices () {
		const authServicesString = localStorage.getItem("Session-Auth-Services");
		return authServicesString && JSON.parse(authServicesString) || {};
	}
}

export default Session;
