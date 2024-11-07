import Component from "ui/Component"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

export interface DialogExtensions {
	willClose: State<boolean>
	willOpen: State<boolean>
	opened: State<boolean>

	setNotModal (notModal?: boolean): this
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
	const willOpen = State(false)
	const willClose = State(false)
	let modal = true

	let unbind: UnsubscribeState | undefined
	const dialog = Component("dialog")
		.style("dialog")
		.style.bind(opened, "dialog--open")
		.extend<DialogExtensions>(dialog => ({
			opened,
			willClose,
			willOpen,
			setNotModal: (notModal = true) => {
				modal = !notModal
				dialog.style.toggle(notModal, "dialog--not-modal")
				return dialog
			},
			setFullscreen: (fullscreen = true) => dialog.style.toggle(fullscreen, "dialog--fullscreen"),

			open: () => {
				dialog.willOpen.value = true
				if (!dialog.willOpen.value)
					return dialog

				unbind?.()
				dialog.element[modal ? "showModal" : "show"]()
				dialog.opened.value = true
				dialog.willOpen.value = false
				return dialog
			},
			close: () => {
				dialog.willClose.value = true
				if (!dialog.willClose.value)
					return dialog

				unbind?.()
				dialog.element.close()
				dialog.opened.value = false
				dialog.willClose.value = false
				return dialog
			},
			toggle: (open = !dialog.opened.value) => {
				const willChangeStateName = open ? "willOpen" : "willClose"
				dialog[willChangeStateName].value = true
				if (!dialog[willChangeStateName].value)
					return dialog

				unbind?.()
				if (open)
					dialog.element[modal ? "showModal" : "show"]()
				else
					dialog.element.close()

				dialog.opened.value = open ?? !dialog.opened.value
				dialog[willChangeStateName].value = false
				return dialog
			},
			bind: state => {
				unbind?.()
				unbind = state.use(dialog, open => {
					const willChangeStateName = open ? "willOpen" : "willClose"
					dialog[willChangeStateName].value = true

					if (open)
						dialog.element[modal ? "showModal" : "show"]()
					else
						dialog.element.close()

					dialog.opened.value = open
					dialog[willChangeStateName].value = false
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
