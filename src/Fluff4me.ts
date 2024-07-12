/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { BUTTON_REGISTRY, type IButtonImplementation } from "dev/ButtonRegistry";
import UiEventBus from "ui/UiEventBus";
import Env from "utility/Env";
import popup from "utility/Popup";
import Session from "utility/Session";

if (location.pathname.startsWith("/auth/")) {
	if (location.pathname.endsWith("/error")) {
		const params = new URLSearchParams(location.search);
		debugger;
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

		const createButton = <ARGS extends any[]> (implementation: IButtonImplementation<ARGS>, ...args: ARGS) => {
			const button = document.createElement("button");
			button.textContent = implementation.name;
			button.addEventListener("click", async () => {
				try {
					await implementation.execute(...args);
				} catch (err) {
					const error = err as Error;
					console.warn(`Button ${implementation.name} failed to execute:`, error);
				}
			});
			return button;
		};

		const oauthDiv = document.createElement("div");
		document.body.append(oauthDiv);

		const OAuthServices = await fetch(`${Env.API_ORIGIN}auth/services`, {})
			.then(response => response.json());

		for (const service of Object.values(OAuthServices.data) as any[]) {
			const oauthButton = document.createElement("button");
			oauthButton.textContent = `OAuth ${service.name}`;
			oauthDiv.append(oauthButton);
			oauthButton.addEventListener("click", async () => {
				await popup(service.url_begin, 600, 900)
					.then(() => true).catch(err => { console.warn(err); return false; });
				await Session.refresh();
			});

			const unoauthbutton = document.createElement("button");
			unoauthbutton.textContent = `UnOAuth ${service.name}`;
			oauthDiv.append(unoauthbutton);
			unoauthbutton.addEventListener("click", async () => {
				const id = Session.getAuthServices()[service.id]?.[0]?.id;
				if (id === undefined)
					return;
				await fetch(`${Env.API_ORIGIN}auth/remove`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id }),
				});
			});
		}

		// document.body.append(createButton(BUTTON_REGISTRY.createAuthor, "test author 1", "hi-im-an-author"));
		oauthDiv.append(createButton(BUTTON_REGISTRY.clearSession));

		const profileButtons = document.createElement("div");
		document.body.append(profileButtons);

		profileButtons.append(createButton({
			name: "Create Profile 1",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("prolific author", "somanystories");
				await BUTTON_REGISTRY.createWork.execute("a debut work", "pretty decent", "debut", "Complete", "Public");
				await BUTTON_REGISTRY.createChapter.execute("chapter 1", "woo look it's prolific author's first story!", "debut", "Public");
				await BUTTON_REGISTRY.createWork.execute("sequel to debut", "wow they wrote a sequel", "sequel", "Ongoing", "Public");
				await BUTTON_REGISTRY.createChapter.execute("the chapters", "pretend there's a story here", "sequel", "Public");
				await BUTTON_REGISTRY.createWork.execute("work in progress", "private test", "wip", "Ongoing", "Private");
				await BUTTON_REGISTRY.createChapter.execute("draft", "it's a rough draft", "wip", "Private");
			},
		}));

		profileButtons.append(createButton({
			name: "View Profile 1",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("somanystories");
			},
		}));

		profileButtons.append(createButton({
			name: "Create Profile 2",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("single story author", "justonestory");
				await BUTTON_REGISTRY.createWork.execute("one big work", "it's long", "bigstory", "Ongoing", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story", "start of a long story", "bigstory", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story 2", "middle of a long story", "bigstory", "Public");
				await BUTTON_REGISTRY.createChapter.execute("big story 3", "still the middle of a long story", "bigstory", "Public");
				await BUTTON_REGISTRY.follow.execute("work", "debut");
			},
		}));

		profileButtons.append(createButton({
			name: "View Profile 2",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("justonestory");
			},
		}));

		profileButtons.append(createButton({
			name: "Create Profile 3",
			async execute () {
				await BUTTON_REGISTRY.createAuthor.execute("prolific follower", "ifollowpeople");
				await BUTTON_REGISTRY.follow.execute("author", "somanystories");
				await BUTTON_REGISTRY.follow.execute("author", "justonestory");
				await BUTTON_REGISTRY.follow.execute("work", "debut");
				await BUTTON_REGISTRY.follow.execute("work", "sequel");
				await BUTTON_REGISTRY.follow.execute("work", "wip");
				await BUTTON_REGISTRY.follow.execute("work", "bigstory");
			},
		}));

		profileButtons.append(createButton({
			name: "View Profile 3",
			async execute () {
				await BUTTON_REGISTRY.viewAuthor.execute("ifollowpeople");
			},
		}));

	}
}


