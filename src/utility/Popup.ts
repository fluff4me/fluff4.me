import Store from "utility/Store"

declare module "utility/Store" {
	interface ILocalStorage {
		popupError: PopupError
	}
}

export interface PopupError {
	code: number
	message: string
}

export interface PopupDefinition {
	width: number
	height: number
}

export default function popup (name: string, url: string, width = 600, height = 800) {
	const left = (window.innerWidth - width) / 2 + window.screenLeft
	const top = (window.innerHeight - height) / 2 + window.screenTop
	return new Promise<void>((resolve, reject) => {
		delete Store.items.popupError
		const options = "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left
		const oauthPopup = window.open(url, name, options)
		const interval = setInterval(() => {
			if (oauthPopup?.closed) {
				clearInterval(interval)
				const popupError = Store.items.popupError
				if (popupError)
					return reject(Object.assign(new Error(popupError.message ?? "Internal Server Error"), { code: popupError.code }))

				resolve()
			}
		}, 100)
	})
}
