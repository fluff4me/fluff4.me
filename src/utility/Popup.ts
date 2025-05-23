import type { Quilt } from 'ui/utility/StringApplicator'
import { quilt, QuiltHelper } from 'ui/utility/StringApplicator'
import State from 'utility/State'
import Store from 'utility/Store'

declare module 'utility/Store' {
	interface ILocalStorage {
		popupError: PopupError
	}
}

export interface PopupError {
	code: number
	message: string
}

export interface PopupDefinition {
	translation?: Quilt.SimpleKey | Quilt.Handler
	url?: string
	width?: number
	height?: number
}

export interface PopupPromise extends Promise<void> {
	toastError (): Promise<boolean>
}

export interface Popup extends PopupDefinition {
	show (owner: State.Owner, definition?: PopupDefinition): PopupPromise
}

const defaultWidth = 600, defaultHeight = 800

function Popup (baseDefinition: PopupDefinition): Popup {
	return {
		...baseDefinition,
		show (owner, instanceDefinition) {
			const url = instanceDefinition?.url ?? baseDefinition.url
			if (!url) {
				// eslint-disable-next-line no-debugger
				debugger
				console.error('Popup URL is not defined')
				const result = Object.assign(Promise.resolve(), { toastError () { return Promise.resolve(false) } })
				return result
			}

			const translation = instanceDefinition?.translation ?? baseDefinition.translation
			const width = instanceDefinition?.width ?? baseDefinition.width ?? defaultWidth
			const height = instanceDefinition?.height ?? baseDefinition.height ?? defaultHeight
			const left = (window.innerWidth - width) / 2 + window.screenLeft
			const top = (window.innerHeight - height) / 2 + window.screenTop

			let toastError = false

			const result = Object.assign(
				new Promise<void>((resolve, reject) => {
					delete Store.items.popupError
					const options = ''
						+ 'width=' + width
						+ ',height=' + height
						+ ',top=' + top
						+ ',left=' + left
					const name = typeof translation === 'string' ? quilt[translation]() : translation?.(quilt, QuiltHelper)
					const oauthPopup = window.open(url, name?.toString(), options)

					const unsubscribe = State.Owner.getOwnershipState(owner).matchManual(true, () => oauthPopup?.close())

					const interval = setInterval(() => {
						if (oauthPopup?.closed) {
							unsubscribe()

							clearInterval(interval)
							const popupError = Store.items.popupError
							if (popupError) {
								const error = Object.assign(new Error(popupError.message ?? 'Internal Server Error'), { code: popupError.code })
								if (!toastError)
									return reject(error)

								toast.handleError(error)
							}

							(resolve as (value: boolean | undefined) => unknown)(toastError ? !popupError : undefined)
						}
					}, 100)
				}),
				{
					toastError () {
						toastError = true
						return result as any as Promise<boolean>
					},
				}
			)
			return result
		},
	}
}

export default Popup
