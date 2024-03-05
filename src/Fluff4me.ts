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

		type OAuthService = (redirectUri: string) => string;

		const OAUTH_SERVICE_REGISTRY: Record<string, OAuthService> = {
			discord: redirect => `https://discord.com/oauth2/authorize?client_id=611683072173277191&response_type=code&redirect_uri=${redirect}&scope=identify`,
			github: redirect => `https://github.com/login/oauth/authorize?client_id=63576c6eadf592fe3690&redirect_uri=${redirect}&scope=read:user&allow_signup=false`,
		};

		async function openOAuthPopup (serviceName: string) {
			const redirect = encodeURIComponent(`${Env.API_ORIGIN}auth/${serviceName}/callback`);
			await popup(OAUTH_SERVICE_REGISTRY[serviceName](redirect), 600, 900);
			console.log("closed");
		}

		for (const service of Object.keys(OAUTH_SERVICE_REGISTRY))
			document.getElementById(service)
				?.addEventListener("click", () => void openOAuthPopup(service));
	}
}
