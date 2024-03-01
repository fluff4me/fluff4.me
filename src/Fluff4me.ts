import UiEventBus from "ui/UiEventBus";
import Env from "utility/Env";
import popup from "utility/Popup";

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

		async function openOAuthPopup () {
			const redirect = encodeURIComponent(`${Env.API_ORIGIN}auth/discord/callback`);
			await popup(`https://discord.com/oauth2/authorize?client_id=611683072173277191&response_type=code&redirect_uri=${redirect}&scope=identify`, 600, 900);
			console.log("closed");
		}

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		document.getElementById("discord")?.addEventListener("click", openOAuthPopup);
	}
}
