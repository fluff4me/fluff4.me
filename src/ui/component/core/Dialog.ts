import Component from "ui/Component"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

export interface DialogExtensions {
	opened: State<boolean>

	setFullscreen (fullscreen?: boolean): this

	open (): this
	close (): this
	toggle (open?: boolean): this
	bind (state: State<boolean>): this
	unbind (): this
}

interface Dialog extends Component, DialogExtensions { }

const Dialog = Component.Builder((): Dialog => {

	const opened = State(false)

	let unbind: UnsubscribeState | undefined
	const dialog = Component("dialog")
		.style("dialog")
		.style.bind(opened, "dialog--open")
		.extend<DialogExtensions>(dialog => ({
			opened,
			setFullscreen: (fullscreen = true) => dialog.style.toggle(fullscreen, "dialog--fullscreen"),

			open: () => {
				unbind?.()
				dialog.element.showModal()
				dialog.opened.value = true
				return dialog
			},
			close: () => {
				unbind?.()
				dialog.element.close()
				dialog.opened.value = false
				return dialog
			},
			toggle: (open = !dialog.opened.value) => {
				unbind?.()
				if (open)
					dialog.element.showModal()
				else
					dialog.element.close()
				dialog.opened.value = open ?? !dialog.opened.value
				return dialog
			},
			bind: state => {
				unbind?.()
				unbind = state.use(dialog, open => {
					if (open)
						dialog.element.showModal()
					else
						dialog.element.close()
					dialog.opened.value = open
				})
				return dialog
			},
			unbind: () => {
				unbind?.()
				return dialog
			},
		}))

	return dialog
})

export default Dialog
