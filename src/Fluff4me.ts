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

		async function openOAuthPopup (serviceName: string) {
			await popup(`${Env.API_ORIGIN}auth/${serviceName.toLowerCase()}/begin`, 600, 900)
				.then(() => true).catch(err => { console.warn(err); return false; });

			await Session.refresh();
		}

		// TODO fetch services from a new auth API
		for (const service of ["GitHub", "Discord"]) {
			document.getElementById(service.toLowerCase())
				?.addEventListener("click", () => void openOAuthPopup(service));

			const unoauthbutton = document.createElement("button");
			unoauthbutton.textContent = `UnOAuth ${service}`;
			document.body.append(unoauthbutton);
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			unoauthbutton.addEventListener("click", async () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				const id = Session.getAuthServices()[service.toLowerCase()]?.[0]?.id;
				if (id === undefined)
					return;
				await fetch(`${Env.API_ORIGIN}auth/remove`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json",
					},
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					body: JSON.stringify({ id }),
				});
			});
		}

		const signupbutton = document.createElement("button");
		signupbutton.textContent = "Sign Up";
		document.body.append(signupbutton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		signupbutton.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}author/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
				},
				body: JSON.stringify({
					name: "Chiri Vulpes",
					vanity: "chiri",
				}),
			});

			await Session.refresh();
		});

		const signupbuttontwo = document.createElement("button");
		signupbuttontwo.textContent = "Sign Up 2";
		document.body.append(signupbuttontwo);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		signupbuttontwo.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}author/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Lumina Mystere",
					vanity: "lumina",
				}),
			});

			await Session.refresh();
		});

		const resetSessionButton = document.createElement("button");
		resetSessionButton.textContent = "Clear Session";
		document.body.append(resetSessionButton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		resetSessionButton.addEventListener("click", async () => {
			await Session.refresh(await fetch(`${Env.API_ORIGIN}session/reset`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
				},
			}));
		});

		const viewprofilebutton = document.createElement("button");
		viewprofilebutton.textContent = "View Profile";
		document.body.append(viewprofilebutton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		viewprofilebutton.addEventListener("click", async () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const response = await fetch(`${Env.API_ORIGIN}author/chiri/get`, {
				credentials: "include",
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
				credentials: "include",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
				},
				// body: JSON.stringify({
				// 	name: "Lumina Mystere",
				// 	description: "if this shows up i did a thing successfully",
				// 	support_link: "https://youlovetosee.it",
				// 	support_message: "pls give me money",
				// }),
			});
		});

		const createWorkButton = document.createElement("button");
		createWorkButton.textContent = "Create Work";
		document.body.append(createWorkButton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		createWorkButton.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}work/create`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Test Work",
					description: "woo look a story",
					vanity: "a-fancy-story",
				}),
			});
		});

		const viewWorkButton = document.createElement("button");
		viewWorkButton.textContent = "View Test Work";
		document.body.append(viewWorkButton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		viewWorkButton.addEventListener("click", async () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const response = await fetch(`${Env.API_ORIGIN}work/a-fancy-story/get`, {
				credentials: "include",
			}).then(response => response.json());
			console.log(response);
		});

		const updateWorkButton = document.createElement("button");
		updateWorkButton.textContent = "Update Test Work";
		document.body.append(updateWorkButton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		updateWorkButton.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}work/a-fancy-story/get`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Updated Test Work",
					description: "if this shows up i did a second thing successfully",
					visibility: "Public",
				}),
			});
		});

		const deleteWorkButton = document.createElement("button");
		deleteWorkButton.textContent = "Delete Work";
		document.body.append(deleteWorkButton);
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		deleteWorkButton.addEventListener("click", async () => {
			await fetch(`${Env.API_ORIGIN}work/a-fancy-story/delete`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Updated Test Work",
					description: "if this shows up i did a second thing successfully",
					visibility: "Public",
				}),
			});
		});


	}
}

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
