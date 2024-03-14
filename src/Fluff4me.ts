import UiEventBus from "ui/UiEventBus";
import Env from "utility/Env";
import popup from "utility/Popup";

if (location.pathname.startsWith("/auth/")) {
	if (location.pathname.endsWith("/error")) {
		const params = new URLSearchParams(location.search);
		localStorage.setItem("Popup-Error-Code", params.get("code") ?? "500");
		localStorage.setItem("Popup-Error-Message", params.get("message") ?? "Internal Server Error");
	}
	window.close();
}

void screen?.orientation?.lock?.("portrait-primary").catch(() => { });

export default class Fluff4me {

	public constructor () {
		void this.main();
	}

	private async main () {

		UiEventBus.subscribe("keydown", event => {
			if (event.use("F6"))
				for (const stylesheet of document.querySelectorAll("link[rel=stylesheet]")) {
					const href = stylesheet.getAttribute("href")!;
					const newHref = `${href.slice(0, Math.max(0, href.indexOf("?")) || Infinity)}?${Math.random().toString().slice(2)}`;
					stylesheet.setAttribute("href", newHref);
				}

			if (event.use("F4"))
				document.documentElement.classList.add("persist-tooltips");
		});
		UiEventBus.subscribe("keyup", event => {
			if (event.use("F4"))
				document.documentElement.classList.remove("persist-tooltips");
		});

		await Env.load();

		// const path = URL.path ?? URL.hash;
		// if (path === AuthView.id) {
		// 	URL.hash = null;
		// 	URL.path = null;
		// }

		// ViewManager.showByHash(URL.path ?? URL.hash);

		await Session.refresh();

		type OAuthService = (redirectUri: string) => string;

		const OAUTH_SERVICE_REGISTRY: Record<string, OAuthService> = {
			discord: redirect => `https://discord.com/oauth2/authorize?client_id=611683072173277191&state=${Session.getStateToken()}&response_type=code&redirect_uri=${redirect}&scope=identify`,
			github: redirect => `https://github.com/login/oauth/authorize?client_id=63576c6eadf592fe3690&state=${Session.getStateToken()}&redirect_uri=${redirect}&scope=read:user&allow_signup=false`,
		};

		async function openOAuthPopup (serviceName: string) {
			const redirect = encodeURIComponent(`${Env.API_ORIGIN}auth/${serviceName}/callback`);
			await popup(OAUTH_SERVICE_REGISTRY[serviceName](redirect), 600, 900)
				.then(() => true).catch(err => { console.warn(err); return false; });

			await Session.refresh();
		}

		for (const service of Object.keys(OAUTH_SERVICE_REGISTRY))
			document.getElementById(service)
				?.addEventListener("click", () => void openOAuthPopup(service));

		const signupbutton = document.createElement("button");
		signupbutton.textContent = "Sign Up";
		document.body.append(signupbutton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		signupbutton.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}author/create`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...Session.headers(),
				},
				body: JSON.stringify({
					name: "Chiri Vulpes",
					vanity: "chiri",
				}),
			});
		});

		const viewprofilebutton = document.createElement("button");
		viewprofilebutton.textContent = "View Profile";
		document.body.append(viewprofilebutton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		viewprofilebutton.addEventListener("click", async () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const response = await fetch(`${Env.API_ORIGIN}author/get/chiri`, {
				headers: Session.headers(),
			}).then(response => response.json());
			console.log(response);
		});

		const updateAuthorButton = document.createElement("button");
		updateAuthorButton.textContent = "Update Author";
		document.body.append(updateAuthorButton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		updateAuthorButton.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}author/update`, {
				method: "POST",
				headers: {
					...Session.headers(),
				},
				body: JSON.stringify({
					name: "Lumina Mystere",
					description: "if this shows up i did a thing successfully",
					support_link: "https://youlovetosee.it",
					support_message: "pls give me money",
				}),
			});
		});


	}
}

namespace Session {
	export function headers () {
		return Object.fromEntries(Object.entries({
			"Session-Token": localStorage.getItem("Session-Token"),
		}).filter(([, value]) => value !== null && value !== undefined)) as HeadersInit;
	}

	export async function refresh () {
		const headers: HeadersInit = {};
		let sessionToken = localStorage.getItem("Session-Token");
		if (sessionToken)
			headers["Session-Token"] = sessionToken;
		const response = await fetch(`${Env.API_ORIGIN}session`, { headers });
		sessionToken = response.headers.get("Session-Token");
		if (sessionToken)
			localStorage.setItem("Session-Token", sessionToken);
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
