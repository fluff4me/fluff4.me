export interface PopupDefinition {
	width: number;
	height: number;
}

export default function popup (url: string, width = 600, height = 800) {
	const left = (window.innerWidth - width) / 2 + window.screenLeft;
	const top = (window.innerHeight - height) / 2 + window.screenTop;
	return new Promise<void>(resolve => {
		const options = "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left;
		const oauthPopup = window.open(url, "Discord OAuth", options);
		const interval = setInterval(() => {
			if (oauthPopup?.closed) {
				clearInterval(interval);
				resolve();
			}
		}, 100);
	});
}
